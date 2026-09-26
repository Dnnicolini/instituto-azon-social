import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import type {
    ApplicationStatus,
    Project,
    RegistrationMetrics,
    RegistrationState,
} from '@/types/cms';
import { applicationStatusLabels, registrationStateLabels } from '@/types/cms';

export function ApplicationStatusBadge({
    status,
}: {
    status: ApplicationStatus;
}) {
    return (
        <span className={`cms-status ${status}`}>
            {applicationStatusLabels[status] ?? status}
        </span>
    );
}

export function RegistrationStateBadge({
    state,
}: {
    state: RegistrationState;
}) {
    return (
        <span className={`cms-status ${state}`}>
            {registrationStateLabels[state] ?? state}
        </span>
    );
}

export function RegistrationMetricsPanel({
    metrics,
}: {
    metrics: RegistrationMetrics;
}) {
    const items = [
        ['Total', metrics.total, 'brown'],
        ['Hoje', metrics.today, 'blue'],
        ['Esta semana', metrics.this_week, 'gold'],
        ['Enviadas', metrics.submitted, 'green'],
        ['Pendentes', metrics.pending, 'gold'],
        ['Aprovadas', metrics.approved, 'green'],
        ['Rejeitadas', metrics.rejected, 'brown'],
        ['Canceladas', metrics.cancelled, 'blue'],
    ] as const;

    return (
        <section
            className="admin-stats"
            aria-label="Indicadores das inscrições"
        >
            {items.map(([label, value, color]) => (
                <article key={label} className={color}>
                    <small>{label}</small>
                    <strong>{value.toLocaleString('pt-BR')}</strong>
                </article>
            ))}
        </section>
    );
}

export function ApplicationFilters({
    projectId,
    filters,
    statuses,
}: {
    projectId: number;
    filters: Record<string, string | number | null | undefined>;
    statuses?: Array<{ value: string; label: string }>;
}) {
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const values = Object.fromEntries(
            [...data.entries()]
                .map(([key, value]) => [
                    key,
                    typeof value === 'string' ? value.trim() : '',
                ])
                .filter(([, value]) => value !== ''),
        );
        router.get(`/admin/projetos/${projectId}/inscricoes`, values, {
            preserveState: true,
            replace: true,
        });
    }

    const hasFilters = Boolean(
        filters.search ||
        filters.status ||
        filters.date_from ||
        filters.date_to ||
        filters.field ||
        filters.field_value,
    );

    return (
        <form className="cms-toolbar" role="search" onSubmit={submit}>
            <label>
                <span>Buscar candidato</span>
                <input
                    name="search"
                    type="search"
                    defaultValue={filters.search ?? ''}
                    placeholder="Nome, CPF, e-mail ou protocolo"
                />
            </label>
            <label>
                <span>Status</span>
                <select name="status" defaultValue={filters.status ?? ''}>
                    <option value="">Todos</option>
                    {(
                        statuses ??
                        Object.entries(applicationStatusLabels).map(
                            ([value, label]) => ({ value, label }),
                        )
                    ).map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <span>Inscrições a partir de</span>
                <input
                    name="date_from"
                    type="date"
                    defaultValue={filters.date_from ?? ''}
                />
            </label>
            <label>
                <span>Até</span>
                <input
                    name="date_to"
                    type="date"
                    defaultValue={filters.date_to ?? ''}
                />
            </label>
            <label>
                <span>Ordenar por</span>
                <select
                    name="sort"
                    defaultValue={filters.sort ?? 'submitted_at'}
                >
                    <option value="submitted_at">Data da inscrição</option>
                    <option value="applicant_name">Nome</option>
                    <option value="protocol">Protocolo</option>
                    <option value="status">Status</option>
                    <option value="updated_at">Última atualização</option>
                </select>
            </label>
            <label>
                <span>Ordem</span>
                <select
                    name="direction"
                    defaultValue={filters.direction ?? 'desc'}
                >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                </select>
            </label>
            <div className="cms-inline-actions">
                <button className="cms-button secondary" type="submit">
                    Aplicar filtros
                </button>
                {hasFilters && (
                    <Link
                        className="cms-toolbar-clear"
                        href={`/admin/projetos/${projectId}/inscricoes`}
                    >
                        Limpar
                    </Link>
                )}
            </div>
        </form>
    );
}

export function buildApplicationExportUrl(
    projectId: number,
    format: 'csv' | 'xlsx',
    filters: Record<string, string | number | null | undefined>,
) {
    const query = new URLSearchParams({ format });
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            query.set(key, String(value));
        }
    });

    return `/admin/projetos/${projectId}/inscricoes/exportar?${query.toString()}`;
}

export function projectRegistrationState(
    project: Project,
): RegistrationState | null {
    if (!project.registration_enabled) return null;
    const now = Date.now();
    const start = project.registration_start_at
        ? new Date(project.registration_start_at).getTime()
        : null;
    const end = project.registration_end_at
        ? new Date(project.registration_end_at).getTime()
        : null;
    if (start !== null && now < start) return 'not_started';
    if (end !== null && now > end) return 'closed';
    return 'open';
}

export function projectRegistrationPeriod(project: Project) {
    const format = (value: string) =>
        new Date(value).toLocaleDateString('pt-BR');
    if (project.registration_start_at && project.registration_end_at) {
        return `${format(project.registration_start_at)} a ${format(project.registration_end_at)}`;
    }
    if (project.registration_start_at) {
        return `A partir de ${format(project.registration_start_at)}`;
    }
    if (project.registration_end_at) {
        return `Até ${format(project.registration_end_at)}`;
    }
    return 'Período não definido';
}
