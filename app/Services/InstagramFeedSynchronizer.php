<?php

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\InstagramSyncRun;
use App\Models\MediaAsset;
use App\Models\Post;
use App\Models\SocialIntegration;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class InstagramFeedSynchronizer
{
    private const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    /** @return array{created:int, updated:int, processed:int} */
    public function sync(?int $requestedLimit = null): array
    {
        return $this->syncAccount($this->defaultIntegration(), $requestedLimit, 'direct');
    }

    /** @return array{created:int, updated:int, processed:int} */
    public function syncAccount(SocialIntegration $integration, ?int $requestedLimit = null, string $trigger = 'scheduled'): array
    {
        $token = $integration->access_token;
        if (! $integration->enabled || $integration->paused_at || ! is_string($token) || $token === '') {
            throw new RuntimeException('A sincronização do Instagram ainda não foi configurada.');
        }
        $limit = min(max($requestedLimit ?? (int) config('services.instagram.max_posts', 25), 1), 100);
        $run = InstagramSyncRun::query()->create([
            'social_integration_id' => $integration->id,
            'trigger' => in_array($trigger, ['manual', 'scheduled', 'oauth', 'direct'], true) ? $trigger : 'scheduled',
            'status' => 'running', 'started_at' => now(),
        ]);

        try {
            $items = $this->fetchMediaPages($integration, $token, $limit);
            $reportedUsername = collect($items)
                ->first(fn (array $item): bool => is_string($item['username'] ?? null))['username'] ?? null;
            if (is_string($reportedUsername) && filled($integration->expected_username)
                && ! hash_equals(strtolower((string) $integration->expected_username), strtolower($reportedUsername))) {
                throw new RuntimeException('A Meta devolveu publicações de uma conta diferente da configurada. Reconecte o perfil correto.');
            }
            $result = ['created' => 0, 'updated' => 0, 'processed' => 0];
            foreach (array_slice($items, 0, $limit) as $item) {
                if (! is_string($item['id'] ?? null) || ! preg_match('/^\d{5,64}$/D', $item['id'])) {
                    continue;
                }
                $created = $this->syncItem($item, $integration);
                $result[$created ? 'created' : 'updated']++;
                $result['processed']++;
            }
            $integration->update([
                'last_synced_at' => now(), 'last_successful_sync_at' => now(), 'last_error' => null,
                'username' => $this->stringOrNull($items[0]['username'] ?? null) ?: $integration->username,
                'imported_posts_count' => $integration->posts()->where('source_type', 'automatic')->count(),
            ]);
            $run->update(['status' => 'success', 'processed_count' => $result['processed'], 'created_count' => $result['created'], 'updated_count' => $result['updated'], 'finished_at' => now()]);

            return $result;
        } catch (Throwable $exception) {
            $safe = $this->safeExceptionMessage($exception, $token);
            $integration->update(['last_synced_at' => now(), 'last_error' => Str::limit($safe, 1000)]);
            $run->update(['status' => 'failed', 'error_message' => Str::limit($safe, 1000), 'finished_at' => now()]);
            throw new RuntimeException($safe);
        }
    }

    /** @return list<array<string, mixed>> */
    private function fetchMediaPages(SocialIntegration $integration, string $token, int $limit): array
    {
        $items = [];
        $after = null;

        do {
            $remaining = $limit - count($items);
            $parameters = [
                'fields' => 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}',
                'limit' => min(25, $remaining),
                'access_token' => $token,
            ];
            if ($after) {
                $parameters['after'] = $after;
            }

            $response = Http::acceptJson()->timeout(20)->retry([300, 900], throw: false)->get(
                $this->graphUrl().'/'.($integration->account_id ?: 'me').'/media',
                $parameters,
            );
            $this->ensureSuccessful($response, 'consultar as publicações');
            $page = $response->json('data');
            if (! is_array($page)) {
                throw new RuntimeException('A Meta devolveu uma lista de publicações inválida.');
            }

            foreach ($page as $item) {
                if (is_array($item)) {
                    $items[] = $item;
                }
            }

            $next = $response->json('paging.cursors.after');
            $after = is_string($next) && $next !== '' && $next !== $after ? $next : null;
        } while ($after && count($items) < $limit && $page !== []);

        return array_slice($items, 0, $limit);
    }

    public function refreshToken(?SocialIntegration $integration = null): bool
    {
        $integration ??= $this->defaultIntegration();
        $token = $integration->access_token;
        if (! $integration->enabled || ! is_string($token) || $token === '' || $integration->token_expires_at?->isAfter(now()->addDays(45))) {
            return false;
        }
        try {
            $response = Http::acceptJson()->timeout(20)->retry([300, 900], throw: false)->get($this->graphUrl().'/refresh_access_token', ['grant_type' => 'ig_refresh_token', 'access_token' => $token]);
            $this->ensureSuccessful($response, 'renovar a autorização');
        } catch (Throwable $exception) {
            throw new RuntimeException($this->safeExceptionMessage($exception, $token));
        }
        $refreshedToken = $response->json('access_token');
        if (! is_string($refreshedToken) || $refreshedToken === '') {
            throw new RuntimeException('A Meta não devolveu o token renovado.');
        }
        $expiresIn = filter_var($response->json('expires_in'), FILTER_VALIDATE_INT);
        $integration->update(['access_token' => $refreshedToken, 'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null, 'last_error' => null]);

        return true;
    }

    /** @param array<string,mixed> $item */
    private function syncItem(array $item, SocialIntegration $integration): bool
    {
        $providerId = (string) $item['id'];
        $permalink = $this->validatedPermalink($item['permalink'] ?? null);
        $caption = trim((string) ($item['caption'] ?? ''));
        $plainCaption = preg_replace('/\s+/u', ' ', $caption) ?: '';
        $title = Str::limit($plainCaption ?: 'Publicação do Instagram', 90, '');
        $excerpt = Str::limit($plainCaption ?: 'Nova publicação no Instagram.', 220);
        $publishedAt = $this->publishedAt($item['timestamp'] ?? null);
        $candidate = Str::upper((string) ($item['media_type'] ?? 'IMAGE'));
        $mediaType = in_array($candidate, ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], true) ? $candidate : 'IMAGE';
        $existing = $this->postQuery($integration, $providerId, $permalink)->first();
        $image = ! $existing || ! $existing->cover_media_id ? $this->downloadImage($this->imageUrl($item), $providerId, $excerpt) : null;

        return DB::transaction(function () use ($integration, $providerId, $permalink, $caption, $title, $excerpt, $publishedAt, $mediaType, $image, $item): bool {
            $post = $this->postQuery($integration, $providerId, $permalink)->lockForUpdate()->first();
            $created = ! $post;
            $post ??= new Post([
                'type' => PostType::Social, 'slug' => 'instagram-'.$providerId, 'provider' => 'instagram',
                'status' => $integration->auto_publish ? ContentStatus::Published : ContentStatus::Review,
                'published_at' => $integration->auto_publish ? $publishedAt : null,
            ]);
            $source = [
                'type' => PostType::Social, 'provider' => 'instagram', 'social_integration_id' => $integration->id,
                'provider_media_id' => $providerId, 'provider_media_type' => $mediaType, 'source_type' => 'automatic',
                'original_caption' => $caption ?: null, 'external_url' => $permalink,
                'source_available' => $post->exists ? $post->source_available : true,
                'source_checked_at' => now(), 'source_published_at' => $publishedAt,
            ];
            if (! $post->exists) {
                $source += ['title' => $title, 'excerpt' => $excerpt, 'body' => $caption ?: $excerpt];
            }
            $post->fill($source);
            if ($image) {
                $post->cover()->associate($image);
            }
            $post->save();

            $children = is_array($item['children']['data'] ?? null) ? $item['children']['data'] : [$item];
            $post->instagramMediaItems()->delete();
            foreach (array_values($children) as $position => $child) {
                if (! is_array($child)) {
                    continue;
                }
                $post->instagramMediaItems()->create([
                    'provider_media_id' => $this->stringOrNull($child['id'] ?? null),
                    'media_type' => Str::upper((string) ($child['media_type'] ?? $mediaType)),
                    'media_url' => $this->allowedMediaUrl($child['media_url'] ?? null),
                    'thumbnail_url' => $this->allowedMediaUrl($child['thumbnail_url'] ?? null),
                    'position' => $position,
                ]);
            }

            return $created;
        });
    }

    /** @return Builder<Post> */
    private function postQuery(SocialIntegration $integration, string $providerId, ?string $permalink): Builder
    {
        return Post::query()->where('provider', 'instagram')
            ->where(fn ($query) => $query->where('social_integration_id', $integration->id)->orWhereNull('social_integration_id'))
            ->where(function ($query) use ($providerId, $permalink): void {
                $query->where('provider_media_id', $providerId);
                if ($permalink) {
                    $query->orWhere('external_url', $permalink);
                }
            });
    }

    private function defaultIntegration(): SocialIntegration
    {
        $username = (string) config('services.instagram.username', 'azon.social');
        $integration = SocialIntegration::query()->firstOrCreate(['provider' => 'instagram', 'expected_username' => $username], [
            'display_name' => 'Instituto Azon Social', 'account_id' => config('services.instagram.account_id'), 'username' => $username,
            'access_token' => config('services.instagram.access_token'), 'token_expires_at' => config('services.instagram.token_expires_at'), 'enabled' => (bool) config('services.instagram.enabled'),
        ]);
        if (! $integration->access_token && config('services.instagram.access_token')) {
            $integration->update(['account_id' => config('services.instagram.account_id'), 'username' => $username, 'access_token' => config('services.instagram.access_token'), 'token_expires_at' => config('services.instagram.token_expires_at'), 'enabled' => (bool) config('services.instagram.enabled')]);
        }

        return $integration->fresh();
    }

    /** @param array<string,mixed> $item */
    private function imageUrl(array $item): ?string
    {
        $candidate = ($item['media_type'] ?? null) === 'VIDEO' ? ($item['thumbnail_url'] ?? null) : ($item['media_url'] ?? null);
        if (! $candidate && is_array($item['children']['data'] ?? null)) {
            $child = $item['children']['data'][0] ?? [];
            $candidate = is_array($child) ? (($child['media_type'] ?? null) === 'VIDEO' ? ($child['thumbnail_url'] ?? null) : ($child['media_url'] ?? null)) : null;
        }

        return $this->stringOrNull($candidate);
    }

    private function downloadImage(?string $url, string $providerId, string $altText): ?MediaAsset
    {
        if (! $url || ! $this->isAllowedMediaUrl($url)) {
            return null;
        }
        $response = Http::withOptions(['allow_redirects' => false, 'stream' => true])->timeout(25)->retry([300, 900], throw: false)->get($url);
        if (! $response->successful()) {
            return null;
        }
        $length = filter_var($response->header('Content-Length'), FILTER_VALIDATE_INT);
        if (is_int($length) && $length > self::MAX_IMAGE_BYTES) {
            return null;
        }
        $stream = $response->toPsrResponse()->getBody();
        $body = '';
        while (! $stream->eof() && strlen($body) <= self::MAX_IMAGE_BYTES) {
            $body .= $stream->read(min(8192, self::MAX_IMAGE_BYTES + 1 - strlen($body)));
        }
        $mime = strtolower(trim(explode(';', (string) $response->header('Content-Type'))[0]));
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $dimensions = strlen($body) <= self::MAX_IMAGE_BYTES ? @getimagesizefromstring($body) : false;
        if (! isset($extensions[$mime]) || ! is_array($dimensions) || image_type_to_mime_type($dimensions[2]) !== $mime) {
            return null;
        }
        $path = 'instagram/'.$providerId.'.'.$extensions[$mime];
        $disk = (string) config('filesystems.media_disk', 'public');
        if (! Storage::disk($disk)->put($path, $body, ['ContentType' => $mime, 'CacheControl' => 'public, max-age=31536000, immutable'])) {
            return null;
        }

        return MediaAsset::query()->updateOrCreate(['disk' => $disk, 'path' => $path], [
            'original_name' => basename($path), 'mime_type' => $mime, 'size' => strlen($body),
            'alt_text' => Str::limit('Publicação do Instagram: '.$altText, 240), 'width' => $dimensions[0], 'height' => $dimensions[1],
        ]);
    }

    private function isAllowedMediaUrl(string $url): bool
    {
        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));

        return ($parts['scheme'] ?? null) === 'https' && ($host === 'cdninstagram.com' || str_ends_with($host, '.cdninstagram.com') || $host === 'fbcdn.net' || str_ends_with($host, '.fbcdn.net'));
    }

    private function allowedMediaUrl(mixed $url): ?string
    {
        return is_string($url) && $this->isAllowedMediaUrl($url) ? $url : null;
    }

    private function validatedPermalink(mixed $url): ?string
    {
        if (! is_string($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return $scheme === 'https' && in_array($host, ['instagram.com', 'www.instagram.com'], true) ? $url : null;
    }

    private function publishedAt(mixed $timestamp): CarbonInterface
    {
        try {
            return is_string($timestamp) ? CarbonImmutable::parse($timestamp) : now();
        } catch (Throwable) {
            return now();
        }
    }

    private function graphUrl(): string
    {
        return rtrim((string) config('services.instagram.graph_url', 'https://graph.instagram.com'), '/');
    }

    private function stringOrNull(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private function safeExceptionMessage(Throwable $exception, string $token): string
    {
        $message = Str::replace($token, '[credencial protegida]', $exception->getMessage());
        $message = preg_replace('/([?&]access_token=)[^&\s]+/i', '$1[credencial protegida]', $message) ?: '';

        return $message !== '' ? Str::limit($message, 900) : 'Falha de comunicação com a Meta. Tente novamente mais tarde.';
    }

    private function ensureSuccessful(Response $response, string $operation): void
    {
        if ($response->successful()) {
            return;
        }
        $message = $response->json('error.message');
        throw new RuntimeException(sprintf('Não foi possível %s no Instagram (HTTP %d%s).', $operation, $response->status(), is_string($message) && $message !== '' ? ': '.Str::limit($message, 240) : ''));
    }
}
