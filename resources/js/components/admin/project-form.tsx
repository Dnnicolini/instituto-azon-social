import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { ImageGalleryFields } from './image-gallery-fields';
import type { ContentStatus, Project, RegistrationType } from '@/types/cms';
import { useCan } from './use-can';
import {
    focusFirstFormError,
    normalizePublicationIntent,
    slugifyTitle,
} from '@/lib/cms-form';

export function ProjectForm({ project }: { project?: Project }) {
    const canPublish = useCan('content.publish');
    const formId = project ? `project-${project.id}` : 'create-project';
    const slugWasEdited = useRef(Boolean(project));
    const publicationIntent = useRef<ContentStatus | null>(null);
    const form = useForm<{
        title: string;
        slug: string;
        summary: string;
        badge_label: string;
        body: string;
        status: ContentStatus;
        published_at: string;
        sort_order: number;
        cover_alt: string;
        cover: File | null;
        gallery: File[];
        gallery_cover_id: number | null;
        remove_gallery_ids: number[];
        registration_enabled: boolean;
        registration_type: RegistrationType;
        registration_title: string;
        registration_description: string;
        registration_instructions: string;
        registration_start_at: string;
        registration_end_at: string;
        registration_max_applications: number | null;
        registration_allow_editing: boolean;
        registration_edit_deadline: string;
        registration_requires_authentication: boolean;
        registration_one_per_user: boolean;
        registration_success_message: string;
        registration_confirmation_message: string;
        registration_url: string;
        registration_button_label: string;
    }>({
        title: project?.title ?? '',
        slug: project?.slug ?? '',
        summary: project?.summary ?? '',
        badge_label: project?.badge_label ?? 'Ação comunitária',
        body: project?.body ?? '',
        status: project?.status ?? 'draft',
        published_at: project?.published_at?.slice(0, 16) ?? '',
        sort_order: project?.sort_order ?? 0,
        cover_alt: project?.cover_alt ?? '',
        cover: null,
        gallery: [],
        gallery_cover_id: null,
        remove_gallery_ids: [],
        registration_enabled: project?.registration_enabled ?? false,
        registration_type: project?.registration_type ?? 'internal',
        registration_title: project?.registration_title ?? project?.title ?? '',
        registration_description: project?.registration_description ?? '',
        registration_instructions: project?.registration_instructions ?? '',
        registration_start_at:
            project?.registration_start_at?.slice(0, 16) ?? '',
        registration_end_at: project?.registration_end_at?.slice(0, 16) ?? '',
        registration_max_applications:
            project?.registration_max_applications ?? null,
        registration_allow_editing:
            project?.registration_allow_editing ?? false,
        registration_edit_deadline:
            project?.registration_edit_deadline?.slice(0, 16) ?? '',
        registration_requires_authentication:
            project?.registration_requires_authentication ?? false,
        registration_one_per_user: project?.registration_one_per_user ?? true,
        registration_success_message:
            project?.registration_success_message ??
            'Inscrição realizada com sucesso.',
        registration_confirmation_message:
            project?.registration_confirmation_message ?? '',
        registration_url: project?.registration_url ?? '',
        registration_button_label:
            project?.registration_button_label ?? 'Inscreva-se',
    });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (form.processing) return;
        const status = normalizePublicationIntent(
            publicationIntent.current ?? undefined,
            form.data.status,
            canPublish,
        );
        publicationIntent.current = null;
        form.transform((data) => ({ ...data, status }));
        const options = {
            forceFormData: true,
            onError: () => focusFirstFormError(formId),
        };
        if (project)
            form.post(`/admin/projetos/${project.id}`, {
                ...options,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/projetos', options);
    }
    return (
        <form
            id={formId}
            className="cms-editor"
            onSubmit={submit}
            noValidate
            aria-busy={form.processing}
        >
            <FormErrorSummary
                errors={form.errors}
                labels={{
                    title: 'Título',
                    slug: 'Endereço amigável',
                    summary: 'Resumo',
                    badge_label: 'Identificação do projeto',
                    body: 'Descrição completa',
                    status: 'Status',
                    published_at: 'Data de publicação',
                    sort_order: 'Ordem',
                    cover: 'Foto escolhida como capa',
                    cover_alt: 'Descrição da foto de capa',
                    gallery: 'Mídias da galeria',
                    gallery_cover_id: 'Foto escolhida como capa',
                    registration_enabled: 'Aceitar inscrições',
                    registration_type: 'Tipo de inscrição',
                    registration_title: 'Título da inscrição',
                    registration_description: 'Descrição da inscrição',
                    registration_instructions: 'Instruções',
                    registration_start_at: 'Abertura das inscrições',
                    registration_end_at: 'Encerramento das inscrições',
                    registration_max_applications: 'Limite de inscrições',
                    registration_edit_deadline: 'Limite para edição',
                    registration_success_message: 'Mensagem após o envio',
                    registration_confirmation_message:
                        'Mensagem de confirmação',
                    registration_url: 'URL da inscrição',
                    registration_button_label: 'Texto do botão',
                }}
                fieldIds={{
                    cover: 'gallery',
                    cover_alt: 'gallery',
                    gallery: 'gallery',
                    gallery_cover_id: 'gallery',
                }}
            />
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Sobre o projeto</h2>
                    <div className="cms-field">
                        <label htmlFor="title">Título</label>
                        <input
                            id="title"
                            autoFocus
                            value={form.data.title}
                            onChange={(event) => {
                                const title = event.target.value;
                                form.setData({
                                    ...form.data,
                                    title,
                                    slug: slugWasEdited.current
                                        ? form.data.slug
                                        : slugifyTitle(title),
                                });
                            }}
                            aria-invalid={Boolean(form.errors.title)}
                        />
                        <FieldError message={form.errors.title} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="slug">Endereço amigável</label>
                        <input
                            id="slug"
                            value={form.data.slug}
                            onChange={(event) => {
                                slugWasEdited.current = true;
                                form.setData('slug', event.target.value);
                            }}
                            aria-invalid={Boolean(form.errors.slug)}
                        />
                        <small>
                            Gerado pelo título. Você pode personalizar antes de
                            salvar.
                        </small>
                        <FieldError message={form.errors.slug} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="badge_label">
                            Identificação do projeto
                        </label>
                        <input
                            id="badge_label"
                            maxLength={80}
                            placeholder="Ex.: Saúde mental"
                            value={form.data.badge_label}
                            onChange={(e) =>
                                form.setData('badge_label', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.badge_label)}
                        />
                        <small>
                            Texto curto exibido sobre a imagem do projeto no
                            site.
                        </small>
                        <FieldError message={form.errors.badge_label} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="summary">Resumo</label>
                        <textarea
                            id="summary"
                            rows={4}
                            maxLength={1000}
                            value={form.data.summary}
                            onChange={(e) =>
                                form.setData('summary', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.summary)}
                        />
                        <FieldError message={form.errors.summary} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="body">Descrição completa</label>
                        <textarea
                            id="body"
                            rows={14}
                            value={form.data.body}
                            onChange={(e) =>
                                form.setData('body', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.body)}
                        />
                        <FieldError message={form.errors.body} />
                    </div>
                </section>
                <section className="cms-form-section">
                    <h2>Inscrições e candidaturas</h2>
                    <p className="cms-form-section-intro">
                        Ative somente quando este projeto receber inscrições. O
                        formulário e os candidatos ficam em telas próprias.
                    </p>
                    <label className="cms-check-row">
                        <input
                            id="registration_enabled"
                            type="checkbox"
                            checked={form.data.registration_enabled}
                            onChange={(event) =>
                                form.setData(
                                    'registration_enabled',
                                    event.target.checked,
                                )
                            }
                        />
                        <span>
                            <strong>Aceitar inscrições/candidaturas</strong>
                            <small>
                                Quando desativado, nenhuma chamada de inscrição
                                será exibida no projeto.
                            </small>
                        </span>
                    </label>
                    <FieldError message={form.errors.registration_enabled} />

                    {form.data.registration_enabled && (
                        <>
                            <div className="cms-field">
                                <label htmlFor="registration_type">
                                    Tipo de inscrição
                                </label>
                                <select
                                    id="registration_type"
                                    value={form.data.registration_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'registration_type',
                                            event.target
                                                .value as RegistrationType,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.registration_type,
                                    )}
                                >
                                    <option value="internal">
                                        Inscrição pelo sistema
                                    </option>
                                    <option value="external">
                                        Link externo de inscrição
                                    </option>
                                </select>
                                <FieldError
                                    message={form.errors.registration_type}
                                />
                            </div>
                            <div className="cms-form-grid two">
                                <div className="cms-field">
                                    <label htmlFor="registration_start_at">
                                        Abertura
                                    </label>
                                    <input
                                        id="registration_start_at"
                                        type="datetime-local"
                                        value={form.data.registration_start_at}
                                        onChange={(event) =>
                                            form.setData(
                                                'registration_start_at',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.registration_start_at,
                                        )}
                                    />
                                    <FieldError
                                        message={
                                            form.errors.registration_start_at
                                        }
                                    />
                                </div>
                                <div className="cms-field">
                                    <label htmlFor="registration_end_at">
                                        Encerramento
                                    </label>
                                    <input
                                        id="registration_end_at"
                                        type="datetime-local"
                                        value={form.data.registration_end_at}
                                        onChange={(event) =>
                                            form.setData(
                                                'registration_end_at',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.registration_end_at,
                                        )}
                                    />
                                    <FieldError
                                        message={
                                            form.errors.registration_end_at
                                        }
                                    />
                                </div>
                            </div>

                            {form.data.registration_type === 'external' ? (
                                <>
                                    <div className="cms-field">
                                        <label htmlFor="registration_url">
                                            URL da inscrição
                                        </label>
                                        <input
                                            id="registration_url"
                                            type="url"
                                            placeholder="https://exemplo.org.br/formulario"
                                            value={form.data.registration_url}
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_url',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.registration_url,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors.registration_url
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_button_label">
                                            Texto do botão
                                        </label>
                                        <input
                                            id="registration_button_label"
                                            maxLength={80}
                                            value={
                                                form.data
                                                    .registration_button_label
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_button_label',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_button_label,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_button_label
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_instructions">
                                            Instruções opcionais
                                        </label>
                                        <textarea
                                            id="registration_instructions"
                                            rows={4}
                                            value={
                                                form.data
                                                    .registration_instructions
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_instructions',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_instructions,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_instructions
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="cms-field">
                                        <label htmlFor="registration_title">
                                            Título da inscrição
                                        </label>
                                        <input
                                            id="registration_title"
                                            value={form.data.registration_title}
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_title',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.registration_title,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors.registration_title
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_description">
                                            Descrição
                                        </label>
                                        <textarea
                                            id="registration_description"
                                            rows={3}
                                            value={
                                                form.data
                                                    .registration_description
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_description',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_description,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_description
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_instructions">
                                            Instruções ao candidato
                                        </label>
                                        <textarea
                                            id="registration_instructions"
                                            rows={5}
                                            value={
                                                form.data
                                                    .registration_instructions
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_instructions',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_instructions,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_instructions
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_max_applications">
                                            Limite de inscrições
                                        </label>
                                        <input
                                            id="registration_max_applications"
                                            type="number"
                                            min="1"
                                            placeholder="Sem limite"
                                            value={
                                                form.data
                                                    .registration_max_applications ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_max_applications',
                                                    event.target.value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_max_applications,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_max_applications
                                            }
                                        />
                                    </div>
                                    <label className="cms-check-row">
                                        <input
                                            type="checkbox"
                                            checked={
                                                form.data
                                                    .registration_one_per_user
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_one_per_user',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span>
                                            <strong>
                                                Evitar inscrições duplicadas
                                            </strong>
                                            <small>
                                                Usa o e-mail preenchido no
                                                formulário para impedir um novo
                                                envio ao mesmo projeto.
                                            </small>
                                        </span>
                                    </label>
                                    <div className="cms-field">
                                        <label htmlFor="registration_success_message">
                                            Mensagem após o envio
                                        </label>
                                        <textarea
                                            id="registration_success_message"
                                            rows={3}
                                            value={
                                                form.data
                                                    .registration_success_message
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_success_message',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_success_message,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_success_message
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label htmlFor="registration_confirmation_message">
                                            Mensagem de confirmação por e-mail
                                        </label>
                                        <textarea
                                            id="registration_confirmation_message"
                                            rows={4}
                                            placeholder="Opcional. O protocolo será incluído pelo sistema."
                                            value={
                                                form.data
                                                    .registration_confirmation_message
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    'registration_confirmation_message',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors
                                                    .registration_confirmation_message,
                                            )}
                                        />
                                        <FieldError
                                            message={
                                                form.errors
                                                    .registration_confirmation_message
                                            }
                                        />
                                    </div>
                                    {project && (
                                        <p>
                                            Salve o projeto e use as abas
                                            Formulário e Candidatos para
                                            concluir a configuração.
                                        </p>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </section>
                <ImageGalleryFields
                    images={project?.gallery_images}
                    files={form.data.gallery}
                    coverFile={form.data.cover}
                    currentCoverUrl={project?.cover_url}
                    currentCoverAlt={project?.cover_alt}
                    selectedCoverId={form.data.gallery_cover_id}
                    removedIds={form.data.remove_gallery_ids}
                    error={form.errors.gallery}
                    coverError={
                        form.errors.cover ||
                        form.errors.gallery_cover_id ||
                        form.errors.cover_alt
                    }
                    onFilesChange={(files) => form.setData('gallery', files)}
                    onNewCoverSelect={(file, remainingFiles) =>
                        form.setData({
                            ...form.data,
                            cover: file,
                            cover_alt: `Imagem de capa de ${form.data.title || 'projeto'}`,
                            gallery: remainingFiles,
                            gallery_cover_id: null,
                        })
                    }
                    onExistingCoverSelect={(id, alt) =>
                        form.setData({
                            ...form.data,
                            cover: null,
                            cover_alt:
                                alt ||
                                `Imagem de capa de ${form.data.title || 'projeto'}`,
                            gallery_cover_id: id,
                        })
                    }
                    onRemovedIdsChange={(ids) =>
                        form.setData({
                            ...form.data,
                            remove_gallery_ids: ids,
                            gallery_cover_id: ids.includes(
                                form.data.gallery_cover_id ?? 0,
                            )
                                ? null
                                : form.data.gallery_cover_id,
                        })
                    }
                />
            </div>
            <aside className="cms-editor-side">
                <section className="cms-form-section">
                    <h2>Publicação</h2>
                    <div
                        id="status"
                        className="cms-publication-state"
                        tabIndex={-1}
                    >
                        <span>Status atual</span>
                        <StatusBadge status={form.data.status} />
                        <small>
                            O botão usado ao salvar define o próximo status.
                        </small>
                        <FieldError message={form.errors.status} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="published_at">
                            Data e hora para agendar
                        </label>
                        <input
                            id="published_at"
                            type="datetime-local"
                            value={form.data.published_at}
                            onChange={(e) =>
                                form.setData('published_at', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.published_at)}
                        />
                        <small>
                            Preencha somente se quiser usar o botão Agendar.
                        </small>
                        <FieldError message={form.errors.published_at} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Ordem
                            <input
                                id="sort_order"
                                type="number"
                                min="0"
                                value={form.data.sort_order}
                                onChange={(e) =>
                                    form.setData(
                                        'sort_order',
                                        Number(e.target.value),
                                    )
                                }
                                aria-invalid={Boolean(form.errors.sort_order)}
                            />
                        </label>
                        <FieldError message={form.errors.sort_order} />
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                isNew={!project}
                cancelHref="/admin/projetos"
                currentStatus={form.data.status}
                canPublish={canPublish}
                canSchedule={Boolean(form.data.published_at)}
                onIntent={(status) => {
                    publicationIntent.current = status;
                    form.setData('status', status);
                }}
            />
        </form>
    );
}
