import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    ConfirmDeleteButton,
    contentStatusFilter,
    EmptyState,
    hasActiveListingFilters,
    ListingFilters,
    PageHeading,
    Pagination,
    StatusBadge,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import { Can } from '@/components/admin/use-can';
import {
    projectRegistrationPeriod,
    projectRegistrationState,
    RegistrationStateBadge,
} from '@/components/admin/registration-ui';
import type { AdminSharedProps, Paginated, Project } from '@/types/cms';
export default function ProjectsIndex({
    seo,
    projects,
    filters = {},
}: AdminSharedProps & {
    projects: Paginated<Project>;
    filters?: Record<string, string | number | null | undefined>;
}) {
    const hasFilters = hasActiveListingFilters(filters);

    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Projetos">
                <PageHeading
                    title="Projetos"
                    description="Organize iniciativas, textos e a ordem de apresentação no site."
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href="/admin/projetos/create"
                        >
                            ＋ Novo projeto
                        </Link>
                    </Can>
                </PageHeading>
                <ListingFilters
                    basePath="/admin/projetos"
                    filters={filters}
                    searchPlaceholder="Título, resumo ou identificação"
                    fields={[contentStatusFilter]}
                />
                {projects.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Projeto</th>
                                        <th>Status</th>
                                        <th>Período de inscrição</th>
                                        <th>Inscrições</th>
                                        <th>Ordem</th>
                                        <th>Atualizado</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.data.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <Can
                                                    permission="content.update"
                                                    fallback={
                                                        <>
                                                            <strong>
                                                                {p.title}
                                                            </strong>
                                                            <small>
                                                                {p.summary}
                                                            </small>
                                                        </>
                                                    }
                                                >
                                                    <Link
                                                        href={`/admin/projetos/${p.id}/edit`}
                                                    >
                                                        <strong>
                                                            {p.title}
                                                        </strong>
                                                        <small>
                                                            {p.summary}
                                                        </small>
                                                    </Link>
                                                </Can>
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={p.status}
                                                />
                                            </td>
                                            <td>
                                                {p.registration_enabled ? (
                                                    <>
                                                        <strong>
                                                            {projectRegistrationPeriod(
                                                                p,
                                                            )}
                                                        </strong>
                                                        {projectRegistrationState(
                                                            p,
                                                        ) && (
                                                            <RegistrationStateBadge
                                                                state={projectRegistrationState(
                                                                    p,
                                                                )!}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    'Não habilitadas'
                                                )}
                                            </td>
                                            <td>
                                                {p.registration_enabled ? (
                                                    <Link
                                                        href={`/admin/projetos/${p.id}/inscricoes`}
                                                    >
                                                        <strong>
                                                            {p.applications_count ??
                                                                0}
                                                        </strong>
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td>{p.sort_order ?? 0}</td>
                                            <td>
                                                {new Date(
                                                    p.updated_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="cms-row-actions">
                                                <Can permission="content.update">
                                                    <Link
                                                        href={`/admin/projetos/${p.id}/edit`}
                                                    >
                                                        Editar
                                                    </Link>
                                                </Can>
                                                <Can permission="content.delete">
                                                    <ConfirmDeleteButton
                                                        label={p.title}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                `/admin/projetos/${p.id}`,
                                                            )
                                                        }
                                                    />
                                                </Can>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={projects} />
                    </>
                ) : (
                    <EmptyState
                        title={
                            hasFilters
                                ? 'Nenhum projeto encontrado'
                                : 'Nenhum projeto cadastrado'
                        }
                        description={
                            hasFilters
                                ? 'Ajuste a pesquisa ou limpe os filtros para consultar outros projetos.'
                                : 'Cadastre uma iniciativa para apresentá-la no site.'
                        }
                        action={
                            hasFilters ? (
                                <Link
                                    className="cms-button secondary"
                                    href="/admin/projetos"
                                >
                                    Limpar filtros
                                </Link>
                            ) : (
                                <Can permission="content.create">
                                    <Link
                                        className="cms-button primary"
                                        href="/admin/projetos/create"
                                    >
                                        Criar projeto
                                    </Link>
                                </Can>
                            )
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}
