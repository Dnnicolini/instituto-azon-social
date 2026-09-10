import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, PageHeading, Pagination } from '@/components/admin/cms-ui';
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
}: AdminSharedProps & { messages: Paginated<ContactMessage> }) {
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
                        title="Caixa de entrada vazia"
                        description="Novas mensagens enviadas pelo formulário de contato aparecerão aqui."
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
