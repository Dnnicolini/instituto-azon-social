import { Link, useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { ApplicationField } from '@/components/applications/application-field';
import { ApplicationReview } from '@/components/applications/application-review';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import {
    fieldErrorKey,
    formatApplicationDate,
    isAnswerMissing,
    isPresentationField,
    registrationStateMessage,
} from '@/lib/applications';
import type {
    ApplicationAnswerValue,
    ApplicationField as ApplicationFieldDefinition,
    ApplicationAnswer,
    ProjectApplyProps,
} from '@/types/applications';

type ApplicationStep = 'details' | 'documents' | 'review';

type ApplicationPayload = {
    answers: Record<string, ApplicationAnswerValue>;
    files: Record<string, File | null>;
    submit: boolean;
    confirmation: boolean;
    _method?: 'put';
};

type FormErrors = Partial<Record<string, string>>;

function initialAnswers(
    fields: ApplicationFieldDefinition[],
    saved: Record<string, ApplicationAnswer> = {},
) {
    return fields.reduce<Record<string, ApplicationAnswerValue>>(
        (answers, field) => {
            if (
                isPresentationField(field) ||
                ['file', 'image'].includes(field.type)
            ) {
                return answers;
            }

            answers[field.identifier] =
                saved[field.identifier]?.value ??
                (['multiple_choice', 'checkbox'].includes(field.type)
                    ? []
                    : field.type === 'acceptance'
                      ? false
                      : '');
            return answers;
        },
        {},
    );
}

function focusFirstApplicationError(): void {
    window.requestAnimationFrame(() => {
        const target =
            document.querySelector<HTMLElement>(
                '#application-form [aria-invalid="true"]',
            ) ??
            document.querySelector<HTMLElement>(
                '#application-form .application-error-summary',
            );
        target?.focus();
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

export default function ProjectApply({
    seo,
    project,
    registration,
    viewer,
    form: formDefinition,
    application,
    confirmation,
}: ProjectApplyProps) {
    const [step, setStep] = useState<ApplicationStep>('details');
    const [clientErrors, setClientErrors] = useState<FormErrors>({});
    const detailsFields = useMemo(
        () =>
            formDefinition.fields.filter(
                (field) => !['file', 'image'].includes(field.type),
            ),
        [formDefinition.fields],
    );
    const documentFields = useMemo(
        () =>
            formDefinition.fields.filter((field) =>
                ['file', 'image'].includes(field.type),
            ),
        [formDefinition.fields],
    );
    const applicationForm = useForm<ApplicationPayload>({
        answers: initialAnswers(formDefinition.fields, application?.answers),
        files: {},
        submit: false,
        confirmation: false,
    });
    const errors: FormErrors = {
        ...applicationForm.errors,
        ...clientErrors,
    };
    const isAuthenticated = viewer !== null && viewer !== undefined;
    const canEdit = application?.can_edit ?? registration.can_apply;
    const blockedByAuthentication =
        registration.requires_auth && !isAuthenticated;
    const mutationUrl = application
        ? `/minhas-inscricoes/${application.id}`
        : `/projetos/${encodeURIComponent(project.slug)}/inscricao`;

    function updateAnswer(identifier: string, value: ApplicationAnswerValue) {
        applicationForm.setData('answers', {
            ...applicationForm.data.answers,
            [identifier]: value,
        });
        setClientErrors((current) => {
            const next = { ...current };
            delete next[`answers.${identifier}`];
            return next;
        });
    }

    function updateFile(identifier: string, file: File | null) {
        applicationForm.setData('files', {
            ...applicationForm.data.files,
            [identifier]: file,
        });
        setClientErrors((current) => {
            const next = { ...current };
            delete next[`files.${identifier}`];
            return next;
        });
    }

    function validateFields(fields: ApplicationFieldDefinition[]): boolean {
        const nextErrors: FormErrors = {};

        for (const field of fields) {
            if (!field.required || isPresentationField(field)) continue;

            if (['file', 'image'].includes(field.type)) {
                const hasNewFile = Boolean(
                    applicationForm.data.files[field.identifier],
                );
                const hasExistingFile = application?.files.some(
                    (file) => file.identifier === field.identifier,
                );
                if (!hasNewFile && !hasExistingFile) {
                    nextErrors[fieldErrorKey(field)] =
                        'Selecione o arquivo solicitado.';
                }
                continue;
            }

            if (
                isAnswerMissing(applicationForm.data.answers[field.identifier])
            ) {
                nextErrors[fieldErrorKey(field)] =
                    field.type === 'acceptance'
                        ? 'Confirme este aceite para continuar.'
                        : 'Preencha este campo para continuar.';
            }
        }

        setClientErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            focusFirstApplicationError();
            return false;
        }

        return true;
    }

    function continueFromDetails(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validateFields(detailsFields)) return;
        setStep(documentFields.length > 0 ? 'documents' : 'review');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function continueFromDocuments(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validateFields(documentFields)) return;
        setStep('review');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function persist(submit: boolean) {
        if (submit && !applicationForm.data.confirmation) {
            setClientErrors({
                confirmation:
                    'Confirme que as informações são verdadeiras antes do envio.',
            });
            focusFirstApplicationError();
            return;
        }

        applicationForm.transform((data) => ({
            ...data,
            submit,
            ...(application ? { _method: 'put' as const } : {}),
        }));
        applicationForm.post(mutationUrl, {
            forceFormData: true,
            preserveScroll: true,
            onError: () => {
                setStep('details');
                focusFirstApplicationError();
            },
        });
    }

    if (confirmation) {
        return (
            <>
                <PublicSeoHead
                    seo={seo}
                    fallbackTitle={`Inscrição — ${project.title}`}
                    fallbackDescription={project.summary}
                />
                <AccessibilityTools />
                <PublicHeader />
                <main
                    className="application-page application-success-page"
                    id="conteudo-principal"
                    tabIndex={-1}
                >
                    <section className="application-success" aria-live="polite">
                        <span aria-hidden="true">✓</span>
                        <p className="eyebrow">Inscrição concluída</p>
                        <h1>Inscrição realizada com sucesso.</h1>
                        <p>
                            {confirmation.message ??
                                registration.success_message ??
                                'Recebemos sua candidatura. Guarde o protocolo para acompanhar o processo.'}
                        </p>
                        <dl>
                            <div>
                                <dt>Protocolo</dt>
                                <dd>{confirmation.protocol}</dd>
                            </div>
                            <div>
                                <dt>Enviada em</dt>
                                <dd>
                                    {formatApplicationDate(
                                        confirmation.submitted_at,
                                        true,
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="application-success-actions">
                            {confirmation.show_url && (
                                <Link
                                    className="button button-gold"
                                    href={confirmation.show_url}
                                >
                                    Acompanhar inscrição →
                                </Link>
                            )}
                            <Link className="text-link" href="/">
                                Voltar ao site
                            </Link>
                        </div>
                    </section>
                </main>
                <PublicFooter />
            </>
        );
    }

    return (
        <>
            <PublicSeoHead
                seo={seo}
                fallbackTitle={`Inscrição — ${project.title}`}
                fallbackDescription={project.summary}
            />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="application-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header className="application-heading">
                    <Link
                        className="text-link"
                        href={`/projetos/${project.slug}`}
                    >
                        ← Voltar ao projeto
                    </Link>
                    <p className="eyebrow">{project.title}</p>
                    <h1>
                        {registration.title ?? `Inscrição — ${project.title}`}
                    </h1>
                    <p>{registrationStateMessage(registration)}</p>
                </header>

                {blockedByAuthentication ? (
                    <section className="application-blocked">
                        <h2>Entre para fazer sua inscrição</h2>
                        <p>
                            Este projeto exige uma conta para salvar, enviar e
                            acompanhar a candidatura.
                        </p>
                        <Link
                            className="button button-gold"
                            href={`/acesso?redirect=${encodeURIComponent(`/projetos/${project.slug}/inscricao`)}`}
                        >
                            Entrar e continuar →
                        </Link>
                    </section>
                ) : !canEdit ? (
                    <section className="application-blocked">
                        <h2>{registrationStateMessage(registration)}</h2>
                        <p>
                            Não é possível criar ou editar uma inscrição neste
                            momento.
                        </p>
                        <Link
                            className="text-link"
                            href={`/projetos/${project.slug}`}
                        >
                            Voltar ao projeto
                        </Link>
                    </section>
                ) : (
                    <>
                        <ol
                            className="application-progress"
                            aria-label="Etapas da inscrição"
                        >
                            {[
                                ['details', 'Dados'],
                                ['documents', 'Documentos'],
                                ['review', 'Revisão'],
                            ].map(([value, label], index) => (
                                <li
                                    className={step === value ? 'active' : ''}
                                    aria-current={
                                        step === value ? 'step' : undefined
                                    }
                                    key={value}
                                >
                                    <span>{index + 1}</span>
                                    {label}
                                </li>
                            ))}
                        </ol>

                        <form
                            id="application-form"
                            className="application-form"
                            onSubmit={
                                step === 'details'
                                    ? continueFromDetails
                                    : continueFromDocuments
                            }
                            noValidate={false}
                        >
                            {Object.keys(errors).length > 0 && (
                                <section
                                    className="application-error-summary"
                                    role="alert"
                                    tabIndex={-1}
                                >
                                    <strong>Revise os campos indicados.</strong>
                                    <p>
                                        As informações ainda não foram enviadas.
                                    </p>
                                </section>
                            )}

                            {step === 'details' && (
                                <section aria-labelledby="application-details-title">
                                    <header>
                                        <h2 id="application-details-title">
                                            Preencha seus dados
                                        </h2>
                                        {formDefinition.description && (
                                            <p>{formDefinition.description}</p>
                                        )}
                                    </header>
                                    <div className="application-fields">
                                        {detailsFields.map((field) => (
                                            <ApplicationField
                                                field={field}
                                                value={
                                                    applicationForm.data
                                                        .answers[
                                                        field.identifier
                                                    ]
                                                }
                                                errors={errors}
                                                disabled={
                                                    applicationForm.processing
                                                }
                                                onAnswerChange={updateAnswer}
                                                onFileChange={updateFile}
                                                key={field.id}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {step === 'documents' && (
                                <section aria-labelledby="application-documents-title">
                                    <header>
                                        <h2 id="application-documents-title">
                                            Envie os documentos
                                        </h2>
                                        <p>
                                            Confira formato e tamanho permitidos
                                            antes de selecionar cada arquivo.
                                        </p>
                                    </header>
                                    <div className="application-fields">
                                        {documentFields.map((field) => (
                                            <ApplicationField
                                                field={field}
                                                existingFile={application?.files.find(
                                                    (file) =>
                                                        file.identifier ===
                                                        field.identifier,
                                                )}
                                                errors={errors}
                                                disabled={
                                                    applicationForm.processing
                                                }
                                                onAnswerChange={updateAnswer}
                                                onFileChange={updateFile}
                                                key={field.id}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {step === 'review' && (
                                <section aria-labelledby="application-review-title">
                                    <header>
                                        <h2 id="application-review-title">
                                            Revise sua inscrição
                                        </h2>
                                        <p>
                                            Confira seus dados antes do envio
                                            definitivo.
                                        </p>
                                    </header>
                                    <ApplicationReview
                                        fields={formDefinition.fields}
                                        answers={applicationForm.data.answers}
                                        files={applicationForm.data.files}
                                        existingFiles={application?.files ?? []}
                                        onEdit={() => setStep('details')}
                                    />
                                    <div className="application-confirmation">
                                        <label htmlFor="application-confirmation">
                                            <input
                                                id="application-confirmation"
                                                type="checkbox"
                                                checked={
                                                    applicationForm.data
                                                        .confirmation
                                                }
                                                disabled={
                                                    applicationForm.processing
                                                }
                                                aria-invalid={Boolean(
                                                    errors.confirmation,
                                                )}
                                                aria-describedby={
                                                    errors.confirmation
                                                        ? 'application-confirmation-error'
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    applicationForm.setData(
                                                        'confirmation',
                                                        event.currentTarget
                                                            .checked,
                                                    );
                                                    setClientErrors(
                                                        (current) => {
                                                            const next = {
                                                                ...current,
                                                            };
                                                            delete next.confirmation;
                                                            return next;
                                                        },
                                                    );
                                                }}
                                            />
                                            <span>
                                                Confirmo que as informações são
                                                verdadeiras.
                                            </span>
                                        </label>
                                        {errors.confirmation && (
                                            <p
                                                className="application-field-error"
                                                id="application-confirmation-error"
                                            >
                                                {errors.confirmation}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}

                            <footer className="application-form-actions">
                                {step !== 'details' && (
                                    <button
                                        className="button button-outline"
                                        type="button"
                                        disabled={applicationForm.processing}
                                        onClick={() =>
                                            setStep(
                                                step === 'review' &&
                                                    documentFields.length > 0
                                                    ? 'documents'
                                                    : 'details',
                                            )
                                        }
                                    >
                                        Voltar e editar
                                    </button>
                                )}
                                <div>
                                    {isAuthenticated && (
                                        <button
                                            className="text-link"
                                            type="button"
                                            disabled={
                                                applicationForm.processing
                                            }
                                            onClick={() => persist(false)}
                                        >
                                            Salvar rascunho
                                        </button>
                                    )}
                                    {step === 'review' ? (
                                        <button
                                            className="button button-gold"
                                            type="button"
                                            disabled={
                                                applicationForm.processing
                                            }
                                            onClick={() => persist(true)}
                                        >
                                            {applicationForm.processing
                                                ? 'Enviando…'
                                                : 'Enviar inscrição →'}
                                        </button>
                                    ) : (
                                        <button
                                            className="button button-gold"
                                            type="submit"
                                            disabled={
                                                applicationForm.processing
                                            }
                                        >
                                            Continuar →
                                        </button>
                                    )}
                                </div>
                            </footer>

                            {applicationForm.progress && (
                                <output className="application-upload-progress">
                                    Enviando arquivos:{' '}
                                    {applicationForm.progress.percentage ?? 0}%
                                </output>
                            )}
                        </form>
                    </>
                )}
            </main>
            <PublicFooter />
        </>
    );
}
