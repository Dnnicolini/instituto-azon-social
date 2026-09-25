import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { focusFirstFormError, slugifyTitle } from '@/lib/cms-form';
import type { PermissionGroup } from '@/types/cms';

export type PermissionOption = {
    id: number;
    name: string;
    slug: string;
    group: string;
};

const permissionGroupLabels: Record<string, string> = {
    acesso: 'Acesso e equipe',
    configuração: 'Configurações',
    conteúdo: 'Conteúdo',
    mídia: 'Arquivos e mídia',
    painel: 'Painel administrativo',
};

export function RoleForm({
    permissions,
    role,
}: {
    permissions: PermissionOption[];
    role?: PermissionGroup;
}) {
    const formId = role ? `edit-role-${role.id}` : 'create-role';
    const slugWasEdited = useRef(Boolean(role));
    const form = useForm({
        name: role?.name ?? '',
        slug: role?.slug ?? '',
        description: role?.description ?? '',
        permissions:
            role?.permissions.map((permission) => permission.id) ??
            ([] as number[]),
    });

    function togglePermission(id: number) {
        form.setData(
            'permissions',
            form.data.permissions.includes(id)
                ? form.data.permissions.filter((item) => item !== id)
                : [...form.data.permissions, id],
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;

        const options = {
            onError: () => focusFirstFormError(formId),
        };
        if (role) form.put(`/admin/grupos/${role.id}`, options);
        else form.post('/admin/grupos', options);
    }

    const permissionGroups = [
        ...new Set(permissions.map((permission) => permission.group)),
    ];

    return (
        <form
            id={formId}
            className="cms-form-single"
            onSubmit={submit}
            noValidate
            aria-busy={form.processing}
        >
            <FormErrorSummary
                errors={form.errors}
                labels={{
                    name: 'Nome',
                    slug: 'Identificador interno',
                    description: 'Descrição',
                    permissions: 'Permissões',
                }}
                fieldIds={{
                    name: `${formId}-name`,
                    slug: `${formId}-slug`,
                    description: `${formId}-description`,
                    permissions: `${formId}-permissions`,
                }}
            />

            <section className="cms-form-section">
                <h2>Identificação do grupo</h2>
                <p>
                    Dê um nome que explique a responsabilidade da equipe, como
                    “Comunicação” ou “Coordenação de projetos”.
                </p>
                <div>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label htmlFor={`${formId}-name`}>Nome</label>
                            <input
                                id={`${formId}-name`}
                                autoFocus
                                disabled={form.processing}
                                value={form.data.name}
                                onChange={(event) => {
                                    const name = event.target.value;
                                    form.setData({
                                        ...form.data,
                                        name,
                                        slug: slugWasEdited.current
                                            ? form.data.slug
                                            : slugifyTitle(name),
                                    });
                                }}
                                aria-invalid={Boolean(form.errors.name)}
                            />
                            <FieldError message={form.errors.name} />
                        </div>
                        <div className="cms-field">
                            <label htmlFor={`${formId}-slug`}>
                                Identificador interno
                            </label>
                            <input
                                id={`${formId}-slug`}
                                disabled={form.processing}
                                value={form.data.slug}
                                onChange={(event) => {
                                    slugWasEdited.current = true;
                                    form.setData('slug', event.target.value);
                                }}
                                aria-invalid={Boolean(form.errors.slug)}
                            />
                            <small>
                                Gerado pelo nome. Use apenas letras, números,
                                hífen ou sublinhado.
                            </small>
                            <FieldError message={form.errors.slug} />
                        </div>
                    </div>
                    <div className="cms-field">
                        <label htmlFor={`${formId}-description`}>
                            O que este grupo faz?
                        </label>
                        <textarea
                            id={`${formId}-description`}
                            rows={3}
                            maxLength={1000}
                            disabled={form.processing}
                            placeholder="Explique quando este grupo deve ser atribuído a alguém."
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.description)}
                        />
                        <FieldError message={form.errors.description} />
                    </div>
                </div>
            </section>

            <section className="cms-form-section">
                <h2>Permissões</h2>
                <p>
                    Marque apenas o que este grupo precisa fazer. Permissões de
                    administração exigem também “Acessar painel”.
                </p>
                <fieldset
                    id={`${formId}-permissions`}
                    className="cms-permission-matrix"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.permissions)}
                >
                    <legend>O que este grupo pode fazer</legend>
                    {permissionGroups.map((group) => (
                        <div key={group}>
                            <strong>
                                {permissionGroupLabels[group] ?? group}
                            </strong>
                            {permissions
                                .filter(
                                    (permission) => permission.group === group,
                                )
                                .map((permission) => (
                                    <label key={permission.id}>
                                        <input
                                            type="checkbox"
                                            checked={form.data.permissions.includes(
                                                permission.id,
                                            )}
                                            onChange={() =>
                                                togglePermission(permission.id)
                                            }
                                        />
                                        <span>{permission.name}</span>
                                    </label>
                                ))}
                        </div>
                    ))}
                </fieldset>
                <FieldError message={form.errors.permissions} />
            </section>

            <div className="cms-form-actions">
                <span aria-live="polite">
                    {form.processing
                        ? 'Salvando…'
                        : form.isDirty
                          ? 'Há alterações não salvas.'
                          : role
                            ? 'Nenhuma alteração pendente.'
                            : 'Defina o grupo e suas permissões.'}
                </span>
                <div>
                    <Link className="cms-button secondary" href="/admin/grupos">
                        Cancelar
                    </Link>
                    <button
                        className="cms-button primary"
                        type="submit"
                        disabled={form.processing}
                    >
                        {form.processing
                            ? 'Salvando…'
                            : role
                              ? 'Salvar grupo'
                              : 'Criar grupo'}
                    </button>
                </div>
            </div>
        </form>
    );
}
