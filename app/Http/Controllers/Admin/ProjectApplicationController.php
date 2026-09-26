<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProjectApplicationStatus;
use App\Http\Requests\Admin\ProjectApplicationNoteRequest;
use App\Http\Requests\Admin\ProjectApplicationStatusRequest;
use App\Http\Resources\ProjectApplicationResource;
use App\Models\Project;
use App\Models\ProjectApplication;
use App\Services\ProjectApplicationExporter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectApplicationController extends AdminController
{
    public function index(Request $request, Project $project): Response
    {
        $this->authorize('viewAny', ProjectApplication::class);
        $filters = $this->filters($request);
        $query = $this->filteredQuery($project, $filters);
        $applications = $query->with('project.registrationSetting')->paginate($filters['per_page'])->withQueryString();
        $applications->through(fn ($application): array => (new ProjectApplicationResource($application))->resolve($request));
        $base = $project->applications()->whereNot('status', ProjectApplicationStatus::Draft->value);
        $todayStart = today();
        $metricsRow = $base->toBase()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN submitted_at >= ? AND submitted_at < ? THEN 1 ELSE 0 END) as today', [$todayStart, $todayStart->copy()->addDay()])
            ->selectRaw('SUM(CASE WHEN submitted_at >= ? THEN 1 ELSE 0 END) as this_week', [now()->startOfWeek()])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as submitted', [ProjectApplicationStatus::Submitted->value])
            ->selectRaw('SUM(CASE WHEN status IN (?, ?, ?) THEN 1 ELSE 0 END) as pending', [ProjectApplicationStatus::Submitted->value, ProjectApplicationStatus::UnderReview->value, ProjectApplicationStatus::PendingDocuments->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as approved', [ProjectApplicationStatus::Approved->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected', [ProjectApplicationStatus::Rejected->value])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled', [ProjectApplicationStatus::Cancelled->value])
            ->first();
        $metrics = [
            'total' => (int) ($metricsRow->total ?? 0),
            'today' => (int) ($metricsRow->today ?? 0),
            'this_week' => (int) ($metricsRow->this_week ?? 0),
            'submitted' => (int) ($metricsRow->submitted ?? 0),
            'pending' => (int) ($metricsRow->pending ?? 0),
            'approved' => (int) ($metricsRow->approved ?? 0),
            'rejected' => (int) ($metricsRow->rejected ?? 0),
            'cancelled' => (int) ($metricsRow->cancelled ?? 0),
        ];

        return Inertia::render('admin/projects/registrations/index', [
            'project' => ['id' => $project->id, 'title' => $project->title], 'applications' => $applications,
            'metrics' => $metrics, 'filters' => $filters, 'statuses' => $this->statuses(),
        ]);
    }

    public function show(Request $request, Project $project, ProjectApplication $application): Response
    {
        $this->assertBelongsToProject($project, $application);
        $this->authorize('view', $application);
        $application->load(['project.registrationSetting', 'answers.field', 'files.field', 'histories.user']);

        return Inertia::render('admin/projects/registrations/show', [
            'project' => ['id' => $project->id, 'title' => $project->title],
            'application' => (new ProjectApplicationResource($application))->resolve($request),
            'statuses' => $this->statuses(),
        ]);
    }

    public function status(ProjectApplicationStatusRequest $request, Project $project, ProjectApplication $application): RedirectResponse
    {
        $this->assertBelongsToProject($project, $application);
        DB::transaction(function () use ($request, $application): void {
            $from = $application->status;
            $to = ProjectApplicationStatus::from($request->validated('status'));
            $application->update(['status' => $to]);
            $application->histories()->create([
                'user_id' => $request->user()->id, 'event' => 'status.changed', 'from_status' => $from->value,
                'to_status' => $to->value, 'note' => $request->validated('note'), 'is_internal' => true,
            ]);
            $this->recordChange('project.application.status.updated', $application, ['status' => $from->value]);
        });

        return back()->with('success', 'Status da candidatura atualizado.');
    }

    public function note(ProjectApplicationNoteRequest $request, Project $project, ProjectApplication $application): RedirectResponse
    {
        $this->assertBelongsToProject($project, $application);
        $application->histories()->create(['user_id' => $request->user()->id, 'event' => 'admin.note.added', 'note' => $request->validated('note'), 'is_internal' => true]);
        $this->recordChange('project.application.note.added', $application);

        return back()->with('success', 'Observação interna adicionada.');
    }

    public function export(Request $request, Project $project, ProjectApplicationExporter $exporter): StreamedResponse
    {
        $this->authorize('viewAny', ProjectApplication::class);
        $format = $request->validate(['format' => ['required', Rule::in(['csv', 'xlsx'])]])['format'];
        $project->load('registrationForm.fields');
        $query = $this->filteredQuery($project, $this->filters($request));

        return $format === 'xlsx' ? $exporter->xlsx($project, $query) : $exporter->csv($project, $query);
    }

    /** @param array<string, mixed> $filters
     * @return Builder<ProjectApplication>
     */
    private function filteredQuery(Project $project, array $filters): Builder
    {
        return ProjectApplication::query()->where('project_id', $project->id)->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
            $search = '%'.addcslashes($filters['search'], '%_\\').'%';
            $query->where(fn (Builder $query) => $query->whereLike('protocol', $search, caseSensitive: false)
                ->orWhereLike('applicant_name', $search, caseSensitive: false)
                ->orWhereLike('applicant_email', $search, caseSensitive: false)
                ->orWhereLike('applicant_cpf', $search, caseSensitive: false));
        })->when($filters['status'], fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['date_from'], fn (Builder $query, string $date) => $query->whereDate('submitted_at', '>=', $date))
            ->when($filters['date_to'], fn (Builder $query, string $date) => $query->whereDate('submitted_at', '<=', $date))
            ->when($filters['field'] && $filters['field_value'] !== '', function (Builder $query) use ($filters): void {
                $query->whereHas('answers', fn (Builder $answer) => $answer->whereHas('field', fn (Builder $field) => $field->where('identifier', $filters['field']))
                    ->whereRaw('LOWER(CAST(value AS TEXT)) LIKE ?', ['%'.mb_strtolower(addcslashes($filters['field_value'], '%_\\')).'%']));
            })->orderBy($filters['sort'], $filters['direction']);
    }

    /** @return array<string, mixed> */
    private function filters(Request $request): array
    {
        $validStatuses = array_column(ProjectApplicationStatus::cases(), 'value');
        $sort = in_array($request->query('sort'), ['protocol', 'applicant_name', 'submitted_at', 'status', 'updated_at'], true) ? $request->query('sort') : 'submitted_at';

        return [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 120),
            'status' => in_array($request->query('status'), $validStatuses, true) ? $request->query('status') : null,
            'date_from' => $this->validDate($request->query('date_from')), 'date_to' => $this->validDate($request->query('date_to')),
            'field' => preg_match('/^[a-z][a-z0-9_]*$/', (string) $request->query('field')) ? $request->query('field') : null,
            'field_value' => mb_substr(trim((string) $request->query('field_value', '')), 0, 255),
            'sort' => $sort, 'direction' => $request->query('direction') === 'asc' ? 'asc' : 'desc',
            'per_page' => $this->perPage($request),
        ];
    }

    private function validDate(mixed $date): ?string
    {
        return is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;
    }

    /** @return array<int, array{value: string, label: string}> */
    private function statuses(): array
    {
        return array_map(fn (ProjectApplicationStatus $status): array => ['value' => $status->value, 'label' => $status->label()], ProjectApplicationStatus::cases());
    }

    private function assertBelongsToProject(Project $project, ProjectApplication $application): void
    {
        abort_unless($application->project_id === $project->id, 404);
    }
}
