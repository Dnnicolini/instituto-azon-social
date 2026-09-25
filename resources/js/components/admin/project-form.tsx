import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import type { ContentStatus, Project } from '@/types/cms';
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
                    cover: 'Imagem',
                    cover_alt: 'Descrição da imagem',
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
                <section className="cms-form-section">
                    <h2>Capa</h2>
                    {project?.cover_url && (
                        <img
                            className="cms-cover-preview"
                            src={project.cover_url}
                            alt={project.cover_alt ?? ''}
                        />
                    )}
                    <div className="cms-field">
                        <label>
                            Imagem
                            <input
                                id="cover"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                    form.setData(
                                        'cover',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                aria-invalid={Boolean(form.errors.cover)}
                            />
                        </label>
                        <FieldError message={form.errors.cover} />
                    </div>
                    <div className="cms-field">
                        <label>
                            Descrição da imagem
                            <input
                                id="cover_alt"
                                value={form.data.cover_alt}
                                onChange={(e) =>
                                    form.setData('cover_alt', e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.cover_alt)}
                            />
                        </label>
                        <FieldError message={form.errors.cover_alt} />
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
