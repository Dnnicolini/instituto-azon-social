import type { Post } from '@/types/cms';
function safeEmbed(post: Post): string | null {
    if (!post.external_url || !post.provider) return null;
    try {
        const url = new URL(post.external_url);
        if (post.provider === 'youtube') {
            if (
                !['youtube.com', 'www.youtube.com', 'youtu.be'].includes(
                    url.hostname,
                )
            )
                return null;
            const id =
                url.hostname === 'youtu.be'
                    ? url.pathname.slice(1)
                    : (url.searchParams.get('v') ??
                      url.pathname.split('/').filter(Boolean).at(-1));
            return id && /^[\w-]{6,20}$/.test(id)
                ? `https://www.youtube-nocookie.com/embed/${id}`
                : null;
        }
        if (post.provider === 'vimeo') {
            if (
                !['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(
                    url.hostname,
                )
            )
                return null;
            const id = url.pathname
                .split('/')
                .filter(Boolean)
                .findLast((part) => /^\d+$/.test(part));
            return id ? `https://player.vimeo.com/video/${id}` : null;
        }
        if (post.provider === 'spotify') {
            if (
                !['open.spotify.com', 'www.open.spotify.com'].includes(
                    url.hostname,
                )
            )
                return null;
            const parts = url.pathname.split('/').filter(Boolean);
            const typeIndex = parts[0] === 'embed' ? 1 : 0;
            const type = parts[typeIndex];
            const id = parts[typeIndex + 1];
            return ['episode', 'show'].includes(type) &&
                id &&
                /^[\w]+$/.test(id)
                ? `https://open.spotify.com/embed/${type}/${id}`
                : null;
        }
    } catch {
        return null;
    }
    return null;
}

function safeExternalUrl(value?: string | null): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
    }
}
export function MediaPlayer({ post }: { post: Post }) {
    if (post.video_url) {
        return (
            <div className="media-player">
                <video
                    controls
                    preload="metadata"
                    poster={post.cover_url ?? undefined}
                    aria-label={`Reproduzir ${post.title}`}
                >
                    <source
                        src={post.video_url}
                        type={post.video_mime_type ?? undefined}
                    />
                    Seu navegador não conseguiu reproduzir este vídeo.
                </video>
            </div>
        );
    }
    const embed = safeEmbed(post);
    if (!embed) {
        const externalUrl = safeExternalUrl(post.external_url);
        return (
            <div className="media-player-unavailable">
                <strong>
                    {externalUrl
                        ? 'Conteúdo disponível na plataforma de origem'
                        : 'Reprodução indisponível'}
                </strong>
                <p>
                    {externalUrl
                        ? 'Abra o episódio ou vídeo em uma nova guia para continuar.'
                        : 'O endereço deste conteúdo precisa ser revisado pela equipe.'}
                </p>
                {externalUrl && (
                    <a
                        className="button button-gold"
                        href={externalUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Abrir na plataforma ↗
                    </a>
                )}
            </div>
        );
    }
    return (
        <div className="media-player">
            <iframe
                src={embed}
                title={`Reproduzir ${post.title}`}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
            />
        </div>
    );
}
