import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError, FormActions } from './cms-ui';
import type { ContentStatus, ContentType, Post } from '@/types/cms';
import { statusLabels, typeLabels } from '@/types/cms';
import { useCan } from './use-can';
import {
    postIndexHref,
    type PostSection,
    typesForSection,
} from '@/lib/admin-post-section';

export function PostForm({
    post,
    section,
    initialType = 'article',
}: {
    post?: Post;
    section: PostSection;
    initialType?: ContentType;
}) {
    const canPublish = useCan('content.publish');
    const form = useForm<{
        title: string;
        slug: string;
        type: ContentType;
        status: ContentStatus;
        excerpt: string;
        body: string;
        provider:
            | ''
            | 'youtube'
            | 'vimeo'
            | 'spotify'
            | 'anchor'
            | 'instagram'
            | 'other';
        external_url: string;
        duration_seconds: string;
        is_featured: boolean;
        sort_order: string;
        published_at: string;
        seo_title: string;
        seo_description: string;
        cover_alt: string;
        cover: File | null;
        video: File | null;
    }>({
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        type: post?.type ?? initialType,
        status: post?.status ?? 'draft',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        provider:
            post?.provider ??
            ((post?.type ?? initialType) === 'social' ? 'instagram' : ''),
        external_url: post?.external_url ?? '',
        duration_seconds: post?.duration_seconds
            ? String(post.duration_seconds)
            : '',
        is_featured: post?.is_featured ?? false,
        sort_order: String(post?.sort_order ?? 0),
        published_at: post?.published_at?.slice(0, 16) ?? '',
        seo_title: post?.seo_title ?? '',
        seo_description: post?.seo_description ?? '',
        cover_alt: post?.cover_alt ?? '',
        cover: null,
        video: null,
    });
    const isSocial = form.data.type === 'social';
    const isMedia = ['vlog', 'video', 'podcast'].includes(form.data.type);
    const slugPrefix =
        form.data.type === 'article'
            ? '/noticias/'
            : isSocial
              ? 'social/'
              : '/midia/';
    const availableTypes = typesForSection(section);
    const sectionQuery = section === 'all' ? '' : `?section=${section}`;
    function submit(event: FormEvent) {
        event.preventDefault();
        if (post)
            form.post(`/admin/posts/${post.id}${sectionQuery}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post(`/admin/posts${sectionQuery}`, { forceFormData: true });
    }
    return (
        <form className="cms-editor" onSubmit={submit} noValidate>
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Conteúdo</h2>
                    <div className="cms-field">
                        <label htmlFor="post-title">Título</label>
                        <input
                            id="post-title"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.title)}
                            autoFocus
                        />
                        <FieldError message={form.errors.title} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="post-slug">Endereço amigável</label>
                        <div className="cms-input-prefix">
                            <span>{slugPrefix}</span>
                            <input
                                id="post-slug"
                                value={form.data.slug}
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                        </div>
                        <small>Use letras minúsculas, números e hífens.</small>
                        <FieldError message={form.errors.slug} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="post-excerpt">Resumo</label>
                        <textarea
                            id="post-excerpt"
                            rows={3}
                            maxLength={320}
                            value={form.data.excerpt}
                            onChange={(e) =>
                                form.setData('excerpt', e.target.value)
                            }
                        />
                        <small>{form.data.excerpt.length}/320 caracteres</small>
                        <FieldError message={form.errors.excerpt} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="post-body">Texto ou transcrição</label>
                        <textarea
                            id="post-body"
                            rows={16}
                            value={form.data.body}
                            onChange={(e) =>
                                form.setData('body', e.target.value)
                            }
                        />
                        <small>
                            Texto simples. Parágrafos e quebras de linha serão
                            preservados com segurança.
                        </small>
                        <FieldError message={form.errors.body} />
                    </div>
                </section>
                {(isMedia || isSocial) && (
                    <section className="cms-form-section">
                        <h2>{isSocial ? 'Instagram' : 'Reprodução'}</h2>
                        {['vlog', 'video'].includes(form.data.type) && (
                            <div className="cms-field">
                                <label htmlFor="video-file">
                                    Arquivo de vídeo
                                </label>
                                {post?.video_url && (
                                    <small>
                                        Arquivo atual:{' '}
                                        {post.video_name ?? 'vídeo enviado'}
                                    </small>
                                )}
                                <input
                                    id="video-file"
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                                    onChange={(e) =>
                                        form.setData(
                                            'video',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <small>
                                    MP4, MOV ou WebM, com até 200 MB. Um novo
                                    envio substitui o vídeo vinculado a este
                                    conteúdo.
                                </small>
                                <FieldError message={form.errors.video} />
                            </div>
                        )}
                        {['vlog', 'video'].includes(form.data.type) && (
                            <p className="cms-form-separator">
                                ou informe uma publicação externa
                            </p>
                        )}
                        <div className="cms-form-grid two">
                            <div className="cms-field">
                                <label htmlFor="provider">Plataforma</label>
                                {isSocial ? (
                                    <input
                                        id="provider"
                                        value="Instagram"
                                        readOnly
                                    />
                                ) : (
                                    <select
                                        id="provider"
                                        value={form.data.provider}
                                        onChange={(e) =>
                                            form.setData(
                                                'provider',
                                                e.target
                                                    .value as typeof form.data.provider,
                                            )
                                        }
                                    >
                                        <option value="">Selecione</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="vimeo">Vimeo</option>
                                        <option value="spotify">Spotify</option>
                                        <option value="anchor">
                                            Spotify for Creators
                                        </option>
                                        <option value="other">
                                            Outra plataforma
                                        </option>
                                    </select>
                                )}
                                <FieldError message={form.errors.provider} />
                            </div>
                            {isMedia && (
                                <div className="cms-field">
                                    <label htmlFor="duration">
                                        Duração em segundos
                                    </label>
                                    <input
                                        id="duration"
                                        inputMode="numeric"
                                        type="number"
                                        min="1"
                                        placeholder="Ex.: 1440"
                                        value={form.data.duration_seconds}
                                        onChange={(e) =>
                                            form.setData(
                                                'duration_seconds',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <FieldError
                                        message={form.errors.duration_seconds}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="cms-field">
                            <label htmlFor="external-url">
                                {isSocial
                                    ? 'Link direto da publicação'
                                    : ['vlog', 'video'].includes(form.data.type)
                                      ? 'URL externa do vídeo (opcional)'
                                      : 'URL do episódio'}
                            </label>
                            <input
                                id="external-url"
                                type="url"
                                placeholder="https://…"
                                value={form.data.external_url}
                                onChange={(e) =>
                                    form.setData('external_url', e.target.value)
                                }
                            />
                            <small>
                                {isSocial
                                    ? 'Use o endereço de um post ou reel público do Instagram.'
                                    : ['vlog', 'video'].includes(form.data.type)
                                      ? 'Opcional quando um arquivo de vídeo for enviado. Aceita YouTube ou Vimeo.'
                                      : 'Use um endereço validado do Spotify para incorporar o episódio.'}
                            </small>
                            <FieldError message={form.errors.external_url} />
                        </div>
                    </section>
                )}
                <section className="cms-form-section">
                    <h2>SEO</h2>
                    <div className="cms-field">
                        <label htmlFor="seo-title">Título para busca</label>
                        <input
                            id="seo-title"
                            maxLength={70}
                            value={form.data.seo_title}
                            onChange={(e) =>
                                form.setData('seo_title', e.target.value)
                            }
                        />
                        <small>
                            {form.data.seo_title.length}/70 caracteres
                        </small>
                        <FieldError message={form.errors.seo_title} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="seo-description">
                            Descrição para busca
                        </label>
                        <textarea
                            id="seo-description"
                            rows={3}
                            maxLength={160}
                            value={form.data.seo_description}
                            onChange={(e) =>
                                form.setData('seo_description', e.target.value)
                            }
                        />
                        <small>
                            {form.data.seo_description.length}/160 caracteres
                        </small>
                        <FieldError message={form.errors.seo_description} />
                    </div>
                </section>
            </div>
            <aside className="cms-editor-side">
                <section className="cms-form-section">
                    <h2>Publicação</h2>
                    <div className="cms-field">
                        <label htmlFor="post-type">Formato</label>
                        <select
                            id="post-type"
                            value={form.data.type}
                            onChange={(e) => {
                                const type = e.target.value as ContentType;
                                form.setData('type', type);
                                if (!['vlog', 'video'].includes(type)) {
                                    form.setData('video', null);
                                }
                                if (type === 'social') {
                                    form.setData('provider', 'instagram');
                                    form.setData('duration_seconds', '');
                                } else if (form.data.type === 'social') {
                                    form.setData('provider', '');
                                    form.setData('is_featured', false);
                                    form.setData('sort_order', '0');
                                }
                            }}
                        >
                            {availableTypes.map((value) => (
                                <option key={value} value={value}>
                                    {typeLabels[value]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="cms-field">
                        <label htmlFor="post-status">Status</label>
                        <select
                            id="post-status"
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
                                        !['scheduled', 'published'].includes(
                                            value,
                                        ),
                                )
                                .map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                        </select>
                    </div>
                    {(form.data.status === 'scheduled' ||
                        form.data.status === 'published') && (
                        <div className="cms-field">
                            <label htmlFor="published-at">
                                {form.data.status === 'scheduled'
                                    ? 'Publicar em'
                                    : 'Publicado em'}
                            </label>
                            <input
                                id="published-at"
                                type="datetime-local"
                                value={form.data.published_at}
                                onChange={(e) =>
                                    form.setData('published_at', e.target.value)
                                }
                            />
                            <FieldError message={form.errors.published_at} />
                        </div>
                    )}
                    {isSocial && (
                        <div className="cms-social-options">
                            <label className="cms-check-row">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_featured}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_featured',
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <strong>Mostrar como destaque</strong>
                                    <small>
                                        Destaques aparecem antes das publicações
                                        mais recentes.
                                    </small>
                                </span>
                            </label>
                            <div className="cms-field">
                                <label htmlFor="social-sort-order">
                                    Ordem entre destaques
                                </label>
                                <input
                                    id="social-sort-order"
                                    type="number"
                                    min="0"
                                    max="9999"
                                    value={form.data.sort_order}
                                    onChange={(e) =>
                                        form.setData(
                                            'sort_order',
                                            e.target.value,
                                        )
                                    }
                                />
                                <small>Use 0 para a posição mais alta.</small>
                                <FieldError message={form.errors.sort_order} />
                            </div>
                        </div>
                    )}
                </section>
                <section className="cms-form-section">
                    <h2>Capa</h2>
                    {post?.cover_url && (
                        <img
                            className="cms-cover-preview"
                            src={post.cover_url}
                            alt={post.cover_alt ?? ''}
                        />
                    )}
                    <div className="cms-field">
                        <label htmlFor="cover">Imagem de capa</label>
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
                        />
                        <small>
                            JPG, PNG ou WebP. Máximo definido pelo servidor.
                        </small>
                        <FieldError message={form.errors.cover} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="cover-alt">Descrição da imagem</label>
                        <textarea
                            id="cover-alt"
                            rows={2}
                            value={form.data.cover_alt}
                            onChange={(e) =>
                                form.setData('cover_alt', e.target.value)
                            }
                        />
                        <FieldError message={form.errors.cover_alt} />
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                cancelHref={postIndexHref(section)}
                submitLabel={post ? 'Salvar alterações' : 'Criar conteúdo'}
            />
        </form>
    );
}
