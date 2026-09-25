import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import type { ContentStatus, TransparencyDocument } from '@/types/cms';
import { useCan } from './use-can';
import {
    focusFirstFormError,
    normalizePublicationIntent,
    slugifyTitle,
} from '@/lib/cms-form';
type DocumentDetail = TransparencyDocument & {
    slug: string;
    description?: string | null;
};
export function DocumentForm({ document }: { document?: DocumentDetail }) {
    const canPublish = useCan('content.publish');
    const formId = document ? `document-${document.id}` : 'create-document';
    const slugWasEdited = useRef(Boolean(document));
    const publicationIntent = useRef<ContentStatus | null>(null);
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
        if (document)
            form.post(`/admin/documentos/${document.id}`, {
                ...options,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post('/admin/documentos', options);
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
                    title: 'Título',
                    slug: 'Endereço amigável',
                    description: 'Descrição',
                    category: 'Categoria',
                    status: 'Status',
                    published_at: 'Data de publicação',
                    file: 'Arquivo PDF',
                }}
                fieldIds={{
                    title: 'document-title',
                    slug: 'document-slug',
                    description: 'document-description',
                    category: 'document-category',
                    status: 'document-status',
                    published_at: 'document-published-at',
                    file: 'document-file',
                }}
            />
            <section className="cms-form-section">
                <h2>Documento público</h2>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label htmlFor="document-title">Título</label>
                        <input
                            id="document-title"
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
                        <label htmlFor="document-category">Categoria</label>
                        <input
                            id="document-category"
                            list="document-categories"
                            placeholder="Ex.: Relatórios"
                            value={form.data.category}
                            onChange={(e) =>
                                form.setData('category', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.category)}
                        />
                        <datalist id="document-categories">
                            <option value="Relatórios" />
                            <option value="Políticas" />
                            <option value="Prestação de contas" />
                            <option value="Estatuto" />
                        </datalist>
                        <FieldError message={form.errors.category} />
                    </div>
                </div>
                <div className="cms-field">
                    <label htmlFor="document-slug">Endereço amigável</label>
                    <input
                        id="document-slug"
                        value={form.data.slug}
                        onChange={(event) => {
                            slugWasEdited.current = true;
                            form.setData('slug', event.target.value);
                        }}
                        aria-invalid={Boolean(form.errors.slug)}
                    />
                    <small>
                        Gerado pelo título; ajuste apenas se necessário.
                    </small>
                    <FieldError message={form.errors.slug} />
                </div>
                <div className="cms-field">
                    <label htmlFor="document-description">Descrição</label>
                    <textarea
                        id="document-description"
                        rows={5}
                        value={form.data.description}
                        onChange={(e) =>
                            form.setData('description', e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.description)}
                    />
                    <FieldError message={form.errors.description} />
                </div>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label htmlFor="document-file">Arquivo PDF</label>
                        <input
                            id="document-file"
                            type="file"
                            accept="application/pdf"
                            required={!document}
                            onChange={(e) =>
                                form.setData(
                                    'file',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                            aria-invalid={Boolean(form.errors.file)}
                        />
                        <small>Somente PDF, até 15 MB.</small>
                        <FieldError message={form.errors.file} />
                    </div>
                    <div className="cms-field">
                        <div
                            id="document-status"
                            className="cms-publication-state"
                            tabIndex={-1}
                        >
                            <span>Status atual</span>
                            <StatusBadge status={form.data.status} />
                            <small>
                                O botão usado ao salvar define o próximo status.
                            </small>
                        </div>
                        <FieldError message={form.errors.status} />
                        <label htmlFor="document-published-at">
                            Data e hora para agendar
                        </label>
                        <input
                            id="document-published-at"
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
                </div>
            </section>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                isNew={!document}
                cancelHref="/admin/documentos"
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
