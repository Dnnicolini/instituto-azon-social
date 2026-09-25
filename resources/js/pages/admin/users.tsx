import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, PageHeading, Pagination } from '@/components/admin/cms-ui';
import { useCan } from '@/components/admin/use-can';
import { SeoHead } from '@/components/seo-head';
import { managedUserStatuses } from '@/lib/managed-user';
import type { AdminSharedProps, ManagedUser, Paginated } from '@/types/cms';

type UserStatusFilter = '' | ManagedUser['status'];

function UserStatus({ status }: { status: ManagedUser['status'] }) {
    const content = managedUserStatuses[status];

    return (
        <span
            className={`cms-user-status ${status}`}
            title={content.description}
        >
            <i aria-hidden="true" />
            {content.label}
        </span>
    );
}

function UserActions({
    user,
    busyAction,
    onDelete,
    onResetPassword,
    onToggleStatus,
}: {
    user: ManagedUser;
    busyAction: string | null;
    onDelete: () => void;
    onResetPassword: () => void;
    onToggleStatus: () => void;
}) {
    const isBusy = busyAction !== null;
    const isDisabled = user.status === 'disabled';

    return (
        <div className="cms-user-actions" aria-busy={isBusy}>
            {user.capabilities.update && (
                <Link
                    className="cms-text-action"
                    href={`/admin/usuarios/${user.id}/edit`}
                >
                    Editar acesso
                </Link>
            )}
            {user.capabilities.reset_password && (
                <button
                    type="button"
                    onClick={onResetPassword}
                    disabled={isBusy}
                >
                    {busyAction === `reset-${user.id}`
                        ? 'Enviando…'
                        : 'Enviar redefinição de senha'}
                </button>
            )}
            {user.capabilities.toggle_status && (
                <button
                    type="button"
                    className={isDisabled ? undefined : 'danger'}
                    onClick={onToggleStatus}
                    disabled={isBusy}
                >
                    {busyAction === `status-${user.id}`
                        ? 'Atualizando…'
                        : isDisabled
                          ? 'Ativar usuário'
                          : 'Desativar usuário'}
                </button>
            )}
            {user.capabilities.delete && (
                <button
                    type="button"
                    className="danger"
                    onClick={onDelete}
                    disabled={isBusy}
                >
                    {busyAction === `delete-${user.id}`
                        ? 'Excluindo…'
                        : 'Excluir permanentemente'}
                </button>
            )}
        </div>
    );
}

export default function Users({
    seo,
    users,
    filters,
}: AdminSharedProps & {
    users: Paginated<ManagedUser>;
    filters: { q: string; status: UserStatusFilter };
}) {
    const canManageRoles = useCan('roles.manage');
    const [query, setQuery] = useState(filters.q);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    function visitFilters(q: string, status: UserStatusFilter) {
        router.get(
            '/admin/usuarios',
            {
                ...(q.trim() ? { q: q.trim() } : {}),
                ...(status ? { status } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function searchUsers(event: FormEvent) {
        event.preventDefault();
        visitFilters(query, filters.status);
    }

    function filterByStatus(status: UserStatusFilter) {
        visitFilters(query, status);
    }

    function clearFilters() {
        setQuery('');
        visitFilters('', '');
    }

    function resetPassword(user: ManagedUser) {
        if (busyAction) return;
        if (
            !window.confirm(
                `Enviar um link de redefinição de senha para ${user.email}?`,
            )
        )
            return;

        setBusyAction(`reset-${user.id}`);
        router.post(
            `/admin/usuarios/${user.id}/redefinir-senha`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusyAction(null),
            },
        );
    }

    function toggleStatus(user: ManagedUser) {
        if (busyAction) return;
        const activate = user.status === 'disabled';

        if (
            !activate &&
            !window.confirm(
                `Desativar ${user.name}? A pessoa perderá o acesso até ser ativada novamente.`,
            )
        )
            return;

        setBusyAction(`status-${user.id}`);
        router.patch(
            `/admin/usuarios/${user.id}/status`,
            { active: activate },
            {
                preserveScroll: true,
                onFinish: () => setBusyAction(null),
            },
        );
    }

    function deleteUser(user: ManagedUser) {
        if (busyAction) return;
        if (
            !window.confirm(
                `Excluir permanentemente ${user.name}? Essa ação não pode ser desfeita. Para bloquear temporariamente, use Desativar usuário.`,
            )
        )
            return;

        setBusyAction(`delete-${user.id}`);
        router.delete(`/admin/usuarios/${user.id}`, {
            preserveScroll: true,
            onFinish: () => setBusyAction(null),
        });
    }

    const hasFilters = Boolean(filters.q || filters.status);

    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Usuários e grupos">
                <PageHeading
                    title="Usuários e grupos"
                    description="Gerencie acesso, funções e recuperação de conta."
                >
                    {canManageRoles && (
                        <Link
                            className="cms-button secondary"
                            href="/admin/grupos"
                        >
                            Gerenciar grupos
                        </Link>
                    )}
                </PageHeading>

                <section className="admin-panel cms-users-panel">
                    <header className="cms-users-toolbar">
                        <div>
                            <h2>Pessoas com acesso</h2>
                            <p>
                                {hasFilters
                                    ? `${users.total} resultado(s) com os filtros atuais.`
                                    : `${users.total} usuário(s) cadastrado(s).`}
                            </p>
                        </div>
                        <div className="cms-users-toolbar-actions">
                            <form
                                className="cms-user-search"
                                role="search"
                                onSubmit={searchUsers}
                            >
                                <label
                                    className="sr-only"
                                    htmlFor="user-search"
                                >
                                    Buscar por nome, e-mail ou grupo
                                </label>
                                <input
                                    id="user-search"
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Nome, e-mail ou grupo"
                                />
                                <button type="submit" aria-label="Buscar">
                                    <span aria-hidden="true">⌕</span>
                                </button>
                            </form>
                            <label className="cms-field">
                                <span className="sr-only">
                                    Filtrar por status
                                </span>
                                <select
                                    aria-label="Filtrar usuários por status"
                                    value={filters.status}
                                    onChange={(event) =>
                                        filterByStatus(
                                            event.target
                                                .value as UserStatusFilter,
                                        )
                                    }
                                >
                                    <option value="">Todos os status</option>
                                    <option value="active">Ativos</option>
                                    <option value="pending">
                                        Convite pendente
                                    </option>
                                    <option value="disabled">
                                        Desativados
                                    </option>
                                </select>
                            </label>
                            <Link
                                className="cms-button primary"
                                href="/admin/usuarios/create"
                            >
                                Convidar usuário
                            </Link>
                        </div>
                    </header>

                    {users.data.length ? (
                        <div className="cms-user-directory">
                            <div
                                className="cms-user-directory-head"
                                aria-hidden="true"
                            >
                                <span>Pessoa</span>
                                <span>Status</span>
                                <span>Grupos de acesso</span>
                                <span>Ações</span>
                            </div>
                            {users.data.map((user) => (
                                <article key={user.id} className="cms-user-row">
                                    <div className="cms-user-identity">
                                        <span
                                            className="admin-avatar"
                                            aria-hidden="true"
                                        >
                                            {user.name
                                                .split(' ')
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join('')
                                                .toUpperCase()}
                                        </span>
                                        <span>
                                            <strong>{user.name}</strong>
                                            <a href={`mailto:${user.email}`}>
                                                {user.email}
                                            </a>
                                        </span>
                                    </div>
                                    <div data-label="Status">
                                        <UserStatus status={user.status} />
                                    </div>
                                    <div
                                        className="cms-user-roles"
                                        data-label="Grupos de acesso"
                                    >
                                        {user.roles.length ? (
                                            user.roles.map((role) => (
                                                <span key={role.id}>
                                                    {role.name}
                                                </span>
                                            ))
                                        ) : (
                                            <em>Nenhum grupo</em>
                                        )}
                                    </div>
                                    <UserActions
                                        user={user}
                                        busyAction={busyAction}
                                        onDelete={() => deleteUser(user)}
                                        onResetPassword={() =>
                                            resetPassword(user)
                                        }
                                        onToggleStatus={() =>
                                            toggleStatus(user)
                                        }
                                    />
                                </article>
                            ))}
                        </div>
                    ) : hasFilters ? (
                        <EmptyState
                            title="Nenhum resultado"
                            description="Ajuste a busca ou o status para encontrar a pessoa."
                            action={
                                <button
                                    type="button"
                                    className="cms-button secondary"
                                    onClick={clearFilters}
                                >
                                    Limpar filtros
                                </button>
                            }
                        />
                    ) : (
                        <EmptyState
                            title="Nenhum usuário"
                            description="Convide a primeira pessoa para colaborar."
                            action={
                                <Link
                                    className="cms-button primary"
                                    href="/admin/usuarios/create"
                                >
                                    Convidar usuário
                                </Link>
                            }
                        />
                    )}
                    <Pagination page={users} />
                </section>
            </AdminLayout>
        </>
    );
}
