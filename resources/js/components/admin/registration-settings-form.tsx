import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { RegistrationStateBadge } from './registration-ui';
import { focusFirstFormError } from '@/lib/cms-form';
import type { Project, ProjectRegistration } from '@/types/cms';

function formatDate(value?: string | null) {
    if (!value) return 'Não definido';
    return new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export function RegistrationSettingsForm({
    project,
    registration,
}: {
    project: Project;
    registration: ProjectRegistration;
}) {
    const formId = `project-${project.id}-registration-settings`;
    const form = useForm({
        title: registration.title ?? '',
        description: registration.description ?? '',
        instructions: registration.instructions ?? '',
        max_applications: registration.max_applications ?? null,
        allow_editing: registration.allow_editing,
        edit_deadline: registration.edit_deadline?.slice(0, 16) ?? '',
        requires_authentication: registration.requires_auth,
        one_per_user: registration.one_per_user,
        success_message:
            registration.success_message ?? 'Inscrição realizada com sucesso.',
        confirmation_message: registration.confirmation_message ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;
        form.put(`/admin/projetos/${project.id}/inscricoes/configuracao`, {
            onError: () => focusFirstFormError(formId),
        });
    }

    return (
        <div className="cms-form-single">
            <section className="cms-form-section">
                <h2>Visão geral</h2>
                <dl className="cms-message-list">
                    <div>
                        <dt>Situação</dt>
                        <dd>
                            <RegistrationStateBadge
                                state={registration.state}
                            />
                        </dd>
                    </div>
                    <div>
                        <dt>Tipo</dt>
                        <dd>
                            {registration.type === 'internal'
                                ? 'Inscrição pelo sistema'
                                : 'Link externo'}
                        </dd>
                    </div>
                    <div>
                        <dt>Abertura</dt>
                        <dd>{formatDate(registration.start_at)}</dd>
                    </div>
                    <div>
                        <dt>Encerramento</dt>
                        <dd>{formatDate(registration.end_at)}</dd>
                    </div>
                </dl>
                <div className="cms-inline-actions">
                    <Link
                        className="cms-button secondary"
                        href={`/admin/projetos/${project.id}/edit`}
                    >
                        Editar tipo e período
                    </Link>
                </div>
            </section>

            {registration.type === 'external' ? (
                <section className="cms-form-section">
                    <h2>Inscrição externa</h2>
                    <p>
                        A URL, o período, as instruções e o texto do botão são
                        configurados nas informações do projeto. Não haverá
                        formulário ou candidatos armazenados neste sistema.
                    </p>
                    <Link
                        className="cms-button primary"
                        href={`/admin/projetos/${project.id}/edit`}
                    >
                        Revisar link externo
                    </Link>
                </section>
            ) : (
                <form
                    id={formId}
                    className="cms-form-single"
                    onSubmit={submit}
                    noValidate
                    aria-busy={form.processing}
                >
                    <FormErrorSummary errors={form.errors} />
                    <section className="cms-form-section">
                        <h2>Apresentação</h2>
                        <div className="cms-field">
                            <label htmlFor="registration-settings-title">
                                Título
                            </label>
                            <input
                                id="registration-settings-title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                aria-invalid={Boolean(form.errors.title)}
                            />
                            <FieldError message={form.errors.title} />
                        </div>
                        <div className="cms-field">
                            <label htmlFor="registration-settings-description">
                                Descrição
                            </label>
                            <textarea
                                id="registration-settings-description"
                                rows={3}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(form.errors.description)}
                            />
                            <FieldError message={form.errors.description} />
                        </div>
                        <div className="cms-field">
                            <label htmlFor="registration-settings-instructions">
                                Instruções ao candidato
                            </label>
                            <textarea
                                id="registration-settings-instructions"
                                rows={6}
                                value={form.data.instructions}
                                onChange={(event) =>
                                    form.setData(
                                        'instructions',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(form.errors.instructions)}
                            />
                            <FieldError message={form.errors.instructions} />
                        </div>
                    </section>

                    <section className="cms-form-section">
                        <h2>Regras para o candidato</h2>
                        <div className="cms-form-grid">
                            <div className="cms-field">
                                <label htmlFor="registration-settings-limit">
                                    Número máximo de inscrições
                                </label>
                                <input
                                    id="registration-settings-limit"
                                    type="number"
                                    min="1"
                                    placeholder="Sem limite"
                                    value={form.data.max_applications ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'max_applications',
                                            event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.max_applications,
                                    )}
                                />
                                <FieldError
                                    message={form.errors.max_applications}
                                />
                            </div>
                        </div>
                        <label className="cms-check-row">
                            <input
                                type="checkbox"
                                checked={form.data.one_per_user}
                                onChange={(event) =>
                                    form.setData(
                                        'one_per_user',
                                        event.target.checked,
                                    )
                                }
                            />
                            <span>
                                <strong>Evitar inscrições duplicadas</strong>
                                <small>
                                    Usa o e-mail informado no formulário para
                                    impedir outro envio ao mesmo projeto.
                                </small>
                            </span>
                        </label>
                    </section>

                    <section className="cms-form-section">
                        <h2>Mensagens automáticas</h2>
                        <div className="cms-field">
                            <label htmlFor="registration-settings-success">
                                Mensagem após o envio
                            </label>
                            <textarea
                                id="registration-settings-success"
                                rows={3}
                                value={form.data.success_message}
                                onChange={(event) =>
                                    form.setData(
                                        'success_message',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    form.errors.success_message,
                                )}
                            />
                            <FieldError message={form.errors.success_message} />
                        </div>
                        <div className="cms-field">
                            <label htmlFor="registration-settings-confirmation">
                                Confirmação por e-mail
                            </label>
                            <textarea
                                id="registration-settings-confirmation"
                                rows={4}
                                placeholder="Opcional. O protocolo será incluído automaticamente."
                                value={form.data.confirmation_message}
                                onChange={(event) =>
                                    form.setData(
                                        'confirmation_message',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    form.errors.confirmation_message,
                                )}
                            />
                            <FieldError
                                message={form.errors.confirmation_message}
                            />
                        </div>
                    </section>

                    <div className="cms-form-actions">
                        <span aria-live="polite">
                            {form.processing
                                ? 'Salvando…'
                                : form.isDirty
                                  ? 'Há alterações não salvas.'
                                  : 'Configuração atualizada.'}
                        </span>
                        <div>
                            <Link
                                className="cms-button secondary"
                                href={`/admin/projetos/${project.id}/inscricoes/formulario`}
                            >
                                Montar formulário
                            </Link>
                            <button
                                className="cms-button primary"
                                type="submit"
                                disabled={form.processing}
                            >
                                {form.processing
                                    ? 'Salvando…'
                                    : 'Salvar configuração'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
