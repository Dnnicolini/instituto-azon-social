import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    ConfirmDeleteButton,
    EmptyState,
    PageHeading,
    Pagination,
    StatusBadge,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import { Can } from '@/components/admin/use-can';
import type { AdminSharedProps, Paginated, Project } from '@/types/cms';
export default function ProjectsIndex({
    seo,
    projects,
}: AdminSharedProps & { projects: Paginated<Project> }) {
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
                {projects.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Projeto</th>
                                        <th>Status</th>
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
                        title="Nenhum projeto cadastrado"
                        description="Cadastre uma iniciativa para apresentá-la no site."
                        action={
                            <Can permission="content.create">
                                <Link
                                    className="cms-button primary"
                                    href="/admin/projetos/create"
                                >
                                    Criar projeto
                                </Link>
                            </Can>
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}
