<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\PageRequest;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ];
        $query = Page::query()->latest('updated_at');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->whereLike('title', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('slug', "%{$filters['search']}%", caseSensitive: false));
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        $items = $query->paginate(15)->withQueryString()->through(fn (Page $page): array => $this->serialize($page));

        return Inertia::render('admin/content/index', ['resource' => 'pages', 'items' => $items, 'filters' => $filters]);
    }

    public function create(): Response
    {
        $this->authorize('create', Page::class);

        return Inertia::render('admin/content/form', ['resource' => 'pages', 'item' => null]);
    }

    public function store(PageRequest $request): RedirectResponse
    {
        $page = DB::transaction(function () use ($request): Page {
            $page = Page::query()->create($this->normalizePublication($request->validated()));
            $this->recordChange('page.created', $page);

            return $page;
        });

        return redirect()->route('admin.pages.edit', $page)->with('success', 'Página criada.');
    }

    public function edit(Page $page): Response
    {
        $this->authorize('update', $page);

        return Inertia::render('admin/content/form', ['resource' => 'pages', 'item' => $this->serialize($page)]);
    }

    public function update(PageRequest $request, Page $page): RedirectResponse
    {
        DB::transaction(function () use ($request, $page): void {
            $before = $page->attributesToArray();
            $page->update($this->normalizePublication($request->validated()));
            $this->recordChange('page.updated', $page, $before);
        });

        return redirect()->route('admin.pages.edit', $page)->with('success', 'Página atualizada.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $this->authorize('delete', $page);
        abort_if($page->slug === 'inicio', 422, 'A página inicial não pode ser excluída.');
        DB::transaction(function () use ($page): void {
            $this->recordChange('page.deleted', $page, $page->attributesToArray());
            $page->delete();
        });

        return redirect()->route('admin.pages.index')->with('success', 'Página excluída.');
    }

    /** @return array<string, mixed> */
    private function serialize(Page $page): array
    {
        return ['id' => $page->id, 'title' => $page->title, 'slug' => $page->slug, 'body' => $page->body, 'sections' => $page->sections ?? [], 'status' => $page->status->value, 'published_at' => $page->published_at?->toIso8601String(), 'updated_at' => $page->updated_at?->toIso8601String()];
    }
}
