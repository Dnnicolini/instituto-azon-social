import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import type { ContentStatus, SitePage } from '@/types/cms';
import type { SelectOption } from '@/types/cms';
import { useCan } from './use-can';
import {
    focusFirstFormError,
    normalizePublicationIntent,
    slugifyTitle,
} from '@/lib/cms-form';
type Section = NonNullable<SitePage['sections']>[number];
const emptySection: Section = {
    type: 'text',
    title: '',
    eyebrow: '',
    emphasis: '',
    text: '',
    cta_label: '',
    cta_url: '',
};
type PageFormProps = {
    page?: SitePage;
    instagramAccounts?: SelectOption[];
    isChannel?: boolean;
    returnTo?: 'pages' | 'channels';
};

export function PageForm({
    page,
    instagramAccounts = [],
    isChannel = false,
    returnTo = 'pages',
}: PageFormProps) {
    const canPublish = useCan('content.publish');
    const formId = page ? `page-${page.id}` : 'create-page';
    const slugWasEdited = useRef(Boolean(page));
    const publicationIntent = useRef<ContentStatus | null>(null);
    const form = useForm<{
        title: string;
        slug: string;
        social_integration_id: string;
        body: string;
        sections: Section[];
        status: ContentStatus;
        published_at: string;
        return_to: 'pages' | 'channels';
    }>({
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        social_integration_id: page?.social_integration_id
            ? String(page.social_integration_id)
            : '',
        body: page?.body ?? '',
        sections: page?.sections ?? [],
        status: page?.status ?? 'draft',
        published_at: page?.published_at?.slice(0, 16) ?? '',
        return_to: returnTo,
    });
    function setSection(index: number, key: keyof Section, value: string) {
        form.setData(
            'sections',
            form.data.sections.map((section, i) =>
                i === index ? { ...section, [key]: value } : section,
            ),
        );
    }
    function moveSection(index: number, direction: -1 | 1) {
        const destination = index + direction;
        if (destination < 0 || destination >= form.data.sections.length) return;
        const sections = [...form.data.sections];
        [sections[index], sections[destination]] = [
            sections[destination],
            sections[index],
        ];
        form.setData('sections', sections);
    }
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
        const options = { onError: () => focusFirstFormError(formId) };
        if (page) form.put(`/admin/paginas/${page.id}`, options);
        else form.post('/admin/paginas', options);
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
                    social_integration_id: 'Perfil do Instagram',
                    body: 'Texto complementar',
                    sections: 'Seções estruturadas',
                    status: 'Status',
                    published_at: 'Data de publicação',
                }}
                fieldIds={{
                    title: 'page-title',
                    slug: 'page-slug',
                    social_integration_id: 'page-instagram-account',
                    body: 'page-body',
                    sections: 'page-sections',
                    status: 'page-status',
                    published_at: 'page-published-at',
                }}
            />
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Página</h2>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label htmlFor="page-title">Título</label>
                            <input
                                id="page-title"
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
                            <label htmlFor="page-slug">Endereço amigável</label>
                            <input
                                id="page-slug"
                                value={form.data.slug}
                                onChange={(event) => {
                                    slugWasEdited.current = true;
                                    form.setData('slug', event.target.value);
                                }}
                                readOnly={isChannel}
                                aria-invalid={Boolean(form.errors.slug)}
                            />
                            <small>
                                {isChannel
                                    ? 'Endereço estrutural protegido para manter os links do canal.'
                                    : 'Gerado pelo título; ajuste apenas se necessário.'}
                            </small>
                            <FieldError message={form.errors.slug} />
                        </div>
                    </div>
                    {isChannel && (
                        <div className="cms-field">
                            <label htmlFor="page-instagram-account">
                                Perfil do Instagram desta página
                            </label>
                            <select
                                id="page-instagram-account"
                                value={form.data.social_integration_id}
                                onChange={(event) =>
                                    form.setData(
                                        'social_integration_id',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    form.errors.social_integration_id,
                                )}
                            >
                                <option value="">
                                    Nenhum perfil vinculado
                                </option>
                                {instagramAccounts.map((account) => (
                                    <option
                                        key={account.value}
                                        value={account.value}
                                    >
                                        {account.label}
                                    </option>
                                ))}
                            </select>
                            <small>
                                Somente as publicações aprovadas deste perfil
                                aparecerão nesta página.
                            </small>
                            <FieldError
                                message={form.errors.social_integration_id}
                            />
                        </div>
                    )}
                    <div className="cms-field">
                        <label htmlFor="page-body">Texto complementar</label>
                        <textarea
                            id="page-body"
                            rows={8}
                            value={form.data.body}
                            onChange={(e) =>
                                form.setData('body', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.body)}
                        />
                        <FieldError message={form.errors.body} />
                    </div>
                </section>
                <section id="page-sections" className="cms-form-section">
                    <div className="cms-section-heading">
                        <div>
                            <h2>Seções estruturadas</h2>
                            <p>Edite conteúdo sem inserir HTML ou código.</p>
                        </div>
                        <button
                            type="button"
                            className="cms-button secondary"
                            onClick={() =>
                                form.setData('sections', [
                                    ...form.data.sections,
                                    { ...emptySection },
                                ])
                            }
                        >
                            ＋ Adicionar seção
                        </button>
                    </div>
                    {form.data.sections.length ? (
                        form.data.sections.map((section, index) => (
                            <fieldset
                                className="cms-section-editor"
                                key={`${section.type}-${index}`}
                            >
                                <legend>Seção {index + 1}</legend>
                                <div className="cms-section-editor-actions">
                                    <button
                                        type="button"
                                        className="cms-text-action"
                                        disabled={index === 0}
                                        onClick={() => moveSection(index, -1)}
                                        aria-label={`Mover seção ${index + 1} para cima`}
                                    >
                                        ↑ Subir
                                    </button>
                                    <button
                                        type="button"
                                        className="cms-text-action"
                                        disabled={
                                            index ===
                                            form.data.sections.length - 1
                                        }
                                        onClick={() => moveSection(index, 1)}
                                        aria-label={`Mover seção ${index + 1} para baixo`}
                                    >
                                        ↓ Descer
                                    </button>
                                    <button
                                        type="button"
                                        className="cms-text-action danger"
                                        onClick={() =>
                                            form.setData(
                                                'sections',
                                                form.data.sections.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        Remover
                                    </button>
                                </div>
                                <div className="cms-form-grid two">
                                    <div className="cms-field">
                                        <label>
                                            Tipo
                                            <select
                                                value={section.type}
                                                onChange={(e) =>
                                                    setSection(
                                                        index,
                                                        'type',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="hero">
                                                    Abertura
                                                </option>
                                                <option value="intro">
                                                    Introdução
                                                </option>
                                                <option value="history">
                                                    História
                                                </option>
                                                <option value="transparency">
                                                    Transparência
                                                </option>
                                                <option value="participate">
                                                    Participação
                                                </option>
                                                <option value="text">
                                                    Texto
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="cms-field">
                                        <label>
                                            Chamada curta
                                            <input
                                                value={section.eyebrow ?? ''}
                                                onChange={(e) =>
                                                    setSection(
                                                        index,
                                                        'eyebrow',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="cms-field">
                                    <label>
                                        Título
                                        <input
                                            value={section.title}
                                            onChange={(e) =>
                                                setSection(
                                                    index,
                                                    'title',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="cms-field">
                                    <label>
                                        Destaque do título
                                        <input
                                            value={section.emphasis ?? ''}
                                            onChange={(e) =>
                                                setSection(
                                                    index,
                                                    'emphasis',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="cms-field">
                                    <label>
                                        Texto
                                        <textarea
                                            rows={5}
                                            value={section.text ?? ''}
                                            onChange={(e) =>
                                                setSection(
                                                    index,
                                                    'text',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="cms-form-grid two">
                                    <div className="cms-field">
                                        <label>
                                            Texto do botão
                                            <input
                                                value={section.cta_label ?? ''}
                                                onChange={(e) =>
                                                    setSection(
                                                        index,
                                                        'cta_label',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="cms-field">
                                        <label>
                                            Destino do botão
                                            <input
                                                placeholder="#projetos ou https://…"
                                                value={section.cta_url ?? ''}
                                                onChange={(e) =>
                                                    setSection(
                                                        index,
                                                        'cta_url',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>
                            </fieldset>
                        ))
                    ) : (
                        <div className="cms-inline-empty">
                            Esta página ainda não possui seções. Adicione apenas
                            as que ajudam o visitante a entender e agir.
                        </div>
                    )}
                    <FieldError message={form.errors.sections} />
                </section>
            </div>
            <aside className="cms-editor-side">
                <section className="cms-form-section">
                    <h2>Publicação</h2>
                    <div
                        id="page-status"
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
                        <label htmlFor="page-published-at">
                            Data e hora para agendar
                        </label>
                        <input
                            id="page-published-at"
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
                isNew={!page}
                cancelHref={
                    returnTo === 'channels' ? '/admin/canais' : '/admin/paginas'
                }
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
