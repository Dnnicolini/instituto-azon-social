import { useEffect, useId, useRef, useState } from 'react';
import type { InstagramPublication } from '@/types/instagram';

type InstagramPublicationMedia = {
    id: number | string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
};

function safeMediaUrl(value?: string | null): string | null {
    if (!value) return null;
    if (value.startsWith('/')) return value;

    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? value : null;
    } catch {
        return null;
    }
}

export function instagramPublicationExternalUrl(
    value?: string | null,
): string | null {
    if (!value) return null;

    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return null;
        if (!['instagram.com', 'www.instagram.com'].includes(url.hostname))
            return null;
        return url.toString();
    } catch {
        return null;
    }
}

export function instagramPublicationMedia(
    publication: InstagramPublication,
): InstagramPublicationMedia[] {
    const cover = safeMediaUrl(publication.cover_url);
    const items = (publication.items ?? []).flatMap((item, index) => {
        if (!['IMAGE', 'VIDEO', 'REEL'].includes(item.type)) return [];

        const media = safeMediaUrl(item.media_url);
        const thumbnail = safeMediaUrl(item.thumbnail_url);
        const isVideo = ['VIDEO', 'REEL'].includes(item.type);
        const url = media ?? thumbnail;
        if (!url) return [];

        return [
            {
                id: item.id ?? `${publication.id}-${index}`,
                type:
                    isVideo && media ? ('video' as const) : ('image' as const),
                url: index === 0 && !isVideo && cover ? cover : url,
                thumbnailUrl: isVideo
                    ? (thumbnail ?? cover ?? undefined)
                    : undefined,
            },
        ];
    });

    if (
        publication.provider_media_type === 'CAROUSEL_ALBUM' &&
        items.length > 0
    ) {
        return items;
    }

    if (
        ['VIDEO', 'REEL'].includes(publication.provider_media_type ?? '') &&
        items.length > 0
    ) {
        return [items.find((item) => item.type === 'video') ?? items[0]];
    }

    if (cover) {
        return [{ id: `${publication.id}-cover`, type: 'image', url: cover }];
    }

    return items.slice(0, 1);
}

function publicationLabel(publication: InstagramPublication): string {
    const type = publication.provider_media_type?.toUpperCase();
    if (type === 'CAROUSEL_ALBUM') return 'Carrossel';
    if (type === 'VIDEO' || type === 'REEL') return 'Vídeo';
    return 'Imagem';
}

function PublicationPlaceholder({ compact = false }: { compact?: boolean }) {
    return (
        <span
            className={`social-card-placeholder${compact ? ' is-dialog' : ''}`}
            aria-label="Mídia indisponível"
        >
            <img
                src="/azon-social-logo-v2.webp"
                alt=""
                width="721"
                height="721"
                loading="lazy"
            />
        </span>
    );
}

function PublicationCardMedia({
    publication,
    eager = false,
}: {
    publication: InstagramPublication;
    eager?: boolean;
}) {
    const [failed, setFailed] = useState(false);
    const media = instagramPublicationMedia(publication);
    const preview =
        safeMediaUrl(publication.cover_url) ??
        media[0]?.thumbnailUrl ??
        (media[0]?.type === 'image' ? media[0].url : null);
    const caption = publication.title
        ? `Publicação de ${publication.social_account.display_name}: ${publication.title}`
        : `Publicação de ${publication.social_account.display_name}`;

    return (
        <span className="social-card-media">
            {!preview || failed ? (
                <PublicationPlaceholder />
            ) : (
                <img
                    src={preview}
                    alt={caption}
                    loading={eager ? 'eager' : 'lazy'}
                    onError={() => setFailed(true)}
                />
            )}
            <span className="social-featured social-format-badge">
                {publicationLabel(publication)}
                {media.length > 1 ? ` · ${media.length}` : ''}
            </span>
        </span>
    );
}

function PublicationDialogMedia({
    publication,
    media,
}: {
    publication: InstagramPublication;
    media: InstagramPublicationMedia | undefined;
}) {
    const [failed, setFailed] = useState(false);
    const alt = publication.title
        ? `Publicação de ${publication.social_account.display_name}: ${publication.title}`
        : `Publicação de ${publication.social_account.display_name}`;

    if (!media) return <PublicationPlaceholder compact />;

    if (media.type === 'video') {
        return (
            <>
                <video
                    key={String(media.id)}
                    controls
                    playsInline
                    preload="metadata"
                    poster={media.thumbnailUrl}
                    aria-label={alt}
                    onError={() => setFailed(true)}
                >
                    <source src={media.url} />
                    Seu navegador não consegue reproduzir este vídeo.
                </video>
                {failed && (
                    <span
                        className="instagram-publication-media-error"
                        role="status"
                    >
                        O vídeo não pôde ser carregado. Use o link da publicação
                        original.
                    </span>
                )}
            </>
        );
    }

    if (failed) return <PublicationPlaceholder compact />;

    return (
        <img
            key={String(media.id)}
            src={media.url}
            alt={alt}
            loading="eager"
            onError={() => setFailed(true)}
        />
    );
}

export function InstagramPublicationGrid({
    publications,
    className = 'social-grid',
    eagerFirst = false,
    busy = false,
}: {
    publications: InstagramPublication[];
    className?: string;
    eagerFirst?: boolean;
    busy?: boolean;
}) {
    const [selected, setSelected] = useState<InstagramPublication | null>(null);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRefs = useRef(new Map<number, HTMLButtonElement>());
    const lastTriggerId = useRef<number | null>(null);
    const previousOverflow = useRef('');
    const dialogId = useId();
    const titleId = `${dialogId}-title`;
    const captionId = `${dialogId}-caption`;
    const media = selected ? instagramPublicationMedia(selected) : [];
    const selectedMedia = media[selectedMediaIndex];
    const hasMultipleMedia = media.length > 1;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!selected || !dialog) return;

        previousOverflow.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        if (!dialog.open) dialog.showModal();
        requestAnimationFrame(() => closeButtonRef.current?.focus());

        return () => {
            document.body.style.overflow = previousOverflow.current;
        };
    }, [selected]);

    const restoreTriggerFocus = () => {
        const previous =
            lastTriggerId.current === null
                ? null
                : triggerRefs.current.get(lastTriggerId.current);
        const fallback = triggerRefs.current.values().next().value;
        requestAnimationFrame(() => {
            if (previous?.isConnected) previous.focus();
            else if (fallback?.isConnected) fallback.focus();
        });
    };

    const close = () => {
        dialogRef.current
            ?.querySelectorAll('video')
            .forEach((video) => video.pause());
        if (dialogRef.current?.open) dialogRef.current.close();
        else {
            setSelected(null);
            setSelectedMediaIndex(0);
            restoreTriggerFocus();
        }
    };

    const move = (direction: -1 | 1) => {
        if (media.length < 2) return;
        setSelectedMediaIndex(
            (current) => (current + direction + media.length) % media.length,
        );
    };

    return (
        <>
            <div className={className} aria-busy={busy}>
                {publications.map((publication, index) => {
                    const username =
                        publication.social_account.username ??
                        publication.social_account.slug;
                    const text = publication.display_text ?? '';
                    const title = publication.title || `@${username}`;

                    return (
                        <article
                            className="social-card social-card--feed"
                            key={publication.id}
                        >
                            <button
                                ref={(element) => {
                                    if (element)
                                        triggerRefs.current.set(
                                            publication.id,
                                            element,
                                        );
                                    else
                                        triggerRefs.current.delete(
                                            publication.id,
                                        );
                                }}
                                type="button"
                                aria-haspopup="dialog"
                                aria-controls={dialogId}
                                aria-label={`Abrir publicação de @${username}: ${title}`}
                                onClick={() => {
                                    lastTriggerId.current = publication.id;
                                    setSelectedMediaIndex(0);
                                    setSelected(publication);
                                }}
                            >
                                <PublicationCardMedia
                                    publication={publication}
                                    eager={eagerFirst && index === 0}
                                />
                                <span className="social-card-copy">
                                    <small>
                                        {
                                            publication.social_account
                                                .display_name
                                        }{' '}
                                        · @{username}
                                    </small>
                                    <strong>{title}</strong>
                                    {text && <span>{text}</span>}
                                    <b>
                                        Abrir publicação{' '}
                                        <i aria-hidden="true">↗</i>
                                    </b>
                                </span>
                            </button>
                        </article>
                    );
                })}
            </div>

            <dialog
                id={dialogId}
                ref={dialogRef}
                className="social-dialog instagram-publication-dialog"
                aria-labelledby={titleId}
                aria-describedby={
                    selected?.display_text ? captionId : undefined
                }
                onCancel={(event) => {
                    event.preventDefault();
                    close();
                }}
                onClose={() => {
                    setSelected(null);
                    setSelectedMediaIndex(0);
                    restoreTriggerFocus();
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) close();
                }}
                onKeyDown={(event) => {
                    if (!hasMultipleMedia) return;
                    if (
                        event.target instanceof HTMLVideoElement ||
                        event.target instanceof HTMLAnchorElement ||
                        event.target instanceof HTMLInputElement ||
                        event.target instanceof HTMLSelectElement ||
                        event.target instanceof HTMLTextAreaElement
                    )
                        return;
                    if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        move(-1);
                    }
                    if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        move(1);
                    }
                }}
            >
                {selected && (
                    <div className="social-dialog-inner">
                        <button
                            ref={closeButtonRef}
                            className="social-dialog-close"
                            type="button"
                            aria-label="Fechar publicação"
                            onClick={close}
                            autoFocus
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                        <div className="social-dialog-media">
                            <PublicationDialogMedia
                                key={String(selectedMedia?.id ?? 'placeholder')}
                                publication={selected}
                                media={selectedMedia}
                            />
                            {hasMultipleMedia && (
                                <>
                                    <button
                                        className="instagram-publication-previous"
                                        type="button"
                                        aria-label="Mídia anterior"
                                        onClick={() => move(-1)}
                                    >
                                        <span aria-hidden="true">←</span>
                                    </button>
                                    <button
                                        className="instagram-publication-next"
                                        type="button"
                                        aria-label="Próxima mídia"
                                        onClick={() => move(1)}
                                    >
                                        <span aria-hidden="true">→</span>
                                    </button>
                                    <span
                                        className="instagram-publication-counter"
                                        aria-live="polite"
                                    >
                                        {selectedMediaIndex + 1} de{' '}
                                        {media.length}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="social-dialog-copy">
                            <header className="instagram-publication-profile">
                                <img
                                    src="/azon-social-logo-v2.webp"
                                    alt=""
                                    width="721"
                                    height="721"
                                />
                                <span>
                                    <strong>
                                        {selected.social_account.display_name}
                                    </strong>
                                    <small>
                                        @
                                        {selected.social_account.username ??
                                            selected.social_account.slug}
                                    </small>
                                </span>
                            </header>
                            <h2 id={titleId}>
                                {selected.title ||
                                    `@${selected.social_account.username ?? selected.social_account.slug}`}
                            </h2>
                            {selected.display_text && (
                                <p
                                    id={captionId}
                                    className="social-dialog-caption"
                                >
                                    {selected.display_text}
                                </p>
                            )}
                            {instagramPublicationExternalUrl(
                                selected.external_url,
                            ) && (
                                <a
                                    className="instagram-publication-source"
                                    href={
                                        instagramPublicationExternalUrl(
                                            selected.external_url,
                                        ) ?? undefined
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Ver publicação original no Instagram
                                    <span aria-hidden="true"> ↗</span>
                                    <span className="sr-only">
                                        {' '}
                                        (abre em nova aba)
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </dialog>
        </>
    );
}
