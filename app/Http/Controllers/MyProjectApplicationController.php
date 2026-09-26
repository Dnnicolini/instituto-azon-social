<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectApplicationRequest;
use App\Http\Resources\ProjectApplicationResource;
use App\Models\ProjectApplication;
use App\Services\ProjectApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyProjectApplicationController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $applications = $request->user()->projectApplications()->with('project.registrationSetting')->latest()->paginate(15)->withQueryString();
        $applications->through(fn ($application): array => (new ProjectApplicationResource($application))->resolve($request));
        $payload = ['seo' => ['title' => 'Minhas inscrições'], 'applications' => $applications];

        return $request->expectsJson() ? response()->json($payload) : Inertia::render('applications/index', $payload);
    }

    public function show(Request $request, ProjectApplication $application): Response|JsonResponse
    {
        $this->authorize('view', $application);
        $application->load(['project.registrationSetting', 'answers.field', 'files.field', 'histories.user']);
        $payload = ['seo' => ['title' => 'Inscrição '.$application->protocol], 'application' => (new ProjectApplicationResource($application))->resolve($request)];

        return $request->expectsJson() ? response()->json($payload) : Inertia::render('applications/show', $payload);
    }

    public function update(ProjectApplicationRequest $request, ProjectApplication $application, ProjectApplicationService $service): RedirectResponse|JsonResponse
    {
        $this->authorize('editOwn', $application);
        $project = $application->project()->firstOrFail();
        $application = $service->save($project, $request, $application);
        if ($request->expectsJson()) {
            return response()->json(['application' => (new ProjectApplicationResource($application))->resolve($request)]);
        }

        return redirect()->route('applications.show', $application)->with('success', 'Inscrição atualizada.');
    }
}
