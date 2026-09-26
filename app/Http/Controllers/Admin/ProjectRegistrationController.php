<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\ProjectRegistrationConfigurationRequest;
use App\Http\Resources\ProjectRegistrationResource;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectRegistrationController extends AdminController
{
    public function edit(Request $request, Project $project): Response
    {
        $this->authorize('update', $project);
        $project->load('registrationSetting');

        return Inertia::render('admin/projects/registrations/settings', [
            'project' => ['id' => $project->id, 'title' => $project->title],
            'registration' => (new ProjectRegistrationResource($project))->resolve($request),
        ]);
    }

    public function update(ProjectRegistrationConfigurationRequest $request, Project $project): RedirectResponse
    {
        $project->registrationSetting()->updateOrCreate([], array_merge($request->validated(), [
            'allow_editing' => false,
            'edit_deadline' => null,
            'requires_authentication' => false,
        ]));
        $this->recordChange('project.registration.configuration.updated', $project);

        return back()->with('success', 'Configuração das inscrições atualizada.');
    }
}
