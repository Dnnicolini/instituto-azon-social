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
import type {
    AdminSharedProps,
    Paginated,
    TransparencyDocument,
} from '@/types/cms';
export default function Documents({
    seo,
    documents,
}: AdminSharedProps & { documents: Paginated<TransparencyDocument> }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Transparência">
                <PageHeading
                    title="Transparência"
                    description="Disponibilize relatórios, políticas e documentos em PDF."
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href="/admin/documentos/create"
                        >
                            ＋ Novo documento
                        </Link>
                    </Can>
                </PageHeading>
                {documents.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Documento</th>
                                        <th>Categoria</th>
                                        <th>Status</th>
                                        <th>Publicação</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.data.map((d) => (
                                        <tr key={d.id}>
                                            <td>
                                                <strong>{d.title}</strong>
                                            </td>
                                            <td>
                                                {d.category || 'Sem categoria'}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={d.status}
                                                />
                                            </td>
                                            <td>
                                                {d.published_at
                                                    ? new Date(
                                                          d.published_at,
                                                      ).toLocaleDateString(
                                                          'pt-BR',
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="cms-row-actions">
                                                <Can permission="content.update">
                                                    <Link
                                                        href={`/admin/documentos/${d.id}/edit`}
                                                    >
                                                        Editar
                                                    </Link>
                                                </Can>
                                                {d.file_url && (
                                                    <a
                                                        href={d.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Abrir
                                                    </a>
                                                )}
                                                <Can permission="content.delete">
                                                    <ConfirmDeleteButton
                                                        label={d.title}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                `/admin/documentos/${d.id}`,
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
                        <Pagination page={documents} />
                    </>
                ) : (
                    <EmptyState
                        title="Nenhum documento publicado"
                        description="Envie o primeiro PDF para iniciar a área de transparência."
                        action={
                            <Can permission="content.create">
                                <Link
                                    className="cms-button primary"
                                    href="/admin/documentos/create"
                                >
                                    Enviar documento
                                </Link>
                            </Can>
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}
