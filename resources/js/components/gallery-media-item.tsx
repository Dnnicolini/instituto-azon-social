import type { GalleryImage } from '@/types/cms';

export function GalleryMediaItem({
    media,
    fallbackAlt = '',
    presentation = 'full',
}: {
    media: GalleryImage;
    fallbackAlt?: string;
    presentation?: 'thumbnail' | 'full';
}) {
    if (media.media_type === 'video') {
        return (
            <video
                controls={presentation === 'full'}
                preload="metadata"
                playsInline
                muted={presentation === 'thumbnail'}
                aria-label={media.alt || 'Vídeo da galeria'}
            >
                <source src={media.url} type={media.mime_type || 'video/mp4'} />
                Seu navegador não consegue reproduzir este vídeo.
            </video>
        );
    }

    return (
        <img src={media.url} alt={media.alt ?? fallbackAlt} loading="lazy" />
    );
}
