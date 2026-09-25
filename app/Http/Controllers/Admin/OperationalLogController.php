<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OperationalLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasRole('administrator'), 403);

        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'category' => in_array($request->query('category'), ['content', 'access', 'messages', 'settings', 'system'], true)
                ? (string) $request->query('category')
                : null,
            'period' => in_array($request->query('period'), ['24h', '7d', '30d', 'all'], true)
                ? (string) $request->query('period')
                : '7d',
        ];

        $query = AuditLog::query()
            ->with('user:id,name')
            ->latest('created_at');

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('action', 'like', "%{$search}%")
                    ->orWhereHas('user', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"));
            });
        }

        if ($filters['category']) {
            $prefixes = $this->categoryPrefixes($filters['category']);
            $query->where(function (Builder $query) use ($prefixes): void {
                foreach ($prefixes as $prefix) {
                    $query->orWhere('action', 'like', $prefix.'.%');
                }
            });
        }

        $since = match ($filters['period']) {
            '24h' => now()->subDay(),
            '30d' => now()->subDays(30),
            'all' => null,
            default => now()->subDays(7),
        };
        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        $activities = $query->paginate(20)->withQueryString()->through(fn (AuditLog $log): array => [
            'id' => $log->id,
            'action' => $log->action,
            'action_label' => $this->actionLabel($log->action),
            'resource_label' => $this->resourceLabel($log->auditable_type),
            'resource_id' => $log->auditable_id,
            'user' => $log->user->name ?? 'Sistema',
            'created_at' => $log->created_at?->toIso8601String(),
        ]);

        $failedJobs = DB::table('failed_jobs')
            ->select(['id', 'uuid', 'connection', 'queue', 'failed_at'])
            ->latest('failed_at')
            ->limit(10)
            ->get()
            ->map(fn (object $job): array => [
                'id' => $job->id,
                'reference' => substr((string) $job->uuid, 0, 8),
                'connection' => $job->connection,
                'queue' => $job->queue,
                'failed_at' => $job->failed_at,
            ]);

        return Inertia::render('admin/logs', [
            'activities' => $activities,
            'failedJobs' => $failedJobs,
            'filters' => $filters,
            'stats' => [
                'activities24h' => AuditLog::query()->where('created_at', '>=', now()->subDay())->count(),
                'pendingJobs' => DB::table('jobs')->count(),
                'failedJobs' => DB::table('failed_jobs')->count(),
            ],
        ]);
    }

    /** @return array<int, string> */
    private function categoryPrefixes(string $category): array
    {
        return match ($category) {
            'content' => ['post', 'project', 'event', 'document', 'page'],
            'access' => ['user', 'role'],
            'messages' => ['message'],
            'settings' => ['settings', 'instagram'],
            default => ['job', 'system'],
        };
    }

    private function actionLabel(string $action): string
    {
        $labels = [
            'created' => 'Criado',
            'updated' => 'Atualizado',
            'deleted' => 'Excluído',
            'published' => 'Publicado',
            'scheduled' => 'Agendado',
            'status_updated' => 'Status alterado',
            'password_reset_sent' => 'Redefinição de senha enviada',
            'synced' => 'Sincronizado',
            'connected' => 'Conectado',
            'disconnected' => 'Desconectado',
        ];
        $operation = str($action)->afterLast('.')->toString();

        return $labels[$operation] ?? str($operation)->replace('_', ' ')->headline()->toString();
    }

    private function resourceLabel(?string $type): string
    {
        if (! $type) {
            return 'Sistema';
        }

        return match (class_basename($type)) {
            'Post' => 'Conteúdo',
            'Project' => 'Projeto',
            'Event' => 'Evento',
            'Document' => 'Documento',
            'Page' => 'Página',
            'User' => 'Usuário',
            'Role' => 'Grupo',
            'ContactMessage' => 'Mensagem',
            default => class_basename($type),
        };
    }
}
