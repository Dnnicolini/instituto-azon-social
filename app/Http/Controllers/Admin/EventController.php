<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\EventRequest;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends AdminController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Event::class);
        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'status' => in_array($request->query('status'), ['draft', 'review', 'scheduled', 'published', 'archived'], true) ? $request->query('status') : null,
            'period' => in_array($request->query('period'), ['upcoming', 'past'], true) ? $request->query('period') : null,
        ];
        $query = Event::query()->with('cover')->orderByDesc('starts_at');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->whereLike('title', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('summary', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('location', "%{$filters['search']}%", caseSensitive: false));
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        if ($filters['period'] === 'upcoming') {
            $query->where(fn ($query) => $query->whereNull('ends_at')->where('starts_at', '>=', now())
                ->orWhere('ends_at', '>=', now()));
        } elseif ($filters['period'] === 'past') {
            $query->where(fn ($query) => $query->whereNotNull('ends_at')->where('ends_at', '<', now())
                ->orWhere(fn ($query) => $query->whereNull('ends_at')->where('starts_at', '<', now())));
        }
        $items = $query->paginate(15)->withQueryString()->through(fn (Event $event): array => $this->serialize($event));

        return Inertia::render('admin/content/index', ['resource' => 'events', 'items' => $items, 'filters' => $filters]);
    }

    public function create(): Response
    {
        $this->authorize('create', Event::class);

        return Inertia::render('admin/content/form', ['resource' => 'events', 'item' => null, 'projectOptions' => $this->projectOptions()]);
    }

    public function store(EventRequest $request): RedirectResponse
    {
        $event = DB::transaction(function () use ($request): Event {
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt', 'gallery', 'remove_gallery_ids', 'project_ids']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            $event = Event::query()->create($data);
            $this->updateGallery($request, $event, $event->title);
            $event->projects()->sync($request->validated('project_ids', []));
            $this->recordChange('event.created', $event);

            return $event;
        });

        return redirect()->route('admin.events.edit', $event)->with('success', 'Evento criado.');
    }

    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('admin/content/form', ['resource' => 'events', 'item' => $this->serialize($event->load(['cover', 'galleryImages.media', 'projects:id'])), 'projectOptions' => $this->projectOptions()]);
    }

    public function update(EventRequest $request, Event $event): RedirectResponse
    {
        DB::transaction(function () use ($request, $event): void {
            $before = $event->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt', 'gallery', 'remove_gallery_ids', 'project_ids']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($request->has('cover_alt') && $event->cover) {
                $this->updateAssetAlt($event->cover, $request->validated('cover_alt'));
            }
            $event->update($data);
            $this->updateGallery($request, $event, $event->title);
            $event->projects()->sync($request->validated('project_ids', []));
            $this->recordChange('event.updated', $event, $before);
        });

        return redirect()->route('admin.events.edit', $event)->with('success', 'Evento atualizado.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);
        DB::transaction(function () use ($event): void {
            $this->recordChange('event.deleted', $event, $event->attributesToArray());
            $event->delete();
        });

        return redirect()->route('admin.events.index')->with('success', 'Evento excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(Event $event): array
    {
        return ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug, 'summary' => $event->summary, 'body' => $event->body, 'status' => $event->status->value, 'starts_at' => $event->starts_at?->toIso8601String(), 'ends_at' => $event->ends_at?->toIso8601String(), 'date_label' => $event->date_label, 'location' => $event->location, 'registration_url' => $event->registration_url, 'participation_details' => $event->participation_details, 'cover_url' => $event->cover?->url, 'cover_alt' => $event->cover?->alt_text, 'gallery_images' => $event->relationLoaded('galleryImages') ? $event->galleryImages->map(fn ($image): array => ['id' => $image->id, 'url' => $image->media->url, 'alt' => $image->media->alt_text])->values() : [], 'project_ids' => $event->relationLoaded('projects') ? $event->projects->pluck('id')->values() : [], 'published_at' => $event->published_at?->toIso8601String(), 'updated_at' => $event->updated_at?->toIso8601String()];
    }
}
