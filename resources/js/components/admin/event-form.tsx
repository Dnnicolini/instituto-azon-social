import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError, FormActions } from './cms-ui';
import type { ContentStatus, Event } from '@/types/cms';
import { statusLabels } from '@/types/cms';
import { useCan } from './use-can';

export function EventForm({ event }: { event?: Event }) {
    const canPublish = useCan('content.publish');
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
    });
    function submit(e: FormEvent) {
        e.preventDefault();
        if (event)
            form.post(`/admin/eventos/${event.id}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/eventos', { forceFormData: true });
    }
    return (
        <form className="cms-editor" onSubmit={submit} noValidate>
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Informações do evento</h2>
                    <div className="cms-field">
                        <label>
                            Título
                            <input
                                autoFocus
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.title} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Endereço amigável
                            <input
                                value={form.data.slug}
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.slug} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Resumo
                            <textarea
                                rows={4}
                                value={form.data.summary}
                                onChange={(e) =>
                                    form.setData('summary', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.summary} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Descrição completa
                            <textarea
                                rows={10}
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.body} />
                    </div>
                    {(form.data.status === 'scheduled' ||
                        form.data.status === 'published') && (
                        <div className="cms-field">
                            <label>
                                {form.data.status === 'scheduled'
                                    ? 'Publicar em'
                                    : 'Publicado em'}
                                <input
                                    type="datetime-local"
                                    value={form.data.published_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'published_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                            <FieldError message={form.errors.published_at} />
                        </div>
                    )}
                </section>
                <section className="cms-form-section">
                    <h2>Data e participação</h2>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label>
                                Início
                                <input
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'starts_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                            <FieldError message={form.errors.starts_at} />
                        </div>
                        <div className="cms-field">
                            <label>
                                Término
                                <input
                                    type="datetime-local"
                                    value={form.data.ends_at}
                                    onChange={(e) =>
                                        form.setData('ends_at', e.target.value)
                                    }
                                />
                            </label>
                            <FieldError message={form.errors.ends_at} />
                        </div>
                    </div>
                    <div className="cms-field">
                        <label>
                            Texto alternativo da data
                            <input
                                placeholder="Ex.: Inscrições contínuas"
                                value={form.data.date_label}
                                onChange={(e) =>
                                    form.setData('date_label', e.target.value)
                                }
                            />
                        </label>
                    </div>
                    <div className="cms-field">
                        <label>
                            Local
                            <input
                                value={form.data.location}
                                onChange={(e) =>
                                    form.setData('location', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.location} />
                    </div>
                    <div className="cms-field">
                        <label>
                            URL de inscrição
                            <input
                                type="url"
                                value={form.data.registration_url}
                                onChange={(e) =>
                                    form.setData(
                                        'registration_url',
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <FieldError message={form.errors.registration_url} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Como participar
                            <textarea
                                rows={5}
                                placeholder="Explique inscrições, documentos, público e orientações para participar."
                                value={form.data.participation_details}
                                onChange={(e) =>
                                    form.setData(
                                        'participation_details',
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <FieldError
                            message={form.errors.participation_details}
                        />
                    </div>
                </section>
            </div>
            <aside className="cms-editor-side">
                <section className="cms-form-section">
                    <h2>Publicação</h2>
                    <div className="cms-field">
                        <label>
                            Status
                            <select
                                value={form.data.status}
                                onChange={(e) =>
                                    form.setData(
                                        'status',
                                        e.target.value as ContentStatus,
                                    )
                                }
                            >
                                {Object.entries(statusLabels)
                                    .filter(
                                        ([value]) =>
                                            canPublish ||
                                            ![
                                                'scheduled',
                                                'published',
                                            ].includes(value),
                                    )
                                    .map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    </div>
                </section>
                <section className="cms-form-section">
                    <h2>Capa</h2>
                    {event?.cover_url && (
                        <img
                            className="cms-cover-preview"
                            src={event.cover_url}
                            alt={event.cover_alt ?? ''}
                        />
                    )}
                    <div className="cms-field">
                        <label>
                            Imagem
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                    form.setData(
                                        'cover',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        <FieldError message={form.errors.cover} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Descrição da imagem
                            <input
                                value={form.data.cover_alt}
                                onChange={(e) =>
                                    form.setData('cover_alt', e.target.value)
                                }
                            />
                        </label>
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                cancelHref="/admin/eventos"
                submitLabel={event ? 'Salvar evento' : 'Criar evento'}
            />
        </form>
    );
}
