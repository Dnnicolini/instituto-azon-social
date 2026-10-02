<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\InstagramMediaItem;
use App\Models\Post;
use App\Models\SocialIntegration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class InstagramPublicController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json($this->feed($request))
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function feed(
        Request $request,
        ?int $forcedAccount = null,
        ?string $forcedGroup = null,
        ?int $forcedPerPage = null,
        bool $requireSocialFeedLocation = true,
        ?string $forcedDisplayLocation = null,
    ): LengthAwarePaginator {
        $filters = $request->validate([
            'account' => ['nullable', 'integer', 'min:1'],
            'group' => ['nullable', 'alpha_dash:ascii', 'max:80'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);
        if ($forcedAccount !== null) {
            $filters['account'] = $forcedAccount;
        }
        if ($forcedGroup !== null) {
            unset($filters['account']);
            $filters['group'] = $forcedGroup;
        }

        return Post::query()->published()->where('type', PostType::Social)->where('provider', 'instagram')
            ->where('source_available', true)
            ->where(function ($query) use ($filters, $requireSocialFeedLocation, $forcedDisplayLocation): void {
                if (isset($filters['account'])) {
                    $query->whereHas('socialIntegration', function ($integration) use ($filters, $requireSocialFeedLocation, $forcedDisplayLocation): void {
                        $integration->whereKey($filters['account'])->where('public_enabled', true);
                        if ($forcedDisplayLocation || $requireSocialFeedLocation) {
                            $integration->whereJsonContains('display_locations', $forcedDisplayLocation ?: 'social_feed');
                        }
                        if (isset($filters['group'])) {
                            $integration->where('group_key', $filters['group']);
                        }
                    });

                    return;
                }

                $query->whereHas('socialIntegration', function ($integration) use ($filters, $forcedDisplayLocation): void {
                    $integration->where('public_enabled', true)->whereJsonContains('display_locations', $forcedDisplayLocation ?: 'social_feed');
                    if (isset($filters['group'])) {
                        $integration->where('group_key', $filters['group']);
                    }
                });
                if (! isset($filters['group'])) {
                    $query->orWhere(function ($manual): void {
                        $manual->whereNull('social_integration_id')
                            ->where(fn ($source) => $source->whereNull('source_type')->orWhere('source_type', 'manual'));
                    });
                }
            })
            ->with(['cover', 'socialIntegration:id,display_name,username,expected_username,group_key', 'instagramMediaItems'])
            ->orderByDesc('is_featured')->orderBy('sort_order')->orderByDesc('published_at')
            ->paginate($forcedPerPage ?? (int) ($filters['per_page'] ?? 12))->withQueryString()
            ->through(fn (Post $post): array => $this->serialize($post));
    }

    /** @return array<string, mixed> */
    private function serialize(Post $post): array
    {
        $account = $post->social_integration_id === null ? null : $post->socialIntegration;
        $accountData = $account instanceof SocialIntegration
            ? [
                'id' => $account->id,
                'slug' => $account->expected_username,
                'display_name' => $account->display_name,
                'username' => $account->username ?: $account->expected_username,
                'group_key' => $account->group_key,
            ]
            : [
                'id' => 0,
                'slug' => 'instagram',
                'display_name' => 'Publicação adicionada pela equipe',
                'username' => 'instagram',
                'group_key' => null,
            ];

        return [
            'id' => $post->id, 'title' => $post->title,
            'display_text' => $post->editorial_summary ?: ($post->excerpt ?: ($post->original_caption ?: $post->body)),
            'provider_media_type' => $post->provider_media_type, 'source_type' => $post->source_type ?: 'manual',
            'cover_url' => $post->cover?->url,
            'external_url' => $post->external_url, 'published_at' => ($post->source_published_at ?: $post->published_at)?->toIso8601String(),
            'social_account' => $accountData,
            'items' => $post->instagramMediaItems->map(fn (InstagramMediaItem $item): array => ['type' => $item->media_type, 'media_url' => $item->media_url, 'thumbnail_url' => $item->thumbnail_url])->values(),
        ];
    }
}
