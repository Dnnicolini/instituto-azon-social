<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\PostRequest;
use App\Jobs\OptimizeVideoAsset;
use App\Models\Post;
use App\Models\SocialIntegration;
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
        $this->authorizeInstagramCuration($request, $this->section($request) === 'social');

        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'type' => in_array($request->query('type'), ['article', 'vlog', 'video', 'podcast', 'social', 'media'], true) ? $request->query('type') : null,
            'status' => in_array($request->query('status'), ['draft', 'review', 'scheduled', 'published', 'archived'], true) ? $request->query('status') : null,
            'account' => filter_var($request->query('account'), FILTER_VALIDATE_INT) ?: null,
            'media_type' => in_array($request->query('media_type'), ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'], true) ? $request->query('media_type') : null,
            'source_type' => in_array($request->query('source_type'), ['automatic', 'manual'], true) ? $request->query('source_type') : null,
            'from' => is_string($request->query('from')) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $request->query('from')) ? $request->query('from') : null,
            'to' => is_string($request->query('to')) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $request->query('to')) ? $request->query('to') : null,
            'per_page' => $this->perPage($request),
        ];
        $query = Post::query()->latest('updated_at');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->where('title', 'like', "%{$filters['search']}%")
                ->orWhere('excerpt', 'like', "%{$filters['search']}%")
                ->orWhere('original_caption', 'like', "%{$filters['search']}%"));
        }
        if ($filters['type'] === 'media') {
            $query->whereIn('type', ['vlog', 'video', 'podcast']);
        } elseif ($filters['type']) {
            $query->where('type', $filters['type']);
        } else {
            $query->where('type', 'article');
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        if ($filters['account']) {
            $query->where('social_integration_id', $filters['account']);
        }
        if ($filters['media_type']) {
            $query->where('provider_media_type', $filters['media_type']);
        }
        if ($filters['source_type']) {
            $query->where('source_type', $filters['source_type']);
        }
        if ($filters['from']) {
            $query->whereDate('published_at', '>=', $filters['from']);
        }
        if ($filters['to']) {
            $query->whereDate('published_at', '<=', $filters['to']);
        }
        $posts = $query->paginate($filters['per_page'])->withQueryString()->through(fn (Post $post): array => $this->serializeSummary($post));

        return Inertia::render('admin/content/index', [
            'resource' => 'posts',
            'items' => $posts,
            'filters' => $filters,
            'section' => $this->section($request),
            'instagramAccounts' => $this->section($request) === 'social'
                ? SocialIntegration::query()->where('provider', 'instagram')->orderBy('sort_order')->get(['id', 'display_name', 'expected_username'])->map(fn (SocialIntegration $account): array => [
                    'value' => (string) $account->id,
                    'label' => ($account->display_name ?: '@'.$account->expected_username).' · @'.$account->expected_username,
                ])->values()
                : [],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Post::class);

        $section = $this->section($request);
        $initialType = match ($section) {
            'media' => 'vlog',
            'social' => 'social',
            default => in_array($request->query('type'), ['article', 'vlog', 'video', 'podcast', 'social'], true)
                ? (string) $request->query('type')
                : 'article',
        };
        $this->authorizeInstagramCuration($request, $initialType === 'social');

        return Inertia::render('admin/content/form', ['resource' => 'posts', 'item' => null, 'section' => $section, 'initialType' => $initialType, 'projectOptions' => $this->projectOptions()]);
    }

    public function store(PostRequest $request): RedirectResponse
    {
        $this->authorizeInstagramCuration($request, $request->validated('type') === 'social');
        DB::transaction(function () use ($request): void {
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt', 'source_mode', 'video', 'gallery', 'gallery_cover_id', 'remove_gallery_ids', 'project_ids']));
            $data = $this->normalizeSource($request, $data);
            $data['author_id'] = $request->user()->id;
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            if ($request->hasFile('video')) {
                $video = $this->createAsset($request->file('video'), 'cms/media');
                $data['video_media_id'] = $video->id;
                if (str_starts_with((string) $video->mime_type, 'video/')) {
                    OptimizeVideoAsset::dispatch($video->id);
                }
            }
            $post = Post::query()->create($data);
            $this->updateGallery($request, $post, $post->title);
            $post->projects()->sync($request->validated('project_ids', []));
            $this->recordChange('post.created', $post);
        });

        return redirect()->route('admin.posts.index', ['type' => $this->section($request)])->with('success', 'Conteúdo cadastrado com sucesso.');
    }

    public function edit(Request $request, Post $post): Response
    {
        $this->authorize('update', $post);
        $this->authorizeInstagramCuration($request, $post->type->value === 'social');

        return Inertia::render('admin/content/form', ['resource' => 'posts', 'item' => $this->serialize($post->load(['author:id,name', 'cover', 'video', 'galleryImages.media', 'projects:id'])), 'section' => $this->section($request), 'projectOptions' => $this->projectOptions()]);
    }

    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        $this->authorizeInstagramCuration($request, $post->type->value === 'social' || $request->validated('type') === 'social');
        DB::transaction(function () use ($request, $post): void {
            $before = $post->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt', 'source_mode', 'video', 'gallery', 'gallery_cover_id', 'remove_gallery_ids', 'project_ids']));
            $data = $this->normalizeSource($request, $data, $post);
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($galleryCoverId = $this->takeGalleryImageAsCover($request, $post)) {
                $data['cover_media_id'] = $galleryCoverId;
            } elseif ($request->has('cover_alt') && $post->cover) {
                $this->updateAssetAlt($post->cover, $request->validated('cover_alt'));
            }
            if ($request->hasFile('video')) {
                $video = $this->createAsset($request->file('video'), 'cms/media');
                $data['video_media_id'] = $video->id;
                if (str_starts_with((string) $video->mime_type, 'video/')) {
                    OptimizeVideoAsset::dispatch($video->id);
                }
            }
            $post->update($data);
            $this->updateGallery($request, $post, $post->title);
            $post->projects()->sync($request->validated('project_ids', []));
            $this->recordChange('post.updated', $post, $before);
        });

        $routeParameters = ['post' => $post, 'section' => $this->section($request)];
        if (in_array($request->query('type'), ['article', 'vlog', 'video', 'podcast', 'social', 'media'], true)) {
            $routeParameters['type'] = $request->query('type');
        }

        return redirect()->route('admin.posts.edit', $routeParameters)->with('success', 'Conteúdo atualizado.');
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);
        $this->authorizeInstagramCuration($request, $post->type->value === 'social');
        DB::transaction(function () use ($post): void {
            $this->recordChange('post.deleted', $post, $post->attributesToArray());
            $post->delete();
        });

        return redirect()->route('admin.posts.index')->with('success', 'Conteúdo excluído.');
    }

    /** @return array<string, mixed> */
    private function serializeSummary(Post $post): array
    {
        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'title' => $post->title,
            'type' => $post->type->value,
            'status' => $post->status->value,
            'social_integration_id' => $post->social_integration_id,
            'provider_media_type' => $post->provider_media_type,
            'source_type' => $post->source_type,
            'updated_at' => $post->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function serialize(Post $post): array
    {
        return [
            'id' => $post->id, 'slug' => $post->slug, 'title' => $post->title, 'type' => $post->type->value,
            'status' => $post->status->value, 'excerpt' => $post->excerpt, 'body' => $post->body,
            'editorial_summary' => $post->editorial_summary, 'original_caption' => $post->original_caption,
            'source_type' => $post->source_type, 'source_available' => $post->source_available,
            'cover_url' => $post->cover?->url, 'cover_alt' => $post->cover?->alt_text, 'provider' => $post->provider, 'external_url' => $post->external_url,
            'source_mode' => $post->external_url ? 'link' : ($post->video_media_id ? 'upload' : null),
            'video_url' => $post->video?->url, 'video_name' => $post->video?->original_name, 'video_mime_type' => $post->video?->mime_type,
            'duration_seconds' => $post->duration_seconds, 'published_at' => $post->published_at?->toIso8601String(),
            'is_featured' => $post->is_featured, 'sort_order' => $post->sort_order,
            'scheduled_at' => $post->status->value === 'scheduled' ? $post->published_at?->toIso8601String() : null,
            'gallery_images' => $post->relationLoaded('galleryImages') ? $post->galleryImages->map->toMediaPayload()->values() : [],
            'project_ids' => $post->relationLoaded('projects') ? $post->projects->pluck('id')->values() : [],
            'author' => $post->relationLoaded('author') ? $post->author?->name : null, 'updated_at' => $post->updated_at?->toIso8601String(),
        ];
    }

    private function section(Request $request): string
    {
        $section = $request->query('section');
        if (in_array($section, ['media', 'social'], true)) {
            return (string) $section;
        }

        return match ($request->query('type')) {
            'media', 'vlog', 'video', 'podcast' => 'media',
            'social' => 'social',
            default => 'article',
        };
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function normalizeSource(PostRequest $request, array $data, ?Post $post = null): array
    {
        $type = (string) ($data['type'] ?? '');
        $sourceMode = $request->string('source_mode')->toString();

        if ($sourceMode === '') {
            $sourceMode = filled($data['external_url'] ?? null)
                ? 'link'
                : (($request->hasFile('video') || $post?->video_media_id !== null) ? 'upload' : '');
        }

        if (in_array($type, ['vlog', 'video', 'podcast'], true) && $sourceMode === 'upload') {
            $data['provider'] = null;
            $data['external_url'] = null;
        }

        if ((in_array($type, ['vlog', 'video', 'podcast'], true) && $sourceMode === 'link') || $type === 'social') {
            $data['video_media_id'] = null;
        }

        if ($type === 'social') {
            $data['source_type'] = $post?->source_type === 'automatic' ? 'automatic' : 'manual';
        }

        if ($type === 'article') {
            $data['provider'] = null;
            $data['external_url'] = null;
            $data['video_media_id'] = null;
        }

        return $data;
    }

    private function authorizeInstagramCuration(Request $request, bool $required): void
    {
        if ($required) {
            abort_unless($request->user()?->hasPermission('instagram.curate'), 403);
        }
    }
}
