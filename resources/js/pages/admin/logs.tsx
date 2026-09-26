import { AdminLayout } from '@/components/admin/admin-layout';
import {
    EmptyState,
    ListingFilters,
    PageHeading,
    Pagination,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Paginated } from '@/types/cms';

type Activity = {
    id: number;
    action: string;
    action_label: string;
    resource_label: string;
    resource_id: number | null;
    user: string;
    created_at: string;
};

type FailedJob = {
    id: number;
    reference: string;
    connection: string;
    queue: string;
    failed_at: string;
};

type Filters = {
    search?: string;
    category?: string;
    period?: string;
    per_page?: number;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function LogsPage({
    seo,
    activities,
    failedJobs,
    filters,
    stats,
}: AdminSharedProps & {
    activities: Paginated<Activity>;
    failedJobs: FailedJob[];
    filters: Filters;
    stats: { activities24h: number; pendingJobs: number; failedJobs: number };
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Atividades e falhas">
                <PageHeading
                    title="Atividades e falhas"
                    description="Acompanhe alterações no sistema e identifique falhas de processamento sem expor dados sensíveis."
                />

                <section
                    className="admin-stats"
                    aria-label="Resumo operacional"
                >
                    <article>
                        <span className="blue" aria-hidden="true" />
                        <small>Atividades em 24h</small>
                        <strong>{stats.activities24h}</strong>
                        <em>alterações registradas</em>
                    </article>
                    <article>
                        <span className="gold" aria-hidden="true" />
                        <small>Fila aguardando</small>
                        <strong>{stats.pendingJobs}</strong>
                        <em>tarefas pendentes</em>
                    </article>
                    <article>
                        <span
                            className={stats.failedJobs ? 'brown' : 'green'}
                            aria-hidden="true"
                        />
                        <small>Falhas de fila</small>
                        <strong>{stats.failedJobs}</strong>
                        <em>
                            {stats.failedJobs
                                ? 'precisam de atenção'
                                : 'nenhuma falha'}
                        </em>
                    </article>
                </section>

                <section className="admin-panel cms-log-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <h2>Histórico de atividades</h2>
                            <p>Quem alterou, o que foi alterado e quando.</p>
                        </div>
                    </div>
                    <ListingFilters
                        basePath="/admin/logs"
                        filters={filters}
                        searchPlaceholder="Ação ou nome da pessoa"
                        fields={[
                            {
                                name: 'category',
                                label: 'Área',
                                options: [
                                    { value: '', label: 'Todas' },
                                    {
                                        value: 'content',
                                        label: 'Conteúdos',
                                    },
                                    {
                                        value: 'access',
                                        label: 'Usuários e grupos',
                                    },
                                    {
                                        value: 'messages',
                                        label: 'Mensagens',
                                    },
                                    {
                                        value: 'settings',
                                        label: 'Configurações',
                                    },
                                    { value: 'system', label: 'Sistema' },
                                ],
                            },
                            {
                                name: 'period',
                                label: 'Período',
                                options: [
                                    {
                                        value: '24h',
                                        label: 'Últimas 24 horas',
                                    },
                                    {
                                        value: '7d',
                                        label: 'Últimos 7 dias',
                                    },
                                    {
                                        value: '30d',
                                        label: 'Últimos 30 dias',
                                    },
                                    {
                                        value: 'all',
                                        label: 'Todo o histórico',
                                    },
                                ],
                            },
                        ]}
                        defaultValues={{ period: '7d' }}
                    />

                    {activities.data.length ? (
                        <>
                            <div className="cms-table-wrap">
                                <table className="cms-table">
                                    <thead>
                                        <tr>
                                            <th>Ação</th>
                                            <th>Item</th>
                                            <th>Responsável</th>
                                            <th>Data e hora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.data.map((activity) => (
                                            <tr key={activity.id}>
                                                <td>
                                                    <strong>
                                                        {activity.action_label}
                                                    </strong>
                                                    <small>
                                                        {activity.action}
                                                    </small>
                                                </td>
                                                <td>
                                                    {activity.resource_label}
                                                    {activity.resource_id
                                                        ? ` #${activity.resource_id}`
                                                        : ''}
                                                </td>
                                                <td>{activity.user}</td>
                                                <td>
                                                    {formatDate(
                                                        activity.created_at,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={activities} />
                        </>
                    ) : (
                        <EmptyState
                            title="Nenhuma atividade encontrada"
                            description="Altere os filtros para consultar outro período."
                        />
                    )}
                </section>

                <section className="admin-panel cms-log-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <h2>Falhas de processamento</h2>
                            <p>
                                Referências seguras para suporte. Mensagens,
                                payloads e detalhes técnicos permanecem
                                protegidos no servidor.
                            </p>
                        </div>
                    </div>
                    {failedJobs.length ? (
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Referência</th>
                                        <th>Fila</th>
                                        <th>Conexão</th>
                                        <th>Falhou em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {failedJobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>
                                                <strong>
                                                    #{job.reference}
                                                </strong>
                                            </td>
                                            <td>{job.queue}</td>
                                            <td>{job.connection}</td>
                                            <td>{formatDate(job.failed_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="cms-inline-empty">
                            Nenhuma falha de processamento registrada.
                        </div>
                    )}
                </section>
            </AdminLayout>
        </>
    );
}
