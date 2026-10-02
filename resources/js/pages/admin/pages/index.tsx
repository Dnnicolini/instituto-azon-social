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
import type { AdminSharedProps, Paginated, SitePage } from '@/types/cms';
export default function Pages({
    seo,
    pages,
    filters = {},
}: AdminSharedProps & {
    pages: Paginated<SitePage>;
    filters?: Record<string, string | number | null | undefined>;
}) {
    const hasFilters = hasActiveListingFilters(filters);

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
                <ListingFilters
                    basePath="/admin/paginas"
                    filters={filters}
                    searchPlaceholder="Título ou endereço da página"
                    fields={[contentStatusFilter]}
                />
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
                                                        href={
                                                            p.is_channel
                                                                ? `/admin/paginas/${p.id}/edit?context=channels`
                                                                : `/admin/paginas/${p.id}/edit`
                                                        }
                                                    >
                                                        <strong>
                                                            {p.title}
                                                        </strong>
                                                        <small>/{p.slug}</small>
                                                    </Link>
                                                </Can>
                                            </td>
                                            <td>
                                                {p.sections_count ??
                                                    p.sections?.length ??
                                                    0}
                                            </td>
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
                                                        href={
                                                            p.is_channel
                                                                ? `/admin/paginas/${p.id}/edit?context=channels`
                                                                : `/admin/paginas/${p.id}/edit`
                                                        }
                                                    >
                                                        {p.is_channel
                                                            ? 'Gerenciar canal'
                                                            : 'Editar'}
                                                    </Link>
                                                </Can>
                                                {!p.is_channel && (
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
                                                )}
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
                        title={
                            hasFilters
                                ? 'Nenhuma página encontrada'
                                : 'Nenhuma página cadastrada'
                        }
                        description={
                            hasFilters
                                ? 'Ajuste a pesquisa ou limpe os filtros para consultar outras páginas.'
                                : 'Crie uma página institucional com conteúdo estruturado.'
                        }
                        action={
                            hasFilters ? (
                                <Link
                                    className="cms-button secondary"
                                    href="/admin/paginas"
                                >
                                    Limpar filtros
                                </Link>
                            ) : (
                                <Can permission="content.create">
                                    <Link
                                        className="cms-button primary"
                                        href="/admin/paginas/create"
                                    >
                                        Criar página
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
