import { Link, router } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, PageHeading, Pagination } from '@/components/admin/cms-ui';
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
    const [search, setSearch] = useState(filters.search ?? '');

    function filter(name: string, value: string) {
        router.get(
            '/admin/logs',
            { ...filters, [name]: value || undefined },
            { preserveState: true, replace: true },
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        filter('search', search.trim());
    }

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
                    <form
                        className="cms-toolbar"
                        role="search"
                        onSubmit={submit}
                    >
                        <label>
                            <span>Buscar</span>
                            <span className="cms-search-control">
                                <input
                                    type="search"
                                    value={search}
                                    placeholder="Ação ou nome da pessoa"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                                <button
                                    type="submit"
                                    className="cms-button secondary"
                                >
                                    Buscar
                                </button>
                            </span>
                        </label>
                        <label>
                            <span>Área</span>
                            <select
                                value={filters.category ?? ''}
                                onChange={(event) =>
                                    filter('category', event.target.value)
                                }
                            >
                                <option value="">Todas</option>
                                <option value="content">Conteúdos</option>
                                <option value="access">
                                    Usuários e grupos
                                </option>
                                <option value="messages">Mensagens</option>
                                <option value="settings">Configurações</option>
                                <option value="system">Sistema</option>
                            </select>
                        </label>
                        <label>
                            <span>Período</span>
                            <select
                                value={filters.period ?? '7d'}
                                onChange={(event) =>
                                    filter('period', event.target.value)
                                }
                            >
                                <option value="24h">Últimas 24 horas</option>
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="all">Todo o histórico</option>
                            </select>
                        </label>
                        {(filters.search ||
                            filters.category ||
                            filters.period !== '7d') && (
                            <Link
                                className="cms-toolbar-clear"
                                href="/admin/logs"
                            >
                                Limpar filtros
                            </Link>
                        )}
                    </form>

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
