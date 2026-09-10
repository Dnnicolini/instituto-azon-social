import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    EmptyState,
    FieldError,
    PageHeading,
    Pagination,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, ManagedUser, Paginated } from '@/types/cms';
type Role = { id: number; name: string; slug: string };
function UserForm({
    roles,
    user,
    onDone,
}: {
    roles: Role[];
    user?: ManagedUser;
    onDone?: () => void;
}) {
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        roles: user?.roles.map((role) => role.id) ?? ([] as number[]),
    });
    function toggle(id: number) {
        form.setData(
            'roles',
            form.data.roles.includes(id)
                ? form.data.roles.filter((item) => item !== id)
                : [...form.data.roles, id],
        );
    }
    function submit(e: FormEvent) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!user) form.reset();
                onDone?.();
            },
        };
        if (user) form.put(`/admin/usuarios/${user.id}`, options);
        else form.post('/admin/usuarios', options);
    }
    return (
        <form className="cms-user-form" onSubmit={submit}>
            <div className="cms-form-grid two">
                <div className="cms-field">
                    <label>
                        Nome
                        <input
                            autoFocus={!user}
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                    </label>
                    <FieldError message={form.errors.name} />
                </div>
                <div className="cms-field">
                    <label>
                        E-mail
                        <input
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                        />
                    </label>
                    <FieldError message={form.errors.email} />
                </div>
            </div>
            <fieldset className="cms-checkbox-group">
                <legend>Grupos de acesso</legend>
                {roles.map((role) => (
                    <label key={role.id}>
                        <input
                            type="checkbox"
                            checked={form.data.roles.includes(role.id)}
                            onChange={() => toggle(role.id)}
                        />
                        <span>
                            <strong>{role.name}</strong>
                            <small>{role.slug}</small>
                        </span>
                    </label>
                ))}
            </fieldset>
            <FieldError message={form.errors.roles} />
            <div className="cms-inline-actions">
                {onDone && (
                    <button
                        type="button"
                        className="cms-button secondary"
                        onClick={onDone}
                    >
                        Cancelar
                    </button>
                )}
                <button
                    className="cms-button primary"
                    disabled={form.processing}
                >
                    {form.processing
                        ? 'Salvando…'
                        : user
                          ? 'Salvar usuário'
                          : 'Convidar usuário'}
                </button>
            </div>
        </form>
    );
}
export default function Users({
    seo,
    users,
    roles,
}: AdminSharedProps & { users: Paginated<ManagedUser>; roles: Role[] }) {
    const [selected, setSelected] = useState<ManagedUser | null>(null);
    function remove(user: ManagedUser) {
        if (window.confirm(`Remover o acesso de “${user.name}”?`))
            router.delete(`/admin/usuarios/${user.id}`, {
                preserveScroll: true,
            });
    }
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Usuários e grupos">
                <PageHeading
                    title="Usuários e grupos"
                    description="Conceda somente o acesso necessário para cada responsabilidade."
                >
                    <Link className="cms-button secondary" href="/admin/grupos">
                        Gerenciar grupos
                    </Link>
                </PageHeading>
                <div className="cms-access-grid">
                    <section className="cms-form-section">
                        <h2>Convidar usuário</h2>
                        <p>
                            Um link seguro para definir a senha será enviado por
                            e-mail.
                        </p>
                        <UserForm roles={roles} />
                    </section>
                    <section className="admin-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <h2>Pessoas com acesso</h2>
                                <p>{users.total} usuário(s) cadastrado(s).</p>
                            </div>
                        </div>
                        {users.data.length ? (
                            <div className="cms-user-list">
                                {users.data.map((user) => (
                                    <article key={user.id}>
                                        <div
                                            className="admin-avatar"
                                            aria-hidden="true"
                                        >
                                            {user.name
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <strong>{user.name}</strong>
                                            <a href={`mailto:${user.email}`}>
                                                {user.email}
                                            </a>
                                            <span>
                                                {user.roles
                                                    .map((role) => role.name)
                                                    .join(', ')}
                                            </span>
                                        </div>
                                        <div className="cms-row-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelected(user)
                                                }
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => remove(user)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhum usuário"
                                description="Convide a primeira pessoa para colaborar."
                            />
                        )}
                        <Pagination page={users} />
                    </section>
                </div>
                {selected && (
                    <div
                        className="admin-modal-backdrop"
                        role="presentation"
                        onMouseDown={() => setSelected(null)}
                    >
                        <section
                            className="admin-modal cms-access-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="edit-user"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                className="admin-modal-close"
                                type="button"
                                onClick={() => setSelected(null)}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                            <h2 id="edit-user">Editar acesso</h2>
                            <p>Revise os dados e grupos de {selected.name}.</p>
                            <UserForm
                                user={selected}
                                roles={roles}
                                onDone={() => setSelected(null)}
                            />
                        </section>
                    </div>
                )}
            </AdminLayout>
        </>
    );
}
