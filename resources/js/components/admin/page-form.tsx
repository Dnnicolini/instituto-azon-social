import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError, FormActions } from './cms-ui';
import type { ContentStatus, SitePage } from '@/types/cms';
import { statusLabels } from '@/types/cms';
import { useCan } from './use-can';
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
export function PageForm({ page }: { page?: SitePage }) {
    const canPublish = useCan('content.publish');
    const form = useForm<{
        title: string;
        slug: string;
        body: string;
        sections: Section[];
        status: ContentStatus;
        published_at: string;
        seo_title: string;
        seo_description: string;
    }>({
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        body: page?.body ?? '',
        sections: page?.sections ?? [],
        status: page?.status ?? 'draft',
        published_at: page?.published_at?.slice(0, 16) ?? '',
        seo_title: page?.seo_title ?? '',
        seo_description: page?.seo_description ?? '',
    });
    function setSection(index: number, key: keyof Section, value: string) {
        form.setData(
            'sections',
            form.data.sections.map((section, i) =>
                i === index ? { ...section, [key]: value } : section,
            ),
        );
    }
    function submit(e: FormEvent) {
        e.preventDefault();
        if (page) form.put(`/admin/paginas/${page.id}`);
        else form.post('/admin/paginas');
    }
    return (
        <form className="cms-editor" onSubmit={submit} noValidate>
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Página</h2>
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
                    </div>
                    <div className="cms-field">
                        <label>
                            Texto complementar
                            <textarea
                                rows={8}
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
                    <h2>SEO</h2>
                    <div className="cms-field">
                        <label>
                            Título para busca
                            <input
                                maxLength={70}
                                value={form.data.seo_title}
                                onChange={(e) =>
                                    form.setData('seo_title', e.target.value)
                                }
                            />
                        </label>
                        <small>{form.data.seo_title.length}/70</small>
                    </div>
                    <div className="cms-field">
                        <label>
                            Descrição para busca
                            <textarea
                                rows={4}
                                maxLength={170}
                                value={form.data.seo_description}
                                onChange={(e) =>
                                    form.setData(
                                        'seo_description',
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <small>{form.data.seo_description.length}/170</small>
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                cancelHref="/admin/paginas"
                submitLabel={page ? 'Salvar página' : 'Criar página'}
            />
        </form>
    );
}
