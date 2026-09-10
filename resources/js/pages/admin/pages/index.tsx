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
import type { AdminSharedProps, Paginated, SitePage } from '@/types/cms';
export default function Pages({
    seo,
    pages,
}: AdminSharedProps & { pages: Paginated<SitePage> }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Páginas">
                <PageHeading
                    title="Páginas institucionais"
                    description="Edite textos e chamadas por meio de seções seguras e estruturadas."
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href="/admin/paginas/create"
                        >
                            ＋ Nova página
                        </Link>
                    </Can>
                </PageHeading>
                {pages.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Página</th>
                                        <th>Seções</th>
                                        <th>Status</th>
                                        <th>Atualizada</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pages.data.map((p) => (
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
                                                                /{p.slug}
                                                            </small>
                                                        </>
                                                    }
                                                >
                                                    <Link
                                                        href={`/admin/paginas/${p.id}/edit`}
                                                    >
                                                        <strong>
                                                            {p.title}
                                                        </strong>
                                                        <small>/{p.slug}</small>
                                                    </Link>
                                                </Can>
                                            </td>
                                            <td>{p.sections?.length ?? 0}</td>
                                            <td>
                                                <StatusBadge
                                                    status={p.status}
                                                />
                                            </td>
                                            <td>
                                                {new Date(
                                                    p.updated_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="cms-row-actions">
                                                <Can permission="content.update">
                                                    <Link
                                                        href={`/admin/paginas/${p.id}/edit`}
                                                    >
                                                        Editar
                                                    </Link>
                                                </Can>
                                                <Can permission="content.delete">
                                                    <ConfirmDeleteButton
                                                        label={p.title}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                `/admin/paginas/${p.id}`,
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
                        <Pagination page={pages} />
                    </>
                ) : (
                    <EmptyState
                        title="Nenhuma página cadastrada"
                        description="Crie uma página institucional com conteúdo estruturado."
                        action={
                            <Can permission="content.create">
                                <Link
                                    className="cms-button primary"
                                    href="/admin/paginas/create"
                                >
                                    Criar página
                                </Link>
                            </Can>
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}
