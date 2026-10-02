<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\PageRequest;
use App\Models\Page;
use App\Models\SocialIntegration;
use App\Support\ChannelCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends AdminController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Page::class);
        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'status' => in_array($request->query('status'), ['draft', 'review', 'scheduled', 'published', 'archived'], true) ? $request->query('status') : null,
            'per_page' => $this->perPage($request),
        ];
        $query = Page::query()->with('socialIntegration:id,display_name,expected_username,username')->latest('updated_at');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->whereLike('title', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('slug', "%{$filters['search']}%", caseSensitive: false));
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        $items = $query->paginate($filters['per_page'])->withQueryString()->through(fn (Page $page): array => $this->serializeSummary($page));

        return Inertia::render('admin/content/index', ['resource' => 'pages', 'items' => $items, 'filters' => $filters]);
    }

    public function create(): Response
    {
        $this->authorize('create', Page::class);

        return Inertia::render('admin/content/form', ['resource' => 'pages', 'item' => null]);
    }

    public function store(PageRequest $request): RedirectResponse
    {
        $this->authorizeInstagramLinkChange($request, null, $request->validated('social_integration_id'));
        DB::transaction(function () use ($request): void {
            $page = Page::query()->create($this->normalizePublication(Arr::except($request->validated(), 'return_to')));
            $this->recordChange('page.created', $page);
        });

        return redirect()->route('admin.pages.index')->with('success', 'Página cadastrada com sucesso.');
    }

    public function edit(Request $request, Page $page): Response
    {
        $this->authorize('update', $page);

        $isChannel = ChannelCatalog::contains($page->slug);
        $returnTo = $isChannel && $request->query('context') === 'channels' ? 'channels' : 'pages';
        $instagramAccounts = $isChannel
            ? SocialIntegration::query()->where('provider', 'instagram')->orderBy('sort_order')->get()
                ->map(fn (SocialIntegration $integration): array => [
                    'value' => (string) $integration->id,
                    'label' => ($integration->display_name ?: '@'.$integration->expected_username).' · @'.($integration->username ?: $integration->expected_username),
                ])->values()
            : [];

        return Inertia::render('admin/content/form', [
            'resource' => 'pages',
            'item' => $this->serialize($page),
            'isChannel' => $isChannel,
            'returnTo' => $returnTo,
            'instagramAccounts' => $instagramAccounts,
        ]);
    }

    public function update(PageRequest $request, Page $page): RedirectResponse
    {
        $validated = $request->validated();
        $returnTo = Arr::pull($validated, 'return_to', 'pages');
        $this->authorizeInstagramLinkChange($request, $page->social_integration_id, $validated['social_integration_id'] ?? null);

        DB::transaction(function () use ($validated, $page): void {
            $before = $page->attributesToArray();
            $page->update($this->normalizePublication($validated));
            $this->recordChange('page.updated', $page, $before);
        });

        return redirect()->route($returnTo === 'channels' ? 'admin.channels.index' : 'admin.pages.index')
            ->with('success', 'Página atualizada com sucesso.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $this->authorize('delete', $page);
        abort_if($page->slug === 'inicio' || ChannelCatalog::contains($page->slug), 422, 'Esta página estrutural não pode ser excluída.');
        DB::transaction(function () use ($page): void {
            $this->recordChange('page.deleted', $page, $page->attributesToArray());
            $page->delete();
        });

        return redirect()->route('admin.pages.index')->with('success', 'Página excluída.');
    }

    /** @return array<string, mixed> */
    private function serializeSummary(Page $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'sections_count' => count($page->sections ?? []),
            'is_channel' => ChannelCatalog::contains($page->slug),
            'instagram_account' => $page->socialIntegration ? [
                'id' => $page->socialIntegration->id,
                'display_name' => $page->socialIntegration->display_name,
                'username' => $page->socialIntegration->username ?: $page->socialIntegration->expected_username,
            ] : null,
            'status' => $page->status->value,
            'updated_at' => $page->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function serialize(Page $page): array
    {
        return ['id' => $page->id, 'title' => $page->title, 'slug' => $page->slug, 'social_integration_id' => $page->social_integration_id, 'body' => $page->body, 'sections' => $page->sections ?? [], 'status' => $page->status->value, 'published_at' => $page->published_at?->toIso8601String(), 'updated_at' => $page->updated_at?->toIso8601String()];
    }

    private function authorizeInstagramLinkChange(Request $request, ?int $current, mixed $requested): void
    {
        $next = filled($requested) ? (int) $requested : null;
        if ($current !== $next) {
            abort_unless($request->user()?->hasPermission('instagram.manage'), 403);
        }
    }
}
