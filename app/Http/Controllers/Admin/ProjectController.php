<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\ProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends AdminController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);
        $filters = $this->contentFilters($request);
        $query = Project::query()->with(['cover', 'registrationSetting'])->withCount(['applications as applications_count' => fn ($query) => $query->whereNotIn('status', ['draft', 'cancelled'])])->orderBy('sort_order');
        if ($filters['search'] !== '') {
            $query->where(fn ($query) => $query->whereLike('title', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('summary', "%{$filters['search']}%", caseSensitive: false)
                ->orWhereLike('badge_label', "%{$filters['search']}%", caseSensitive: false));
        }
        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        $items = $query->paginate(15)->withQueryString()->through(fn (Project $project): array => $this->serialize($project));

        return Inertia::render('admin/content/index', ['resource' => 'projects', 'items' => $items, 'filters' => $filters]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('admin/content/form', ['resource' => 'projects', 'item' => null]);
    }

    public function store(ProjectRequest $request): RedirectResponse
    {
        $project = DB::transaction(function () use ($request): Project {
            $data = $this->normalizeProjectData($request->validated());
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            $project = Project::query()->create($data);
            $this->syncRegistrationSetting($request, $project);
            $this->updateGallery($request, $project, $project->title);
            $this->recordChange('project.created', $project);

            return $project;
        });

        return redirect()->route('admin.projects.edit', $project)->with('success', 'Projeto criado.');
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('admin/content/form', ['resource' => 'projects', 'item' => $this->serialize($project->load(['cover', 'galleryImages.media', 'registrationSetting']))]);
    }

    public function update(ProjectRequest $request, Project $project): RedirectResponse
    {
        DB::transaction(function () use ($request, $project): void {
            $before = $project->attributesToArray();
            $data = $this->normalizeProjectData($request->validated(), $project);
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($request->has('cover_alt') && $project->cover) {
                $this->updateAssetAlt($project->cover, $request->validated('cover_alt'));
            }
            $project->update($data);
            $this->syncRegistrationSetting($request, $project);
            $this->updateGallery($request, $project, $project->title);
            $this->recordChange('project.updated', $project, $before);
        });

        return redirect()->route('admin.projects.edit', $project)->with('success', 'Projeto atualizado.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);
        DB::transaction(function () use ($project): void {
            $this->recordChange('project.deleted', $project, $project->attributesToArray());
            $project->delete();
        });

        return redirect()->route('admin.projects.index')->with('success', 'Projeto excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(Project $project): array
    {
        $setting = $project->registrationSetting()->firstOrNew();

        return ['id' => $project->id, 'name' => $project->title, 'title' => $project->title, 'slug' => $project->slug, 'summary' => $project->summary, 'badge_label' => $project->badge_label, 'body' => $project->body, 'status' => $project->status->value, 'cover_url' => $project->cover?->url, 'cover_alt' => $project->cover?->alt_text, 'gallery_images' => $project->relationLoaded('galleryImages') ? $project->galleryImages->map(fn ($image): array => ['id' => $image->id, 'url' => $image->media->url, 'alt' => $image->media->alt_text])->values() : [], 'published_at' => $project->published_at?->toIso8601String(), 'sort_order' => $project->sort_order, 'updated_at' => $project->updated_at?->toIso8601String(), 'registration_enabled' => $project->registration_enabled, 'registration_type' => $project->registration_type?->value, 'registration_url' => $project->registration_url, 'registration_start_at' => $project->registration_start_at?->toIso8601String(), 'registration_end_at' => $project->registration_end_at?->toIso8601String(), 'registration_instructions' => $project->registration_instructions, 'registration_button_label' => $project->registration_button_label, 'registration_title' => $setting->title, 'registration_description' => $setting->description, 'registration_max_applications' => $setting->max_applications, 'registration_allow_editing' => $setting->allow_editing ?? false, 'registration_edit_deadline' => $setting->edit_deadline?->toIso8601String(), 'registration_requires_authentication' => $setting->requires_authentication ?? false, 'registration_one_per_user' => $setting->one_per_user ?? true, 'registration_success_message' => $setting->success_message, 'registration_confirmation_message' => $setting->confirmation_message, 'applications_count' => $project->applications_count ?? $project->applications()->whereNotIn('status', ['draft', 'cancelled'])->count()];
    }

    /** @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function normalizeProjectData(array $validated, ?Project $project = null): array
    {
        $data = Arr::except($validated, [
            'cover', 'cover_alt', 'gallery', 'remove_gallery_ids', 'registration_title', 'registration_description',
            'registration_max_applications', 'registration_allow_editing', 'registration_edit_deadline',
            'registration_requires_authentication', 'registration_one_per_user', 'registration_success_message',
            'registration_confirmation_message',
        ]);
        if (array_key_exists('registration_enabled', $data) || $project === null) {
            $data['registration_enabled'] = (bool) ($data['registration_enabled'] ?? false);
        }
        if (array_key_exists('registration_button_label', $data) || $project === null) {
            $data['registration_button_label'] = ($data['registration_button_label'] ?? null) ?: 'Inscreva-se';
        }
        $enabled = $data['registration_enabled'] ?? ($project instanceof Project ? $project->registration_enabled : false);
        if (! $enabled) {
            $data = array_merge($data, ['registration_type' => null, 'registration_url' => null, 'registration_start_at' => null, 'registration_end_at' => null, 'registration_instructions' => null]);
        } elseif (($data['registration_type'] ?? $project?->registration_type?->value) === 'internal') {
            $data['registration_url'] = null;
        }

        return $this->normalizePublication($data);
    }

    private function syncRegistrationSetting(ProjectRequest $request, Project $project): void
    {
        $mapping = [
            'registration_title' => 'title', 'registration_description' => 'description',
            'registration_max_applications' => 'max_applications', 'registration_allow_editing' => 'allow_editing',
            'registration_edit_deadline' => 'edit_deadline', 'registration_requires_authentication' => 'requires_authentication',
            'registration_one_per_user' => 'one_per_user', 'registration_success_message' => 'success_message',
            'registration_confirmation_message' => 'confirmation_message',
        ];
        $data = [];
        foreach ($mapping as $source => $target) {
            if ($request->exists($source)) {
                $data[$target] = $request->validated($source);
            }
        }
        if ($data !== [] || $project->registration_type?->value === 'internal') {
            $project->registrationSetting()->updateOrCreate([], $data);
        }
    }

    /** @return array{search: string, status: string|null} */
    private function contentFilters(Request $request): array
    {
        return [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'status' => in_array($request->query('status'), ['draft', 'review', 'scheduled', 'published', 'archived'], true) ? $request->query('status') : null,
        ];
    }
}
