<?php

use App\Enums\ContentStatus;
use App\Enums\ProjectApplicationStatus;
use App\Enums\ProjectRegistrationType;
use App\Mail\ProjectApplicationConfirmation;
use App\Models\Project;
use App\Models\ProjectApplication;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

function registrationProject(array $overrides = []): Project
{
    $project = Project::query()->create(array_merge([
        'title' => 'Projeto de formação', 'slug' => 'projeto-formacao', 'badge_label' => 'Formação',
        'status' => ContentStatus::Published, 'published_at' => now()->subMinute(),
        'registration_enabled' => true, 'registration_type' => ProjectRegistrationType::Internal,
        'registration_start_at' => now()->subDay(), 'registration_end_at' => now()->addDay(),
    ], $overrides));
    $project->registrationSetting()->create([
        'title' => 'Candidatura', 'max_applications' => 10, 'requires_authentication' => false,
        'one_per_user' => false, 'allow_editing' => true,
    ]);
    $form = $project->registrationForm()->create();
    $form->fields()->createMany([
        ['type' => 'short_text', 'label' => 'Nome completo', 'identifier' => 'nome_completo', 'required' => true, 'sort_order' => 1],
        ['type' => 'email', 'label' => 'E-mail', 'identifier' => 'email', 'required' => true, 'sort_order' => 2],
        ['type' => 'select', 'label' => 'Área', 'identifier' => 'area', 'required' => true, 'options' => ['Tecnologia', 'Educação'], 'sort_order' => 3],
        ['type' => 'file', 'label' => 'Currículo', 'identifier' => 'curriculo', 'required' => true, 'allowed_mime_types' => ['application/pdf'], 'max_file_size_kb' => 5120, 'sort_order' => 4],
    ]);

    return $project->fresh(['registrationSetting', 'registrationForm.fields']);
}

it('submits an internal application with protocol, private file and history', function (): void {
    Storage::fake('local');
    Mail::fake();
    $project = registrationProject();
    $project->registrationSetting()->update(['confirmation_message' => 'Recebemos sua candidatura.']);

    $response = $this->post(route('projects.registration.store', $project), [
        'submit' => true,
        'answers' => ['nome_completo' => 'Ana Souza', 'email' => 'ANA@example.org', 'area' => 'Educação'],
        'files' => ['curriculo' => UploadedFile::fake()->create('curriculo.pdf', 120, 'application/pdf')],
    ]);

    $response->assertRedirect(route('projects.registration.create', $project))
        ->assertSessionHas('application_confirmation.protocol');
    $application = ProjectApplication::query()->with(['files', 'histories'])->firstOrFail();
    expect($application->protocol)->toMatch('/^INS-\d{4}-\d{6}$/')
        ->and($application->status)->toBe(ProjectApplicationStatus::Submitted)
        ->and($application->applicant_email)->toBe('ana@example.org')
        ->and($application->histories->pluck('event')->all())->toContain('application.created', 'application.submitted', 'document.updated');
    Storage::disk('local')->assertExists($application->files->firstOrFail()->path);
    Mail::assertQueued(ProjectApplicationConfirmation::class, fn (ProjectApplicationConfirmation $mail): bool => $mail->hasTo('ana@example.org') && $mail->protocol === $application->protocol);
});

it('keeps public registration independent from accounts and tracking pages', function (): void {
    Storage::fake('local');
    $user = $this->cmsUser('administrator');
    $project = registrationProject();
    $project->registrationSetting()->update(['requires_authentication' => true, 'allow_editing' => true]);

    $this->get('/acesso')->assertNotFound();
    $this->get('/cadastro')->assertNotFound();
    $this->get('/minhas-inscricoes')->assertNotFound();
    $this->get(route('projects.show', $project))
        ->assertRedirect(route('home', ['projeto' => $project->slug]).'#projetos');
    $this->get(route('projects.registration.create', $project))->assertOk();

    $this->actingAs($user)->post(route('projects.registration.store', $project), [
        'submit' => true,
        'answers' => ['nome_completo' => 'Ana Souza', 'email' => 'ana@example.org', 'area' => 'Educação'],
        'files' => ['curriculo' => UploadedFile::fake()->create('curriculo.pdf', 120, 'application/pdf')],
    ])->assertRedirect(route('projects.registration.create', $project));

    expect(ProjectApplication::query()->firstOrFail()->user_id)->toBeNull();
});

it('validates dynamic fields, unknown answers and private upload MIME types', function (): void {
    Storage::fake('local');
    $project = registrationProject();

    $this->post(route('projects.registration.store', $project), [
        'submit' => true,
        'answers' => ['nome_completo' => 'Ana', 'email' => 'not-an-email', 'area' => 'Inválida', 'injetado' => '<script>'],
        'files' => ['curriculo' => UploadedFile::fake()->image('foto.jpg')],
    ])->assertSessionHasErrors(['answers.injetado']);

    $this->assertDatabaseCount('project_applications', 0);
});

it('enforces opening dates and application limit in the backend', function (): void {
    $closed = registrationProject(['slug' => 'encerrado', 'registration_end_at' => now()->subMinute()]);
    $payload = ['submit' => true, 'answers' => ['nome_completo' => 'Ana', 'email' => 'ana@example.org', 'area' => 'Educação']];
    $this->post(route('projects.registration.store', $closed), $payload)->assertSessionHasErrors('registration');

    $project = registrationProject(['slug' => 'lotado']);
    $project->registrationSetting()->update(['max_applications' => 1]);
    ProjectApplication::query()->create([
        'project_id' => $project->id, 'protocol' => 'INS-2026-000001', 'status' => ProjectApplicationStatus::Submitted,
        'submitted_at' => now(), 'applicant_email' => 'outra@example.org',
    ]);
    $this->post(route('projects.registration.store', $project), $payload)->assertSessionHasErrors('registration');
});

it('lets authorized administrators filter, change status, add internal notes and export', function (): void {
    $admin = $this->cmsUser('administrator');
    $project = registrationProject();
    $application = ProjectApplication::query()->create([
        'project_id' => $project->id, 'protocol' => 'INS-2026-000003', 'status' => ProjectApplicationStatus::Submitted,
        'submitted_at' => now(), 'applicant_name' => 'Candidata Teste', 'applicant_email' => 'candidata@example.org',
    ]);

    $this->actingAs($admin)->get(route('admin.projects.applications.index', [$project, 'search' => 'Candidata', 'per_page' => 10]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.per_page', 10)
            ->where('applications.per_page', 10));
    $this->actingAs($admin)->patch(route('admin.projects.applications.status', [$project, $application]), ['status' => 'approved', 'note' => 'Documentos conferidos'])->assertRedirect();
    $this->actingAs($admin)->post(route('admin.projects.applications.notes.store', [$project, $application]), ['note' => 'Observação sigilosa'])->assertRedirect();
    expect($application->fresh()->status)->toBe(ProjectApplicationStatus::Approved);
    $this->assertDatabaseHas('project_application_histories', ['application_id' => $application->id, 'event' => 'admin.note.added', 'is_internal' => true]);
    $this->actingAs($admin)->get(route('admin.projects.applications.export', [$project, 'format' => 'csv']))
        ->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $this->actingAs($admin)->get(route('admin.projects.applications.export', [$project, 'format' => 'xlsx']))
        ->assertOk()->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('duplicates only registration form configuration', function (): void {
    $admin = $this->cmsUser('administrator');
    $source = registrationProject();
    $target = registrationProject(['slug' => 'destino', 'title' => 'Destino']);
    $target->registrationForm->fields()->delete();
    ProjectApplication::query()->create(['project_id' => $source->id, 'protocol' => 'INS-2026-000004', 'status' => 'submitted', 'submitted_at' => now()]);

    $this->actingAs($admin)->post(route('admin.projects.registration.form.duplicate', $target), ['source_project_id' => $source->id])->assertRedirect();

    expect($target->registrationForm->fields()->count())->toBe(4)
        ->and(ProjectApplication::query()->where('project_id', $target->id)->count())->toBe(0);
});
