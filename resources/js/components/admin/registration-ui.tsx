import { ListingFilters } from './cms-ui';
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
    return (
        <ListingFilters
            basePath={`/admin/projetos/${projectId}/inscricoes`}
            filters={filters}
            searchLabel="Pesquisar candidatos"
            searchPlaceholder="Nome, CPF, e-mail ou protocolo"
            fields={[
                {
                    name: 'status',
                    label: 'Status',
                    options: [
                        { value: '', label: 'Todos' },
                        ...(statuses ??
                            Object.entries(applicationStatusLabels).map(
                                ([value, label]) => ({ value, label }),
                            )),
                    ],
                },
                {
                    name: 'date_from',
                    label: 'Inscrições a partir de',
                    type: 'date',
                },
                { name: 'date_to', label: 'Até', type: 'date' },
                {
                    name: 'sort',
                    label: 'Ordenar por',
                    options: [
                        {
                            value: 'submitted_at',
                            label: 'Data da inscrição',
                        },
                        { value: 'applicant_name', label: 'Nome' },
                        { value: 'protocol', label: 'Protocolo' },
                        { value: 'status', label: 'Status' },
                        {
                            value: 'updated_at',
                            label: 'Última atualização',
                        },
                    ],
                },
                {
                    name: 'direction',
                    label: 'Ordem',
                    options: [
                        { value: 'desc', label: 'Decrescente' },
                        { value: 'asc', label: 'Crescente' },
                    ],
                },
            ]}
            defaultValues={{ sort: 'submitted_at', direction: 'desc' }}
        />
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
