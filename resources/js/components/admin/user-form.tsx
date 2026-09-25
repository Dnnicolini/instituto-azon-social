import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { focusFirstFormError } from '@/lib/cms-form';
import type { ManagedUser } from '@/types/cms';

export type AccessRole = { id: number; name: string; slug: string };

const roleDescriptions: Record<string, string> = {
    administrator: 'Acesso completo ao painel, usuários e configurações.',
    editor: 'Cria e edita rascunhos, sem publicar conteúdo.',
    publisher: 'Cria, revisa, publica e arquiva conteúdo.',
};

export function UserForm({
    roles,
    user,
}: {
    roles: AccessRole[];
    user?: ManagedUser;
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
            onError: () => focusFirstFormError(formId),
        };

        if (user) form.put(`/admin/usuarios/${user.id}`, options);
        else form.post('/admin/usuarios', options);
    }

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
                    email: 'E-mail',
                    roles: 'Grupos de acesso',
                }}
                fieldIds={{
                    name: `${formId}-name`,
                    email: `${formId}-email`,
                    roles: `${formId}-roles`,
                }}
            />

            <section className="cms-form-section">
                <h2>Identificação</h2>
                <p>
                    Use o nome que a pessoa reconhece e um e-mail ao qual ela
                    tenha acesso.
                </p>
                <div>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label htmlFor={`${formId}-name`}>Nome</label>
                            <input
                                id={`${formId}-name`}
                                name="name"
                                autoComplete="name"
                                autoFocus
                                disabled={form.processing}
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
                                placeholder="nome@exemplo.org.br"
                                disabled={form.processing}
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                aria-invalid={Boolean(form.errors.email)}
                            />
                            <small>
                                {user
                                    ? 'Ao trocar o e-mail, a pessoa precisará verificá-lo novamente.'
                                    : 'O convite para definir a senha será enviado para este endereço.'}
                            </small>
                            <FieldError message={form.errors.email} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="cms-form-section">
                <h2>Grupos de acesso</h2>
                <p>
                    Escolha somente o necessário para o trabalho desta pessoa. É
                    obrigatório selecionar ao menos um grupo.
                </p>
                <fieldset
                    id={`${formId}-roles`}
                    className="cms-checkbox-group"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.roles)}
                >
                    <legend>Permissões por função</legend>
                    <div className="cms-role-options">
                        {roles.map((role) => (
                            <label key={role.id}>
                                <input
                                    type="checkbox"
                                    checked={form.data.roles.includes(role.id)}
                                    onChange={() => toggleRole(role.id)}
                                />
                                <span>
                                    <strong>{role.name}</strong>
                                    <small>
                                        {roleDescriptions[role.slug] ??
                                            'Permissões definidas neste grupo.'}
                                    </small>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <FieldError message={form.errors.roles} />
            </section>

            <div className="cms-form-actions">
                <span aria-live="polite">
                    {form.processing
                        ? 'Salvando…'
                        : form.isDirty
                          ? 'Há alterações não salvas.'
                          : user
                            ? 'Nenhuma alteração pendente.'
                            : 'Preencha os dados para enviar o convite.'}
                </span>
                <div>
                    <Link
                        className="cms-button secondary"
                        href="/admin/usuarios"
                    >
                        Cancelar
                    </Link>
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
            </div>
        </form>
    );
}
