import { useEffect, useId, useRef, useState } from 'react';
import { GalleryMediaItem } from '@/components/gallery-media-item';
import type { GalleryImage } from '@/types/cms';

export function ContentGallery({
    items,
    title = 'Galeria de mídias',
    description,
    fallbackAlt = '',
    compact = false,
}: {
    items: GalleryImage[];
    title?: string;
    description?: string;
    fallbackAlt?: string;
    compact?: boolean;
}) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const lastTriggerIndex = useRef(0);
    const galleryId = useId();
    const galleryTitleId = `${galleryId}-title`;
    const lightboxTitleId = `${galleryId}-lightbox-title`;
    const selected = selectedIndex === null ? null : items[selectedIndex];
    const hasMultiple = items.length > 1;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (selected && !dialog.open) dialog.showModal();
        if (!selected && dialog.open) dialog.close();
    }, [selected]);

    useEffect(() => {
        if (selectedIndex === null || !hasMultiple) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setSelectedIndex(
                    (current) =>
                        ((current ?? 0) - 1 + items.length) % items.length,
                );
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                setSelectedIndex(
                    (current) => ((current ?? 0) + 1) % items.length,
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasMultiple, items.length, selectedIndex]);

    if (items.length === 0) return null;

    const openAt = (index: number) => {
        lastTriggerIndex.current = index;
        setSelectedIndex(index);
    };
    const close = () => dialogRef.current?.close();
    const move = (direction: -1 | 1) => {
        setSelectedIndex(
            (current) =>
                ((current ?? 0) + direction + items.length) % items.length,
        );
    };

    return (
        <section
            className={`content-gallery${items.length === 1 ? ' is-single' : ' is-grid'}${compact ? ' compact' : ''}`}
            aria-labelledby={galleryTitleId}
        >
            <header className={compact ? 'sr-only' : undefined}>
                <h2 id={galleryTitleId}>{title}</h2>
                {description && <p>{description}</p>}
            </header>
            <div className="content-gallery-grid">
                {items.map((media, index) => {
                    const isPortrait =
                        Boolean(media.width && media.height) &&
                        Number(media.height) > Number(media.width);
                    const caption =
                        media.alt ||
                        (media.media_type === 'video'
                            ? `Vídeo ${index + 1}`
                            : `Imagem ${index + 1}`);

                    return (
                        <figure
                            key={media.id}
                            className={isPortrait ? 'is-portrait' : undefined}
                        >
                            <button
                                ref={(element) => {
                                    triggerRefs.current[index] = element;
                                }}
                                type="button"
                                onClick={() => openAt(index)}
                                aria-label={`Abrir ${caption} em tamanho completo`}
                            >
                                <GalleryMediaItem
                                    media={media}
                                    fallbackAlt={fallbackAlt}
                                    presentation="thumbnail"
                                />
                                {media.media_type === 'video' && (
                                    <span className="content-gallery-play">
                                        Reproduzir vídeo
                                    </span>
                                )}
                            </button>
                            {hasMultiple && <figcaption>{caption}</figcaption>}
                        </figure>
                    );
                })}
            </div>

            <dialog
                ref={dialogRef}
                className="content-lightbox"
                aria-labelledby={lightboxTitleId}
                onClose={() => {
                    setSelectedIndex(null);
                    requestAnimationFrame(() =>
                        triggerRefs.current[lastTriggerIndex.current]?.focus(),
                    );
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) close();
                }}
            >
                {selected && selectedIndex !== null && (
                    <div className="content-lightbox-layout">
                        <h2 id={lightboxTitleId} className="sr-only">
                            {selected.alt || title}
                        </h2>
                        <button
                            className="content-lightbox-close"
                            type="button"
                            aria-label="Fechar galeria"
                            onClick={close}
                            autoFocus
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                        {hasMultiple && (
                            <button
                                className="content-lightbox-previous"
                                type="button"
                                aria-label="Mídia anterior"
                                onClick={() => move(-1)}
                            >
                                <span aria-hidden="true">←</span>
                            </button>
                        )}
                        <div className="content-lightbox-media">
                            <GalleryMediaItem
                                media={selected}
                                fallbackAlt={fallbackAlt}
                            />
                        </div>
                        {hasMultiple && (
                            <button
                                className="content-lightbox-next"
                                type="button"
                                aria-label="Próxima mídia"
                                onClick={() => move(1)}
                            >
                                <span aria-hidden="true">→</span>
                            </button>
                        )}
                        <footer>
                            <span>
                                {selectedIndex + 1} de {items.length}
                            </span>
                            <p>{selected.alt || title}</p>
                        </footer>
                    </div>
                )}
            </dialog>
        </section>
    );
}
