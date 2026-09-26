<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\ProjectRegistrationFormRequest;
use App\Http\Resources\ProjectRegistrationFormResource;
use App\Models\Project;
use App\Models\ProjectRegistrationField;
use App\Models\ProjectRegistrationForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProjectRegistrationFormController extends AdminController
{
    public function edit(Request $request, Project $project): Response
    {
        $this->authorize('update', $project);
        $form = ProjectRegistrationForm::query()->firstOrCreate(['project_id' => $project->id]);
        $form->load('fields');

        return Inertia::render('admin/projects/registrations/form', [
            'project' => ['id' => $project->id, 'title' => $project->title],
            'form' => (new ProjectRegistrationFormResource($form))->resolve($request),
            'sourceProjects' => Project::query()->whereKeyNot($project->id)->whereHas('registrationForm.fields')->orderBy('title')->get(['id', 'title']),
        ]);
    }

    public function update(ProjectRegistrationFormRequest $request, Project $project): RedirectResponse
    {
        DB::transaction(function () use ($request, $project): void {
            $form = ProjectRegistrationForm::query()->lockForUpdate()->firstOrCreate(['project_id' => $project->id]);
            $kept = [];
            foreach ($request->validated('fields') as $fieldData) {
                $identifier = $fieldData['identifier'];
                $field = ProjectRegistrationField::query()->updateOrCreate(
                    ['form_id' => $form->id, 'identifier' => $identifier],
                    [...$fieldData, 'is_active' => true],
                );
                $kept[] = $field->id;
            }
            ProjectRegistrationField::query()->where('form_id', $form->id)->whereNotIn('id', $kept)->update(['is_active' => false]);
            $form->increment('version');
            $this->recordChange('project.registration.form.updated', $project);
        });

        return back()->with('success', 'Formulário atualizado.');
    }

    public function duplicate(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);
        $validated = $request->validate(['source_project_id' => ['required', 'integer', 'not_in:'.$project->id, 'exists:projects,id']]);
        $source = Project::query()->with('registrationForm.fields')->whereKey($validated['source_project_id'])->firstOrFail();
        throw_unless($source->registrationForm, ValidationException::withMessages(['source_project_id' => 'O projeto selecionado não possui formulário.']));

        DB::transaction(function () use ($project, $source): void {
            $form = ProjectRegistrationForm::query()->firstOrCreate(['project_id' => $project->id]);
            throw_if(ProjectRegistrationField::query()->where('form_id', $form->id)->where(fn ($query) => $query->whereHas('answers')->orWhereHas('files'))->exists(), ValidationException::withMessages(['source_project_id' => 'Não é possível substituir um formulário que já possui respostas.']));
            ProjectRegistrationField::query()->where('form_id', $form->id)->whereDoesntHave('answers')->whereDoesntHave('files')->delete();
            ProjectRegistrationField::query()->where('form_id', $form->id)->update(['is_active' => false]);
            foreach ($source->registrationForm->fields as $field) {
                $form->fields()->create($field->only($field->getFillable()));
            }
            $form->increment('version');
            $this->recordChange('project.registration.form.duplicated', $project);
        });

        return back()->with('success', 'Formulário duplicado sem copiar candidaturas.');
    }
}
