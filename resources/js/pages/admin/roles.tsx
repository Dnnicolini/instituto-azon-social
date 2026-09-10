import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, FieldError, PageHeading } from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, PermissionGroup } from '@/types/cms';
type Permission = { id: number; name: string; slug: string; group: string };
function RoleForm({
    permissions,
    role,
    onDone,
}: {
    permissions: Permission[];
    role?: PermissionGroup;
    onDone?: () => void;
}) {
    const form = useForm({
        name: role?.name ?? '',
        slug: role?.slug ?? '',
        description: role?.description ?? '',
        permissions: role?.permissions.map((p) => p.id) ?? ([] as number[]),
    });
    function toggle(id: number) {
        form.setData(
            'permissions',
            form.data.permissions.includes(id)
                ? form.data.permissions.filter((item) => item !== id)
                : [...form.data.permissions, id],
        );
    }
    function submit(e: FormEvent) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!role) form.reset();
                onDone?.();
            },
        };
        if (role) form.put(`/admin/grupos/${role.id}`, options);
        else form.post('/admin/grupos', options);
    }
    const permissionGroups = [...new Set(permissions.map((p) => p.group))];
    return (
        <form className="cms-user-form" onSubmit={submit}>
            <div className="cms-form-grid two">
                <div className="cms-field">
                    <label>
                        Nome
                        <input
                            autoFocus={!role}
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            disabled={role?.is_system}
                        />
                    </label>
                    <FieldError message={form.errors.name} />
                </div>
                <div className="cms-field">
                    <label>
                        Identificador
                        <input
                            value={form.data.slug}
                            onChange={(e) =>
                                form.setData('slug', e.target.value)
                            }
                            disabled={role?.is_system}
                        />
                    </label>
                    <FieldError message={form.errors.slug} />
                </div>
            </div>
            <div className="cms-field">
                <label>
                    Descrição
                    <textarea
                        rows={3}
                        value={form.data.description ?? ''}
                        onChange={(e) =>
                            form.setData('description', e.target.value)
                        }
                        disabled={role?.is_system}
                    />
                </label>
            </div>
            <fieldset
                className="cms-permission-matrix"
                disabled={role?.is_system}
            >
                <legend>Permissões</legend>
                {permissionGroups.map((group) => (
                    <div key={group}>
                        <strong>{group}</strong>
                        {permissions
                            .filter((p) => p.group === group)
                            .map((permission) => (
                                <label key={permission.id}>
                                    <input
                                        type="checkbox"
                                        checked={form.data.permissions.includes(
                                            permission.id,
                                        )}
                                        onChange={() => toggle(permission.id)}
                                    />
                                    <span>{permission.name}</span>
                                </label>
                            ))}
                    </div>
                ))}
            </fieldset>
            <FieldError message={form.errors.permissions} />
            {role?.is_system ? (
                <p className="cms-inline-empty">
                    Este grupo é protegido pelo sistema e não pode ser alterado.
                </p>
            ) : (
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
                            : role
                              ? 'Salvar grupo'
                              : 'Criar grupo'}
                    </button>
                </div>
            )}
        </form>
    );
}
export default function Roles({
    seo,
    groups,
    permissions,
}: AdminSharedProps & {
    groups: PermissionGroup[];
    permissions: Permission[];
}) {
    const [selected, setSelected] = useState<PermissionGroup | null>(null);
    function remove(role: PermissionGroup) {
        if (window.confirm(`Excluir o grupo “${role.name}”?`))
            router.delete(`/admin/grupos/${role.id}`, { preserveScroll: true });
    }
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Grupos e permissões">
                <PageHeading
                    title="Grupos e permissões"
                    description="Agrupe responsabilidades sem conceder acesso além do necessário."
                >
                    <Link
                        className="cms-button secondary"
                        href="/admin/usuarios"
                    >
                        Voltar aos usuários
                    </Link>
                </PageHeading>
                <div className="cms-access-grid">
                    <section className="cms-form-section">
                        <h2>Novo grupo</h2>
                        <RoleForm permissions={permissions} />
                    </section>
                    <section className="admin-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <h2>Grupos cadastrados</h2>
                                <p>Permissões efetivas por responsabilidade.</p>
                            </div>
                        </div>
                        {groups.length ? (
                            <div className="cms-role-list">
                                {groups.map((role) => (
                                    <article key={role.id}>
                                        <div>
                                            <h3>{role.name}</h3>
                                            <p>{role.description}</p>
                                            <small>
                                                {role.users_count} usuário(s) •{' '}
                                                {role.permissions.length}{' '}
                                                permissões
                                            </small>
                                        </div>
                                        <div className="cms-row-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelected(role)
                                                }
                                            >
                                                Detalhes
                                            </button>
                                            {!role.is_system && (
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => remove(role)}
                                                >
                                                    Excluir
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhum grupo"
                                description="Crie um grupo para distribuir permissões."
                            />
                        )}
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
                            aria-labelledby="edit-role"
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
                            <h2 id="edit-role">{selected.name}</h2>
                            <RoleForm
                                role={selected}
                                permissions={permissions}
                                onDone={() => setSelected(null)}
                            />
                        </section>
                    </div>
                )}
            </AdminLayout>
        </>
    );
}
