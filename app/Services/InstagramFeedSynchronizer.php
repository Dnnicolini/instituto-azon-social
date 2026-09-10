<?php

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\MediaAsset;
use App\Models\Post;
use App\Models\SocialIntegration;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
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

    /** @return array{created: int, updated: int, processed: int} */
    public function sync(?int $requestedLimit = null): array
    {
        $integration = $this->integration();
        $token = $integration->access_token;

        if (! $integration->enabled || ! is_string($token) || $token === '') {
            throw new RuntimeException('A sincronização do Instagram ainda não foi configurada.');
        }

        $limit = min(max($requestedLimit ?? (int) config('services.instagram.max_posts', 25), 1), 100);
        $endpoint = $this->graphUrl().'/'.($integration->account_id ?: 'me').'/media';

        try {
            $response = Http::acceptJson()
                ->timeout(20)
                ->retry([300, 900], throw: false)
                ->get($endpoint, [
                    'fields' => 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_type,media_url,thumbnail_url}',
                    'limit' => $limit,
                    'access_token' => $token,
                ]);

            $this->ensureSuccessful($response, 'consultar as publicações');
            $items = $response->json('data');
            if (! is_array($items)) {
                throw new RuntimeException('A Meta devolveu uma lista de publicações inválida.');
            }

            $result = ['created' => 0, 'updated' => 0, 'processed' => 0];
            foreach (array_slice($items, 0, $limit) as $item) {
                if (! is_array($item) || ! is_string($item['id'] ?? null) || ! preg_match('/^\d{5,64}$/D', $item['id'])) {
                    continue;
                }

                $created = $this->syncItem($item);
                $result[$created ? 'created' : 'updated']++;
                $result['processed']++;
            }

            $integration->update([
                'last_synced_at' => now(),
                'last_error' => null,
                'username' => $this->stringOrNull($response->json('data.0.username')) ?: $integration->username,
            ]);

            return $result;
        } catch (Throwable $exception) {
            $safeMessage = $this->safeExceptionMessage($exception, $token);
            $integration->update(['last_error' => Str::limit($safeMessage, 1000)]);

            throw new RuntimeException($safeMessage);
        }
    }

    public function refreshToken(): bool
    {
        $integration = $this->integration();
        $token = $integration->access_token;
        if (! $integration->enabled || ! is_string($token) || $token === '') {
            return false;
        }
        if ($integration->token_expires_at?->isAfter(now()->addDays(45))) {
            return false;
        }

        try {
            $response = Http::acceptJson()
                ->timeout(20)
                ->retry([300, 900], throw: false)
                ->get($this->graphUrl().'/refresh_access_token', [
                    'grant_type' => 'ig_refresh_token',
                    'access_token' => $token,
                ]);
        } catch (Throwable $exception) {
            throw new RuntimeException($this->safeExceptionMessage($exception, $token));
        }

        $this->ensureSuccessful($response, 'renovar a autorização');
        $refreshedToken = $response->json('access_token');
        if (! is_string($refreshedToken) || $refreshedToken === '') {
            throw new RuntimeException('A Meta não devolveu o token renovado.');
        }

        $expiresIn = filter_var($response->json('expires_in'), FILTER_VALIDATE_INT);
        $integration->update([
            'access_token' => $refreshedToken,
            'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
            'last_error' => null,
        ]);

        return true;
    }

    /** @param array<string, mixed> $item */
    private function syncItem(array $item): bool
    {
        $providerId = (string) $item['id'];
        $permalink = $this->validatedPermalink($item['permalink'] ?? null);
        $caption = trim((string) ($item['caption'] ?? ''));
        $plainCaption = preg_replace('/\s+/u', ' ', $caption) ?: '';
        $title = Str::limit($plainCaption ?: 'Publicação do Instagram', 90, '');
        $excerpt = Str::limit($plainCaption ?: 'Nova publicação do Instituto Azon Social no Instagram.', 220);
        $publishedAt = $this->publishedAt($item['timestamp'] ?? null);
        $candidateMediaType = Str::upper((string) ($item['media_type'] ?? 'IMAGE'));
        $mediaType = in_array($candidateMediaType, ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], true) ? $candidateMediaType : 'IMAGE';
        $existingPost = Post::query()
            ->where('provider', 'instagram')
            ->where(function ($query) use ($providerId, $permalink): void {
                $query->where('provider_media_id', $providerId);
                if ($permalink) {
                    $query->orWhere('external_url', $permalink);
                }
            })
            ->first();
        $image = ! $existingPost || ! $existingPost->getAttribute('cover_media_id')
            ? $this->downloadImage($this->imageUrl($item), $providerId, $excerpt)
            : null;

        return DB::transaction(function () use ($providerId, $permalink, $caption, $title, $excerpt, $publishedAt, $mediaType, $image): bool {
            $post = Post::query()
                ->where('provider', 'instagram')
                ->where('provider_media_id', $providerId)
                ->first();

            if (! $post && $permalink) {
                $post = Post::query()
                    ->where('provider', 'instagram')
                    ->where('external_url', $permalink)
                    ->first();
            }

            $created = ! $post;
            $post ??= new Post([
                'type' => PostType::Social,
                'slug' => 'instagram-'.$providerId,
                'provider' => 'instagram',
                'status' => ContentStatus::Published,
            ]);

            $post->fill([
                'type' => PostType::Social,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => $caption ?: $excerpt,
                'provider' => 'instagram',
                'provider_media_id' => $providerId,
                'provider_media_type' => $mediaType,
                'external_url' => $permalink,
                'status' => ContentStatus::Published,
                'published_at' => $publishedAt,
            ]);

            if ($image) {
                $post->cover()->associate($image);
            }

            $post->save();

            return $created;
        });
    }

    private function integration(): SocialIntegration
    {
        $integration = SocialIntegration::query()->firstOrCreate(
            ['provider' => 'instagram'],
            [
                'account_id' => config('services.instagram.account_id'),
                'username' => config('services.instagram.username'),
                'access_token' => config('services.instagram.access_token'),
                'token_expires_at' => config('services.instagram.token_expires_at'),
                'enabled' => (bool) config('services.instagram.enabled'),
            ],
        );

        if (! $integration->access_token && config('services.instagram.access_token')) {
            $integration->update([
                'account_id' => config('services.instagram.account_id'),
                'username' => config('services.instagram.username'),
                'access_token' => config('services.instagram.access_token'),
                'token_expires_at' => config('services.instagram.token_expires_at'),
                'enabled' => (bool) config('services.instagram.enabled'),
            ]);
        }

        return $integration->fresh();
    }

    /** @param array<string, mixed> $item */
    private function imageUrl(array $item): ?string
    {
        $candidate = ($item['media_type'] ?? null) === 'VIDEO'
            ? ($item['thumbnail_url'] ?? null)
            : ($item['media_url'] ?? null);

        if (! $candidate && is_array($item['children']['data'] ?? null)) {
            $child = $item['children']['data'][0] ?? [];
            if (is_array($child)) {
                $candidate = ($child['media_type'] ?? null) === 'VIDEO'
                    ? ($child['thumbnail_url'] ?? null)
                    : ($child['media_url'] ?? null);
            }
        }

        return $this->stringOrNull($candidate);
    }

    private function downloadImage(?string $url, string $providerId, string $altText): ?MediaAsset
    {
        if (! $url || ! $this->isAllowedMediaUrl($url)) {
            return null;
        }

        $response = Http::withOptions(['allow_redirects' => false, 'stream' => true])
            ->timeout(25)
            ->retry([300, 900], throw: false)
            ->get($url);
        if (! $response->successful()) {
            return null;
        }

        $declaredLength = filter_var($response->header('Content-Length'), FILTER_VALIDATE_INT);
        if (is_int($declaredLength) && $declaredLength > self::MAX_IMAGE_BYTES) {
            return null;
        }

        $stream = $response->toPsrResponse()->getBody();
        $body = '';
        while (! $stream->eof() && strlen($body) <= self::MAX_IMAGE_BYTES) {
            $body .= $stream->read(min(8192, self::MAX_IMAGE_BYTES + 1 - strlen($body)));
        }

        $mimeType = strtolower(trim(explode(';', (string) $response->header('Content-Type'))[0]));
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (! isset($extensions[$mimeType]) || strlen($body) > self::MAX_IMAGE_BYTES) {
            return null;
        }

        $dimensions = @getimagesizefromstring($body);
        if (! is_array($dimensions)) {
            return null;
        }
        if (image_type_to_mime_type($dimensions[2]) !== $mimeType) {
            return null;
        }

        $path = 'instagram/'.$providerId.'.'.$extensions[$mimeType];
        if (! Storage::disk('public')->put($path, $body)) {
            return null;
        }

        return MediaAsset::query()->updateOrCreate(
            ['disk' => 'public', 'path' => $path],
            [
                'original_name' => basename($path),
                'mime_type' => $mimeType,
                'size' => strlen($body),
                'alt_text' => Str::limit('Publicação do Instagram: '.$altText, 240),
                'width' => $dimensions[0],
                'height' => $dimensions[1],
            ],
        );
    }

    private function isAllowedMediaUrl(string $url): bool
    {
        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));

        return ($parts['scheme'] ?? null) === 'https'
            && ($host === 'cdninstagram.com'
                || str_ends_with($host, '.cdninstagram.com')
                || $host === 'fbcdn.net'
                || str_ends_with($host, '.fbcdn.net'));
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

        return $message !== ''
            ? Str::limit($message, 900)
            : 'Falha de comunicação com a Meta. Tente novamente mais tarde.';
    }

    private function ensureSuccessful(Response $response, string $operation): void
    {
        if ($response->successful()) {
            return;
        }

        $message = $response->json('error.message');
        throw new RuntimeException(sprintf(
            'Não foi possível %s no Instagram (HTTP %d%s).',
            $operation,
            $response->status(),
            is_string($message) && $message !== '' ? ': '.Str::limit($message, 240) : '',
        ));
    }
}
