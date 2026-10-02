<?php

namespace App\Http\Controllers\Admin;

use App\Models\Page;
use App\Support\ChannelCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChannelController extends AdminController
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', Page::class);

        $pages = Page::query()
            ->with(['socialIntegration' => fn ($query) => $query->withCount('posts')])
            ->whereIn('slug', ChannelCatalog::slugs())
            ->get()
            ->sortBy(fn (Page $page): int => (int) array_search($page->slug, ChannelCatalog::slugs(), true))
            ->values()
            ->map(function (Page $page): array {
                $integration = $page->socialIntegration;

                return [
                    'id' => $page->id,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status->value,
                    'sections_count' => count($page->sections ?? []),
                    'updated_at' => $page->updated_at?->toIso8601String(),
                    'instagram' => $integration ? [
                        'id' => $integration->id,
                        'display_name' => $integration->display_name,
                        'username' => $integration->username ?: $integration->expected_username,
                        'connected' => $integration->enabled && filled($integration->access_token),
                        'public_enabled' => $integration->public_enabled,
                        'last_success_at' => $integration->last_successful_sync_at?->toIso8601String(),
                        'posts_count' => $integration->posts_count,
                        'last_error' => $integration->last_error,
                    ] : null,
                ];
            });

        return Inertia::render('admin/channels/index', ['channels' => $pages]);
    }
}
