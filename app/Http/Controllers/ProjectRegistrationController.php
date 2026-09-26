<?php

namespace App\Http\Controllers;

use App\Enums\ContentStatus;
use App\Enums\ProjectRegistrationType;
use App\Http\Requests\ProjectApplicationRequest;
use App\Http\Resources\ProjectApplicationResource;
use App\Http\Resources\ProjectRegistrationFormResource;
use App\Http\Resources\ProjectRegistrationResource;
use App\Models\Project;
use App\Services\ProjectApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectRegistrationController extends Controller
{
    public function show(Request $request, Project $project): Response|JsonResponse
    {
        $this->ensurePublished($project);
        $project->load(['cover', 'galleryImages.media', 'registrationSetting', 'registrationForm.fields', 'relatedPosts' => fn ($query) => $query->published()->with('cover')->latest('published_at'), 'relatedEvents' => fn ($query) => $query->published()->with('cover')->latest('starts_at')]);
        $payload = $this->payload($request, $project);
        if ($request->expectsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('projects/show', $payload);
    }

    public function create(Request $request, Project $project): Response|RedirectResponse|JsonResponse
    {
        $this->ensurePublished($project);
        $project->load(['cover', 'registrationSetting', 'registrationForm.fields']);
        if ($project->registration_type === ProjectRegistrationType::External && $project->registrationState() === 'open') {
            return redirect()->away((string) $project->registration_url);
        }
        abort_unless($project->registration_enabled && $project->registration_type === ProjectRegistrationType::Internal, 404);
        if ($project->registrationSetting?->requires_authentication && $request->user() === null) {
            return redirect()->guest(route('candidate.login'));
        }
        $application = $request->user()?->projectApplications()->where('project_id', $project->id)->latest('id')->first();
        $payload = array_merge($this->payload($request, $project), [
            'form' => $project->registrationForm ? (new ProjectRegistrationFormResource($project->registrationForm))->resolve($request) : ['fields' => []],
            'application' => $application ? (new ProjectApplicationResource($application->load(['project.registrationSetting', 'answers.field', 'files.field', 'histories.user'])))->resolve($request) : null,
            'confirmation' => $request->session()->get('application_confirmation'),
        ]);
        if ($request->expectsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('projects/apply', $payload);
    }

    public function store(ProjectApplicationRequest $request, Project $project, ProjectApplicationService $service): RedirectResponse|JsonResponse
    {
        $this->ensurePublished($project);
        $application = $service->save($project, $request);
        if ($request->expectsJson()) {
            return (new ProjectApplicationResource($application))->response()->setStatusCode(201);
        }

        if ($request->user()) {
            return redirect()->route('applications.show', $application)->with('success', 'Inscrição realizada com sucesso.');
        }

        return redirect()->route('projects.registration.create', $project)->with('application_confirmation', [
            'protocol' => $application->protocol,
            'message' => $application->project->registrationSetting?->success_message ?: 'Recebemos sua candidatura. Guarde o protocolo para acompanhamento.',
            'submitted_at' => $application->submitted_at?->toIso8601String(),
            'show_url' => null,
        ]);
    }

    private function ensurePublished(Project $project): void
    {
        abort_unless($project->status === ContentStatus::Published && ! $project->published_at?->isFuture(), 404);
    }

    /** @return array<string, mixed> */
    private function payload(Request $request, Project $project): array
    {
        return [
            'seo' => ['title' => $project->title.' | Instituto Azon Social', 'description' => $project->summary],
            'project' => ['id' => $project->id, 'title' => $project->title, 'slug' => $project->slug, 'summary' => $project->summary, 'body' => $project->body, 'cover_url' => $project->cover?->url, 'cover_alt' => $project->cover?->alt_text, 'gallery_images' => $project->galleryImages->map(fn ($image): array => ['id' => $image->id, 'url' => $image->media->url, 'alt' => $image->media->alt_text])->values(), 'related_posts' => $project->relatedPosts->map(fn ($post): array => ['id' => $post->id, 'title' => $post->title, 'slug' => $post->slug, 'type' => $post->type->value, 'excerpt' => $post->excerpt, 'published_at' => $post->published_at?->toIso8601String(), 'cover_url' => $post->cover?->url])->values(), 'related_events' => $project->relatedEvents->map(fn ($event): array => ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug, 'summary' => $event->summary, 'starts_at' => $event->starts_at?->toIso8601String(), 'ends_at' => $event->ends_at?->toIso8601String(), 'cover_url' => $event->cover?->url])->values()],
            'registration' => (new ProjectRegistrationResource($project))->resolve($request),
            'viewer' => $request->user() ? ['id' => $request->user()->id, 'name' => $request->user()->name, 'email' => $request->user()->email, 'authenticated' => true, 'my_applications_url' => route('applications.index')] : null,
        ];
    }
}
