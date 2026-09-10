import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError, FormActions } from './cms-ui';
import type { ContentStatus, TransparencyDocument } from '@/types/cms';
import { statusLabels } from '@/types/cms';
import { useCan } from './use-can';
type DocumentDetail = TransparencyDocument & {
    slug: string;
    description?: string | null;
};
export function DocumentForm({ document }: { document?: DocumentDetail }) {
    const canPublish = useCan('content.publish');
    const form = useForm<{
        title: string;
        slug: string;
        description: string;
        category: string;
        status: ContentStatus;
        published_at: string;
        file: File | null;
    }>({
        title: document?.title ?? '',
        slug: document?.slug ?? '',
        description: document?.description ?? '',
        category: document?.category ?? '',
        status: document?.status ?? 'draft',
        published_at: document?.published_at?.slice(0, 16) ?? '',
        file: null,
    });
    function submit(e: FormEvent) {
        e.preventDefault();
        if (document)
            form.post(`/admin/documentos/${document.id}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/documentos', { forceFormData: true });
    }
    return (
        <form className="cms-form-single" onSubmit={submit} noValidate>
            <section className="cms-form-section">
                <h2>Documento público</h2>
                <div className="cms-form-grid two">
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
                            Categoria
                            <input
                                value={form.data.category}
                                onChange={(e) =>
                                    form.setData('category', e.target.value)
                                }
                            />
                        </label>
                        <FieldError message={form.errors.category} />
                    </div>
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
                        Descrição
                        <textarea
                            rows={5}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                    </label>
                    <FieldError message={form.errors.description} />
                </div>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label>
                            Arquivo PDF
                            <input
                                type="file"
                                accept="application/pdf"
                                required={!document}
                                onChange={(e) =>
                                    form.setData(
                                        'file',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        <small>Somente PDF, até 15 MB.</small>
                        <FieldError message={form.errors.file} />
                    </div>
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
                        {(form.data.status === 'scheduled' ||
                            form.data.status === 'published') && (
                            <>
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
                                <FieldError
                                    message={form.errors.published_at}
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                cancelHref="/admin/documentos"
                submitLabel={document ? 'Salvar documento' : 'Enviar documento'}
            />
        </form>
    );
}
