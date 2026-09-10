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
import type { AdminSharedProps, Event, Paginated } from '@/types/cms';
export default function Events({
    seo,
    events,
}: AdminSharedProps & { events: Paginated<Event> }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Eventos">
                <PageHeading
                    title="Eventos"
                    description="Gerencie agenda, inscrições e memória das ações realizadas."
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href="/admin/eventos/create"
                        >
                            ＋ Novo evento
                        </Link>
                    </Can>
                </PageHeading>
                {events.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Evento</th>
                                        <th>Data</th>
                                        <th>Local</th>
                                        <th>Status</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.data.map((e) => (
                                        <tr key={e.id}>
                                            <td>
                                                <Can
                                                    permission="content.update"
                                                    fallback={
                                                        <>
                                                            <strong>
                                                                {e.title}
                                                            </strong>
                                                            <small>
                                                                {e.summary}
                                                            </small>
                                                        </>
                                                    }
                                                >
                                                    <Link
                                                        href={`/admin/eventos/${e.id}/edit`}
                                                    >
                                                        <strong>
                                                            {e.title}
                                                        </strong>
                                                        <small>
                                                            {e.summary}
                                                        </small>
                                                    </Link>
                                                </Can>
                                            </td>
                                            <td>
                                                {e.starts_at
                                                    ? new Date(
                                                          e.starts_at,
                                                      ).toLocaleString(
                                                          'pt-BR',
                                                          {
                                                              dateStyle:
                                                                  'short',
                                                              timeStyle:
                                                                  'short',
                                                          },
                                                      )
                                                    : 'Data a definir'}
                                            </td>
                                            <td>{e.location}</td>
                                            <td>
                                                <StatusBadge
                                                    status={e.status}
                                                />
                                            </td>
                                            <td className="cms-row-actions">
                                                <Can permission="content.update">
                                                    <Link
                                                        href={`/admin/eventos/${e.id}/edit`}
                                                    >
                                                        Editar
                                                    </Link>
                                                </Can>
                                                <Can permission="content.delete">
                                                    <ConfirmDeleteButton
                                                        label={e.title}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                `/admin/eventos/${e.id}`,
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
                        <Pagination page={events} />
                    </>
                ) : (
                    <EmptyState
                        title="Nenhum evento cadastrado"
                        description="Crie um evento para divulgar uma nova ação ou preservar sua memória."
                        action={
                            <Can permission="content.create">
                                <Link
                                    className="cms-button primary"
                                    href="/admin/eventos/create"
                                >
                                    Criar evento
                                </Link>
                            </Can>
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}
