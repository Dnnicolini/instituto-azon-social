import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError, FormActions } from './cms-ui';
import type { ContentStatus, Project } from '@/types/cms';
import { statusLabels } from '@/types/cms';
import { useCan } from './use-can';

export function ProjectForm({ project }: { project?: Project }) {
    const canPublish = useCan('content.publish');
    const form = useForm<{
        title: string;
        slug: string;
        summary: string;
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
        body: project?.body ?? '',
        status: project?.status ?? 'draft',
        published_at: project?.published_at?.slice(0, 16) ?? '',
        sort_order: project?.sort_order ?? 0,
        cover_alt: project?.cover_alt ?? '',
        cover: null,
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        if (project)
            form.post(`/admin/projetos/${project.id}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/projetos', { forceFormData: true });
    }
    return (
        <form className="cms-editor" onSubmit={submit} noValidate>
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Sobre o projeto</h2>
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
                                maxLength={1000}
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
                                rows={14}
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.body} />
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
                    <div className="cms-field">
                        <label>
                            Ordem
                            <input
                                type="number"
                                min="0"
                                value={form.data.sort_order}
                                onChange={(e) =>
                                    form.setData(
                                        'sort_order',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </label>
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
                        <FieldError message={form.errors.cover_alt} />
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                cancelHref="/admin/projetos"
                submitLabel={project ? 'Salvar projeto' : 'Criar projeto'}
            />
        </form>
    );
}
