import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import { FieldError, FormActions, StatusBadge } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { ImageGalleryFields } from './image-gallery-fields';
import { ProjectLinkField } from './project-link-field';
import type {
    ContentStatus,
    ContentType,
    MediaProvider,
    Post,
    SelectOption,
} from '@/types/cms';
import { typeLabels } from '@/types/cms';
import { useCan } from './use-can';
import {
    postIndexHref,
    type PostSection,
    typesForSection,
} from '@/lib/admin-post-section';
import {
    focusFirstFormError,
    normalizePublicationIntent,
    slugifyTitle,
} from '@/lib/cms-form';

export function PostForm({
    post,
    section,
    initialType = 'article',
    projectOptions = [],
}: {
    post?: Post;
    section: PostSection;
    initialType?: ContentType;
    projectOptions?: SelectOption[];
}) {
    const canPublish = useCan('content.publish');
    const formId = post ? `post-${post.id}` : 'create-post';
    const slugWasEdited = useRef(Boolean(post));
    const publicationIntent = useRef<ContentStatus | null>(null);
    const form = useForm<{
        title: string;
        slug: string;
        type: ContentType;
        status: ContentStatus;
        excerpt: string;
        body: string;
        source_mode: '' | 'upload' | 'link';
        provider: '' | MediaProvider;
        external_url: string;
        duration_seconds: string;
        is_featured: boolean;
        sort_order: string;
        published_at: string;
        cover_alt: string;
        cover: File | null;
        video: File | null;
        gallery: File[];
        remove_gallery_ids: number[];
        project_ids: number[];
    }>({
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        type: post?.type ?? initialType,
        status: post?.status ?? 'draft',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        source_mode:
            post?.source_mode ??
            (post?.external_url
                ? 'link'
                : post?.video_url
                  ? 'upload'
                  : (post?.type ?? initialType) === 'social'
                    ? 'link'
                    : ''),
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
        cover_alt: post?.cover_alt ?? '',
        cover: null,
        video: null,
        gallery: [],
        remove_gallery_ids: [],
        project_ids: post?.project_ids ?? [],
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
    const sectionQuery = section === 'article' ? '' : `?section=${section}`;
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
        if (post)
            form.post(`/admin/posts/${post.id}${sectionQuery}`, {
                ...options,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
            });
        else form.post(`/admin/posts${sectionQuery}`, options);
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
                    excerpt: 'Resumo',
                    body: 'Texto ou transcrição',
                    type: 'Formato',
                    status: 'Status',
                    source_mode: 'Origem da mídia',
                    published_at: 'Data de publicação',
                    provider: 'Plataforma',
                    external_url: 'URL externa',
                    duration_seconds: 'Duração',
                    is_featured: 'Destaque',
                    sort_order: 'Ordem entre destaques',
                    cover: 'Imagem de capa',
                    cover_alt: 'Descrição da imagem',
                    video: 'Arquivo de vídeo',
                }}
                fieldIds={{
                    title: 'post-title',
                    slug: 'post-slug',
                    excerpt: 'post-excerpt',
                    body: 'post-body',
                    type: 'post-type',
                    status: 'post-status',
                    source_mode: 'source-mode',
                    published_at: 'published-at',
                    duration_seconds: 'duration',
                    external_url: 'external-url',
                    is_featured: 'is_featured',
                    sort_order: 'social-sort-order',
                    cover_alt: 'cover-alt',
                    video: 'video-file',
                }}
            />
            <div className="cms-editor-main">
                <section className="cms-form-section">
                    <h2>Conteúdo</h2>
                    <div className="cms-field">
                        <label htmlFor="post-title">Título</label>
                        <input
                            id="post-title"
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
                                onChange={(event) => {
                                    slugWasEdited.current = true;
                                    form.setData('slug', event.target.value);
                                }}
                                aria-invalid={Boolean(form.errors.slug)}
                            />
                        </div>
                        <small>
                            Gerado pelo título. Você pode personalizar usando
                            letras minúsculas, números e hífens.
                        </small>
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
                            aria-invalid={Boolean(form.errors.excerpt)}
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
                            aria-invalid={Boolean(form.errors.body)}
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
                        <h2>{isSocial ? 'Rede social' : 'Mídia'}</h2>
                        <p className="cms-form-section-intro">
                            {isSocial
                                ? 'Escolha a rede e cole o link direto da publicação.'
                                : 'Defina primeiro se a mídia será enviada ao sistema ou vinculada por uma URL externa.'}
                        </p>
                        {isMedia && (
                            <fieldset
                                id="source-mode"
                                className="cms-source-choice"
                                aria-invalid={Boolean(form.errors.source_mode)}
                            >
                                <legend>
                                    Como você quer adicionar a mídia?
                                </legend>
                                <label
                                    className={
                                        form.data.source_mode === 'upload'
                                            ? 'selected'
                                            : undefined
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="source_mode"
                                        value="upload"
                                        checked={
                                            form.data.source_mode === 'upload'
                                        }
                                        onChange={() =>
                                            form.setData({
                                                ...form.data,
                                                source_mode: 'upload',
                                                provider: '',
                                                external_url: '',
                                            })
                                        }
                                    />
                                    <span>
                                        <strong>Enviar arquivo</strong>
                                        <small>
                                            {form.data.type === 'podcast'
                                                ? 'Áudio MP3, M4A, WAV ou OGG.'
                                                : 'Vídeo MP4, MOV ou WebM.'}
                                        </small>
                                    </span>
                                </label>
                                <label
                                    className={
                                        form.data.source_mode === 'link'
                                            ? 'selected'
                                            : undefined
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="source_mode"
                                        value="link"
                                        checked={
                                            form.data.source_mode === 'link'
                                        }
                                        onChange={() =>
                                            form.setData({
                                                ...form.data,
                                                source_mode: 'link',
                                                video: null,
                                            })
                                        }
                                    />
                                    <span>
                                        <strong>Usar um link</strong>
                                        <small>
                                            YouTube, Facebook, Instagram, Vimeo,
                                            Spotify ou outra plataforma.
                                        </small>
                                    </span>
                                </label>
                            </fieldset>
                        )}
                        <FieldError message={form.errors.source_mode} />
                        {isMedia && form.data.source_mode === 'upload' && (
                            <div className="cms-field">
                                <label htmlFor="video-file">
                                    {form.data.type === 'podcast'
                                        ? 'Arquivo de áudio'
                                        : 'Arquivo de vídeo'}
                                </label>
                                {post?.video_url && (
                                    <small>
                                        Arquivo atual:{' '}
                                        {post.video_name ?? 'mídia enviada'}
                                    </small>
                                )}
                                <input
                                    id="video-file"
                                    type="file"
                                    accept={
                                        form.data.type === 'podcast'
                                            ? 'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg'
                                            : 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm'
                                    }
                                    onChange={(e) =>
                                        form.setData(
                                            'video',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    aria-invalid={Boolean(form.errors.video)}
                                />
                                <small>
                                    Até 200 MB. Um novo envio substitui o
                                    arquivo vinculado a este conteúdo.
                                </small>
                                <FieldError message={form.errors.video} />
                            </div>
                        )}
                        <div className="cms-form-grid two">
                            {(isSocial || form.data.source_mode === 'link') && (
                                <div className="cms-field">
                                    <label htmlFor="provider">Plataforma</label>
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
                                        aria-invalid={Boolean(
                                            form.errors.provider,
                                        )}
                                    >
                                        <option value="">Selecione</option>
                                        {isSocial ? (
                                            <>
                                                <option value="instagram">
                                                    Instagram
                                                </option>
                                                <option value="facebook">
                                                    Facebook
                                                </option>
                                                <option value="tiktok">
                                                    TikTok
                                                </option>
                                                <option value="linkedin">
                                                    LinkedIn
                                                </option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="youtube">
                                                    YouTube
                                                </option>
                                                <option value="instagram">
                                                    Instagram
                                                </option>
                                                <option value="facebook">
                                                    Facebook
                                                </option>
                                                <option value="vimeo">
                                                    Vimeo
                                                </option>
                                                <option value="spotify">
                                                    Spotify
                                                </option>
                                                <option value="anchor">
                                                    Spotify for Creators
                                                </option>
                                                <option value="other">
                                                    Outra plataforma
                                                </option>
                                            </>
                                        )}
                                    </select>
                                    <FieldError
                                        message={form.errors.provider}
                                    />
                                </div>
                            )}
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
                                        aria-invalid={Boolean(
                                            form.errors.duration_seconds,
                                        )}
                                    />
                                    <FieldError
                                        message={form.errors.duration_seconds}
                                    />
                                </div>
                            )}
                        </div>
                        {(isSocial || form.data.source_mode === 'link') && (
                            <div className="cms-field">
                                <label htmlFor="external-url">
                                    Link direto da publicação ou mídia
                                </label>
                                <input
                                    id="external-url"
                                    type="url"
                                    placeholder="https://…"
                                    value={form.data.external_url}
                                    onChange={(e) =>
                                        form.setData(
                                            'external_url',
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.external_url,
                                    )}
                                />
                                <small>
                                    Cole a URL completa da plataforma
                                    selecionada, iniciada por https://.
                                </small>
                                <FieldError
                                    message={form.errors.external_url}
                                />
                            </div>
                        )}
                    </section>
                )}
                <ImageGalleryFields
                    images={post?.gallery_images}
                    files={form.data.gallery}
                    removedIds={form.data.remove_gallery_ids}
                    error={form.errors.gallery}
                    onFilesChange={(files) => form.setData('gallery', files)}
                    onRemovedIdsChange={(ids) =>
                        form.setData('remove_gallery_ids', ids)
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
                    <div className="cms-field">
                        <label htmlFor="post-type">Formato</label>
                        <select
                            id="post-type"
                            value={form.data.type}
                            onChange={(e) => {
                                const type = e.target.value as ContentType;
                                const changingSection = type !== form.data.type;
                                if (type === 'social') {
                                    form.setData({
                                        ...form.data,
                                        type,
                                        source_mode: 'link',
                                        provider: 'instagram',
                                        external_url: changingSection
                                            ? ''
                                            : form.data.external_url,
                                        video: null,
                                        duration_seconds: '',
                                    });
                                } else if (
                                    ['vlog', 'video', 'podcast'].includes(type)
                                ) {
                                    form.setData({
                                        ...form.data,
                                        type,
                                        source_mode: changingSection
                                            ? ''
                                            : form.data.source_mode,
                                        provider: changingSection
                                            ? ''
                                            : form.data.provider,
                                        external_url: changingSection
                                            ? ''
                                            : form.data.external_url,
                                        video: changingSection
                                            ? null
                                            : form.data.video,
                                        is_featured: false,
                                        sort_order: '0',
                                    });
                                } else {
                                    form.setData({
                                        ...form.data,
                                        type,
                                        source_mode: '',
                                        provider: '',
                                        external_url: '',
                                        video: null,
                                        duration_seconds: '',
                                        is_featured: false,
                                        sort_order: '0',
                                    });
                                }
                            }}
                            aria-invalid={Boolean(form.errors.type)}
                        >
                            {availableTypes.map((value) => (
                                <option key={value} value={value}>
                                    {typeLabels[value]}
                                </option>
                            ))}
                        </select>
                        <FieldError message={form.errors.type} />
                    </div>
                    <div
                        id="post-status"
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
                        <label htmlFor="published-at">
                            Data e hora para agendar
                        </label>
                        <input
                            id="published-at"
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
                    {isSocial && (
                        <div className="cms-social-options">
                            <label className="cms-check-row">
                                <input
                                    id="is_featured"
                                    type="checkbox"
                                    checked={form.data.is_featured}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_featured',
                                            e.target.checked,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.is_featured,
                                    )}
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
                                    aria-invalid={Boolean(
                                        form.errors.sort_order,
                                    )}
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
                            aria-invalid={Boolean(form.errors.cover)}
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
                            aria-invalid={Boolean(form.errors.cover_alt)}
                        />
                        <FieldError message={form.errors.cover_alt} />
                    </div>
                </section>
            </aside>
            <FormActions
                processing={form.processing}
                isDirty={form.isDirty}
                isNew={!post}
                cancelHref={postIndexHref(section)}
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
