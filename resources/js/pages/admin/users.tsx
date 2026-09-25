import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    EmptyState,
    FieldError,
    PageHeading,
    Pagination,
} from '@/components/admin/cms-ui';
import { FormErrorSummary } from '@/components/admin/form-error-summary';
import { useCan } from '@/components/admin/use-can';
import { SeoHead } from '@/components/seo-head';
import { focusFirstFormError } from '@/lib/cms-form';
import { managedUserStatuses } from '@/lib/managed-user';
import type { AdminSharedProps, ManagedUser, Paginated } from '@/types/cms';

type Role = { id: number; name: string; slug: string };
type DialogMode = { kind: 'invite' } | { kind: 'edit'; user: ManagedUser };

function UserDialog({
    title,
    description,
    onClose,
    children,
}: {
    title: string;
    description: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const dialogRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const dialog = dialogRef.current;
        const focusable =
            dialog?.querySelector<HTMLElement>('[data-dialog-initial-focus]') ??
            dialog?.querySelector<HTMLElement>(
                'input:not([disabled]), select:not([disabled]), button:not([disabled]), a[href]',
            );

        focusable?.focus();

        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            previouslyFocused?.focus();
        };
    }, [onClose]);

    function keepFocusInside(event: KeyboardEvent<HTMLElement>) {
        if (event.key !== 'Tab') return;

        const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
                'input:not([disabled]), select:not([disabled]), button:not([disabled]), a[href]',
            ),
        );
        const first = focusable[0];
        const last = focusable.at(-1);

        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    return (
        <div
            className="admin-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) onClose();
            }}
        >
            <section
                ref={dialogRef}
                className="admin-modal cms-access-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-dialog-title"
                aria-describedby="user-dialog-description"
                onKeyDown={keepFocusInside}
            >
                <button
                    className="admin-modal-close"
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    ×
                </button>
                <header className="cms-access-modal-heading">
                    <h2 id="user-dialog-title">{title}</h2>
                    <p id="user-dialog-description">{description}</p>
                </header>
                {children}
            </section>
        </div>
    );
}

function UserForm({
    roles,
    user,
    onDone,
}: {
    roles: Role[];
    user?: ManagedUser;
    onDone: () => void;
}) {
    const formId = user ? `edit-user-${user.id}` : 'invite-user';
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        roles: user?.roles.map((role) => role.id) ?? ([] as number[]),
    });

    function toggleRole(id: number) {
        form.setData(
            'roles',
            form.data.roles.includes(id)
                ? form.data.roles.filter((item) => item !== id)
                : [...form.data.roles, id],
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;

        const options = {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => focusFirstFormError(formId),
        };

        if (user) form.put(`/admin/usuarios/${user.id}`, options);
        else form.post('/admin/usuarios', options);
    }

    return (
        <form
            id={formId}
            className="cms-user-form"
            onSubmit={submit}
            noValidate
            aria-busy={form.processing}
        >
            <FormErrorSummary
                errors={form.errors}
                labels={{
                    name: 'Nome',
                    email: 'E-mail',
                    roles: 'Grupos de acesso',
                }}
                fieldIds={{
                    name: `${formId}-name`,
                    email: `${formId}-email`,
                    roles: `${formId}-roles`,
                }}
            />
            <fieldset disabled={form.processing}>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label htmlFor={`${formId}-name`}>Nome</label>
                        <input
                            id={`${formId}-name`}
                            name="name"
                            autoComplete="name"
                            data-dialog-initial-focus
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.name)}
                        />
                        <FieldError message={form.errors.name} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor={`${formId}-email`}>E-mail</label>
                        <input
                            id={`${formId}-email`}
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.email)}
                        />
                        <FieldError message={form.errors.email} />
                    </div>
                </div>
                <fieldset
                    id={`${formId}-roles`}
                    className="cms-checkbox-group"
                    aria-invalid={Boolean(form.errors.roles)}
                >
                    <legend>Grupos de acesso</legend>
                    <p>
                        Selecione somente os grupos necessários para a função.
                    </p>
                    <div className="cms-role-options">
                        {roles.map((role) => (
                            <label key={role.id}>
                                <input
                                    type="checkbox"
                                    checked={form.data.roles.includes(role.id)}
                                    onChange={() => toggleRole(role.id)}
                                />
                                <span>{role.name}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <FieldError message={form.errors.roles} />
            </fieldset>
            <div className="cms-inline-actions cms-user-form-actions">
                <button
                    type="button"
                    className="cms-button secondary"
                    onClick={onDone}
                    disabled={form.processing}
                >
                    Cancelar
                </button>
                <button
                    className="cms-button primary"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing
                        ? 'Salvando…'
                        : user
                          ? 'Salvar alterações'
                          : 'Enviar convite'}
                </button>
            </div>
        </form>
    );
}

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
    onEdit,
    onDelete,
    onResetPassword,
    onToggleStatus,
}: {
    user: ManagedUser;
    busyAction: string | null;
    onEdit: () => void;
    onDelete: () => void;
    onResetPassword: () => void;
    onToggleStatus: () => void;
}) {
    const isBusy = busyAction !== null;
    const isDisabled = user.status === 'disabled';

    return (
        <div className="cms-user-actions" aria-busy={isBusy}>
            {user.capabilities.update && (
                <button type="button" onClick={onEdit} disabled={isBusy}>
                    Editar acesso
                </button>
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
    roles,
    filters,
}: AdminSharedProps & {
    users: Paginated<ManagedUser>;
    roles: Role[];
    filters: { q: string };
}) {
    const canManageRoles = useCan('roles.manage');
    const [query, setQuery] = useState(filters.q);
    const [dialog, setDialog] = useState<DialogMode | null>(null);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    function searchUsers(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/usuarios', query.trim() ? { q: query.trim() } : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function clearSearch() {
        setQuery('');
        router.get(
            '/admin/usuarios',
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
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
                                {filters.q
                                    ? `${users.total} resultado(s) para “${filters.q}”.`
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
                                    placeholder="Buscar por nome, e-mail ou grupo"
                                />
                                <button type="submit" aria-label="Buscar">
                                    <span aria-hidden="true">⌕</span>
                                </button>
                            </form>
                            <button
                                type="button"
                                className="cms-button primary"
                                onClick={() => setDialog({ kind: 'invite' })}
                            >
                                Convidar usuário
                            </button>
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
                                        onEdit={() =>
                                            setDialog({ kind: 'edit', user })
                                        }
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
                    ) : filters.q ? (
                        <EmptyState
                            title="Nenhum resultado"
                            description="Tente buscar por outro nome, e-mail ou grupo de acesso."
                            action={
                                <button
                                    type="button"
                                    className="cms-button secondary"
                                    onClick={clearSearch}
                                >
                                    Limpar busca
                                </button>
                            }
                        />
                    ) : (
                        <EmptyState
                            title="Nenhum usuário"
                            description="Convide a primeira pessoa para colaborar."
                            action={
                                <button
                                    type="button"
                                    className="cms-button primary"
                                    onClick={() =>
                                        setDialog({ kind: 'invite' })
                                    }
                                >
                                    Convidar usuário
                                </button>
                            }
                        />
                    )}
                    <Pagination page={users} />
                </section>

                {dialog?.kind === 'invite' && (
                    <UserDialog
                        title="Convidar usuário"
                        description="A pessoa receberá um link seguro para definir a senha."
                        onClose={() => setDialog(null)}
                    >
                        <UserForm
                            roles={roles}
                            onDone={() => setDialog(null)}
                        />
                    </UserDialog>
                )}
                {dialog?.kind === 'edit' && (
                    <UserDialog
                        title="Editar acesso"
                        description={`Revise os dados e grupos de ${dialog.user.name}.`}
                        onClose={() => setDialog(null)}
                    >
                        <UserForm
                            user={dialog.user}
                            roles={roles}
                            onDone={() => setDialog(null)}
                        />
                    </UserDialog>
                )}
            </AdminLayout>
        </>
    );
}
