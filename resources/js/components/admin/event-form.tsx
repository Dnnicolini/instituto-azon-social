import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { ImageGalleryFields } from './image-gallery-fields';
import { ProjectLinkField } from './project-link-field';
import type { ContentStatus, Event, SelectOption } from '@/types/cms';
import { useCan } from './use-can';
import {
    focusFirstFormError,
    normalizePublicationIntent,
    slugifyTitle,
} from '@/lib/cms-form';

export function EventForm({
    event,
    projectOptions = [],
}: {
    event?: Event;
    projectOptions?: SelectOption[];
}) {
    const canPublish = useCan('content.publish');
    const formId = event ? `event-${event.id}` : 'create-event';
    const slugWasEdited = useRef(Boolean(event));
    const publicationIntent = useRef<ContentStatus | null>(null);
    const form = useForm<{
        title: string;
        slug: string;
        summary: string;
        body: string;
        location: string;
        starts_at: string;
        ends_at: string;
        date_label: string;
        registration_url: string;
        participation_details: string;
        status: ContentStatus;
        published_at: string;
        cover_alt: string;
        cover: File | null;
        gallery: File[];
        gallery_cover_id: number | null;
        remove_gallery_ids: number[];
        project_ids: number[];
    }>({
        title: event?.title ?? '',
        slug: event?.slug ?? '',
        summary: event?.summary ?? '',
        body: event?.body ?? '',
        location: event?.location ?? '',
        starts_at: event?.starts_at?.slice(0, 16) ?? '',
        ends_at: event?.ends_at?.slice(0, 16) ?? '',
        date_label: event?.date_label ?? '',
        registration_url: event?.registration_url ?? '',
        participation_details: event?.participation_details ?? '',
        status:
            event?.status &&
            ['draft', 'review', 'scheduled', 'published', 'archived'].includes(
                event.status,
            )
                ? (event.status as ContentStatus)
                : 'draft',
        published_at: event?.published_at?.slice(0, 16) ?? '',
        cover_alt: event?.cover_alt ?? '',
        cover: null,
        gallery: [],
        gallery_cover_id: null,
        remove_gallery_ids: [],
        project_ids: event?.project_ids ?? [],
    });
    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
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
        if (event)
            form.post(`/admin/eventos/${event.id}`, {
                ...options,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/eventos', options);
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
                    body: 'Descrição completa',
                    published_at: 'Data de publicação',
                    starts_at: 'Início',
                    ends_at: 'Término',
                    date_label: 'Texto alternativo da data',
                    location: 'Local',
                    registration_url: 'Link para inscrição',
                    participation_details: 'Como participar',
                    status: 'Status',
                    cover: 'Foto escolhida como capa',
                    cover_alt: 'Descrição da foto de capa',
                    gallery: 'Fotos',
                    gallery_cover_id: 'Foto escolhida como capa',
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
                    <h2>Informações do evento</h2>
                    <div className="cms-field">
                        <label htmlFor="title">Título</label>
                        <input
                            id="title"
                            autoFocus
                            value={form.data.title}
                            onChange={(changeEvent) => {
                                const title = changeEvent.target.value;
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
                            onChange={(changeEvent) => {
                                slugWasEdited.current = true;
                                form.setData('slug', changeEvent.target.value);
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
                        <label htmlFor="summary">Resumo</label>
                        <textarea
                            id="summary"
                            rows={4}
                            value={form.data.summary}
                            onChange={(changeEvent) =>
                                form.setData(
                                    'summary',
                                    changeEvent.target.value,
                                )
                            }
                            aria-invalid={Boolean(form.errors.summary)}
                        />
                        <FieldError message={form.errors.summary} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="body">Descrição completa</label>
                        <textarea
                            id="body"
                            rows={10}
                            value={form.data.body}
                            onChange={(changeEvent) =>
                                form.setData('body', changeEvent.target.value)
                            }
                            aria-invalid={Boolean(form.errors.body)}
                        />
                        <FieldError message={form.errors.body} />
                    </div>
                </section>
                <section className="cms-form-section">
                    <h2>Data e participação</h2>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label>
                                Início
                                <input
                                    id="starts_at"
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'starts_at',
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.starts_at,
                                    )}
                                />
                            </label>
                            <FieldError message={form.errors.starts_at} />
                        </div>
                        <div className="cms-field">
                            <label>
                                Término
                                <input
                                    id="ends_at"
                                    type="datetime-local"
                                    value={form.data.ends_at}
                                    onChange={(e) =>
                                        form.setData('ends_at', e.target.value)
                                    }
                                    aria-invalid={Boolean(form.errors.ends_at)}
                                />
                            </label>
                            <FieldError message={form.errors.ends_at} />
                        </div>
                    </div>
                    <div className="cms-field">
                        <label>
                            Texto alternativo da data
                            <input
                                id="date_label"
                                placeholder="Ex.: Inscrições contínuas"
                                value={form.data.date_label}
                                onChange={(e) =>
                                    form.setData('date_label', e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.date_label)}
                            />
                        </label>
                        <FieldError message={form.errors.date_label} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Local do evento
                            <input
                                id="location"
                                placeholder="Ex.: Sede do Instituto Azon Social, Sepetiba"
                                autoComplete="street-address"
                                value={form.data.location}
                                onChange={(e) =>
                                    form.setData('location', e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.location)}
                            />
                        </label>
                        <small>
                            Informe o espaço, bairro ou endereço que deve
                            aparecer no site e no calendário.
                        </small>
                        <FieldError message={form.errors.location} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Link para inscrição
                            <input
                                id="registration_url"
                                type="text"
                                inputMode="url"
                                placeholder="https://forms.gle/... ou /eventos/inscricao"
                                value={form.data.registration_url}
                                onChange={(e) =>
                                    form.setData(
                                        'registration_url',
                                        e.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    form.errors.registration_url,
                                )}
                            />
                        </label>
                        <small>
                            Use uma URL completa com http/https ou um caminho
                            deste site iniciado por /.
                        </small>
                        <FieldError message={form.errors.registration_url} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Como participar
                            <textarea
                                id="participation_details"
                                rows={5}
                                placeholder="Explique inscrições, documentos, público e orientações para participar."
                                value={form.data.participation_details}
                                onChange={(e) =>
                                    form.setData(
                                        'participation_details',
                                        e.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    form.errors.participation_details,
                                )}
                            />
                        </label>
                        <FieldError
                            message={form.errors.participation_details}
                        />
                    </div>
                </section>
                <ImageGalleryFields
                    images={event?.gallery_images}
                    files={form.data.gallery}
                    coverFile={form.data.cover}
                    currentCoverUrl={event?.cover_url}
                    currentCoverAlt={event?.cover_alt}
                    dimensionHint="Dimensões recomendadas para a capa: 1200 × 675 px (16:9). Máximo de 5000 × 5000 px."
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
                            cover_alt: `Imagem de capa de ${form.data.title || 'evento'}`,
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
                                `Imagem de capa de ${form.data.title || 'evento'}`,
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
                <ProjectLinkField
                    options={projectOptions}
                    selected={form.data.project_ids}
                    onChange={(ids) => form.setData('project_ids', ids)}
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
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                isNew={!event}
                cancelHref="/admin/eventos"
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
