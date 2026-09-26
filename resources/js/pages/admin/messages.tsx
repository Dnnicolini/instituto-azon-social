import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    EmptyState,
    ListingFilters,
    PageHeading,
    Pagination,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, ContactMessage, Paginated } from '@/types/cms';
const messageStatus = {
    new: 'Nova',
    read: 'Lida',
    responded: 'Respondida',
    archived: 'Arquivada',
} as const;
export default function Messages({
    seo,
    messages,
    filters,
}: AdminSharedProps & {
    messages: Paginated<ContactMessage>;
    filters: {
        search?: string;
        status?: string | null;
        per_page?: number;
    };
}) {
    function change(id: number, status: ContactMessage['status']) {
        router.put(
            `/admin/mensagens/${id}`,
            { status },
            { preserveScroll: true },
        );
    }
    function remove(item: ContactMessage) {
        if (window.confirm(`Excluir a mensagem de ${item.name}?`))
            router.delete(`/admin/mensagens/${item.id}`, {
                preserveScroll: true,
            });
    }
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Mensagens">
                <PageHeading
                    title="Mensagens"
                    description="Acompanhe contatos recebidos pelo site e registre o andamento."
                />
                <ListingFilters
                    basePath="/admin/mensagens"
                    filters={filters}
                    searchPlaceholder="Nome, e-mail, assunto ou mensagem"
                    fields={[
                        {
                            name: 'status',
                            label: 'Status',
                            options: [
                                { value: '', label: 'Todos' },
                                { value: 'new', label: 'Novas' },
                                { value: 'read', label: 'Lidas' },
                                {
                                    value: 'responded',
                                    label: 'Respondidas',
                                },
                                { value: 'archived', label: 'Arquivadas' },
                            ],
                        },
                    ]}
                />
                {messages.data.length ? (
                    <div className="cms-message-list">
                        {messages.data.map((message) => (
                            <article
                                className={
                                    message.status === 'new' ? 'unread' : ''
                                }
                                key={message.id}
                            >
                                <header>
                                    <div>
                                        <span
                                            className={`cms-status ${message.status}`}
                                        >
                                            {messageStatus[message.status]}
                                        </span>
                                        <h2>{message.subject}</h2>
                                        <p>
                                            De <strong>{message.name}</strong>{' '}
                                            em{' '}
                                            <time dateTime={message.created_at}>
                                                {new Date(
                                                    message.created_at,
                                                ).toLocaleString('pt-BR', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </time>
                                        </p>
                                    </div>
                                    <div className="cms-row-actions">
                                        <a
                                            href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                                        >
                                            Responder
                                        </a>
                                        <button
                                            className="cms-text-action danger"
                                            type="button"
                                            onClick={() => remove(message)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </header>
                                <p className="cms-message-body">
                                    {message.message ?? message.body}
                                </p>
                                <dl>
                                    <div>
                                        <dt>E-mail</dt>
                                        <dd>
                                            <a href={`mailto:${message.email}`}>
                                                {message.email}
                                            </a>
                                        </dd>
                                    </div>
                                    {message.phone && (
                                        <div>
                                            <dt>Telefone</dt>
                                            <dd>{message.phone}</dd>
                                        </div>
                                    )}
                                </dl>
                                <div className="cms-message-actions">
                                    <label>
                                        Status
                                        <select
                                            value={message.status}
                                            onChange={(e) =>
                                                change(
                                                    message.id,
                                                    e.target
                                                        .value as ContactMessage['status'],
                                                )
                                            }
                                        >
                                            <option value="new">Nova</option>
                                            <option value="read">Lida</option>
                                            <option value="responded">
                                                Respondida
                                            </option>
                                            <option value="archived">
                                                Arquivada
                                            </option>
                                        </select>
                                    </label>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title={
                            filters.search || filters.status
                                ? 'Nenhuma mensagem encontrada'
                                : 'Caixa de entrada vazia'
                        }
                        description={
                            filters.search || filters.status
                                ? 'Ajuste a pesquisa ou limpe os filtros para consultar outras mensagens.'
                                : 'Novas mensagens enviadas pelo formulário de contato aparecerão aqui.'
                        }
                        action={
                            filters.search || filters.status ? (
                                <Link
                                    className="cms-button secondary"
                                    href="/admin/mensagens"
                                >
                                    Limpar filtros
                                </Link>
                            ) : undefined
                        }
                    />
                )}
                <Pagination page={messages} />
                <Link className="sr-only" href="/">
                    Voltar ao site
                </Link>
            </AdminLayout>
        </>
    );
}
