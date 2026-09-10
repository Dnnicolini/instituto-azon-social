<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\PostRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends AdminController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Post::class);

        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'type' => in_array($request->query('type'), ['article', 'vlog', 'video', 'podcast', 'media'], true) ? $request->query('type') : null,
            'status' => in_array($request->query('status'), ['draft', 'review', 'scheduled', 'published', 'archived'], true) ? $request->query('status') : null,
        ];
        $query = Post::query()->with(['author:id,name', 'cover:id,disk,path,alt_text'])->latest('updated_at');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->where('title', 'like', "%{$filters['search']}%")->orWhere('excerpt', 'like', "%{$filters['search']}%"));
        }
        if ($filters['type'] === 'media') {
            $query->whereIn('type', ['vlog', 'video', 'podcast']);
        } elseif ($filters['type']) {
            $query->where('type', $filters['type']);
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        $posts = $query->paginate(15)->withQueryString()->through(fn (Post $post): array => $this->serialize($post));

        return Inertia::render('admin/content/index', ['resource' => 'posts', 'items' => $posts, 'filters' => $filters]);
    }

    public function create(): Response
    {
        $this->authorize('create', Post::class);

        return Inertia::render('admin/content/form', ['resource' => 'posts', 'item' => null]);
    }

    public function store(PostRequest $request): RedirectResponse
    {
        $post = DB::transaction(function () use ($request): Post {
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            $data['author_id'] = $request->user()->id;
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            $post = Post::query()->create($data);
            $this->recordChange('post.created', $post);

            return $post;
        });

        return redirect()->route('admin.posts.edit', $post)->with('success', 'Conteúdo criado.');
    }

    public function edit(Post $post): Response
    {
        $this->authorize('update', $post);

        return Inertia::render('admin/content/form', ['resource' => 'posts', 'item' => $this->serialize($post->load(['author:id,name', 'cover']))]);
    }

    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        DB::transaction(function () use ($request, $post): void {
            $before = $post->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($request->has('cover_alt') && $post->cover) {
                $post->cover->update(['alt_text' => $request->validated('cover_alt')]);
            }
            $post->update($data);
            $this->recordChange('post.updated', $post, $before);
        });

        return back()->with('success', 'Conteúdo atualizado.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);
        DB::transaction(function () use ($post): void {
            $this->recordChange('post.deleted', $post, $post->attributesToArray());
            $post->delete();
        });

        return redirect()->route('admin.posts.index')->with('success', 'Conteúdo excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(Post $post): array
    {
        return [
            'id' => $post->id, 'slug' => $post->slug, 'title' => $post->title, 'type' => $post->type->value,
            'status' => $post->status->value, 'excerpt' => $post->excerpt, 'body' => $post->body,
            'cover_url' => $post->cover?->url, 'cover_alt' => $post->cover?->alt_text, 'provider' => $post->provider, 'external_url' => $post->external_url,
            'duration_seconds' => $post->duration_seconds, 'published_at' => $post->published_at?->toIso8601String(),
            'scheduled_at' => $post->status->value === 'scheduled' ? $post->published_at?->toIso8601String() : null,
            'seo_title' => $post->seo_title, 'seo_description' => $post->seo_description,
            'author' => $post->relationLoaded('author') ? $post->author?->name : null, 'updated_at' => $post->updated_at?->toIso8601String(),
        ];
    }
}
