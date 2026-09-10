<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\ProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', Project::class);
        $items = Project::query()->with('cover')->orderBy('sort_order')->paginate(15)->withQueryString()->through(fn (Project $project): array => $this->serialize($project));

        return Inertia::render('admin/content/index', ['resource' => 'projects', 'items' => $items]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('admin/content/form', ['resource' => 'projects', 'item' => null]);
    }

    public function store(ProjectRequest $request): RedirectResponse
    {
        $project = DB::transaction(function () use ($request): Project {
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            }
            $project = Project::query()->create($data);
            $this->recordChange('project.created', $project);

            return $project;
        });

        return redirect()->route('admin.projects.edit', $project)->with('success', 'Projeto criado.');
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('admin/content/form', ['resource' => 'projects', 'item' => $this->serialize($project->load('cover'))]);
    }

    public function update(ProjectRequest $request, Project $project): RedirectResponse
    {
        DB::transaction(function () use ($request, $project): void {
            $before = $project->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), ['cover', 'cover_alt']));
            if ($request->hasFile('cover')) {
                $data['cover_media_id'] = $this->createAsset($request->file('cover'), 'cms/images', $request->string('cover_alt')->toString())->id;
            } elseif ($request->has('cover_alt') && $project->cover) {
                $this->updateAssetAlt($project->cover, $request->validated('cover_alt'));
            }
            $project->update($data);
            $this->recordChange('project.updated', $project, $before);
        });

        return back()->with('success', 'Projeto atualizado.');
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
        return ['id' => $project->id, 'name' => $project->title, 'title' => $project->title, 'slug' => $project->slug, 'summary' => $project->summary, 'body' => $project->body, 'status' => $project->status->value, 'cover_url' => $project->cover?->url, 'cover_alt' => $project->cover?->alt_text, 'published_at' => $project->published_at?->toIso8601String(), 'sort_order' => $project->sort_order, 'updated_at' => $project->updated_at?->toIso8601String()];
    }
}
