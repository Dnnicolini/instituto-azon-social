<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\EventRequest;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', Event::class);
        $items = Event::query()->with('cover')->orderByDesc('starts_at')->paginate(15)->withQueryString()->through(fn (Event $event): array => $this->serialize($event));

        return Inertia::render('admin/content/index', ['resource' => 'events', 'items' => $items]);
    }

    public function create(): Response
    {
        $this->authorize('create', Event::class);

        return Inertia::render('admin/content/form', ['resource' => 'events', 'item' => null]);
    }

    public function store(EventRequest $request): RedirectResponse
    {
        $event = DB::transaction(function () use ($request): Event {
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            $event = Event::query()->create($data);
            $this->recordChange('event.created', $event);

            return $event;
        });

        return redirect()->route('admin.events.edit', $event)->with('success', 'Evento criado.');
    }

    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('admin/content/form', ['resource' => 'events', 'item' => $this->serialize($event->load('cover'))]);
    }

    public function update(EventRequest $request, Event $event): RedirectResponse
    {
        DB::transaction(function () use ($request, $event): void {
            $before = $event->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($request->has('cover_alt') && $event->cover) {
                $event->cover->update(['alt_text' => $request->validated('cover_alt')]);
            }
            $event->update($data);
            $this->recordChange('event.updated', $event, $before);
        });

        return back()->with('success', 'Evento atualizado.');
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
        return ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug, 'summary' => $event->summary, 'body' => $event->body, 'status' => $event->status->value, 'starts_at' => $event->starts_at?->toIso8601String(), 'ends_at' => $event->ends_at?->toIso8601String(), 'date_label' => $event->date_label, 'location' => $event->location, 'registration_url' => $event->registration_url, 'cover_url' => $event->cover?->url, 'cover_alt' => $event->cover?->alt_text, 'published_at' => $event->published_at?->toIso8601String(), 'updated_at' => $event->updated_at?->toIso8601String()];
    }
}
