import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { ContentGallery } from '@/components/content-gallery';
import { MediaPlayer } from '@/components/media-player';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import { contentUrl } from '@/lib/content-url';
import type { Post } from '@/types/cms';
import { typeLabels } from '@/types/cms';
import type { SeoData } from '@/types/seo';

const publicationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

function formatPublicationDate(date?: string | null) {
    if (!date) return null;

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? null
        : publicationDateFormatter.format(parsedDate);
}

function readingTime(body?: string | null) {
    const words = body?.trim().split(/\s+/).filter(Boolean).length ?? 0;

    return Math.max(1, Math.ceil(words / 200));
}

export default function MediaShow({
    seo,
    post,
    related = [],
}: {
    seo: SeoData;
    post: Post;
    related?: Post[];
}) {
    const paragraphs = (post.body ?? '').split(/\n{2,}/).filter(Boolean);
    const isArticle = post.type === 'article';
    const indexUrl = isArticle ? '/noticias' : '/midia';
    const publishedAt = formatPublicationDate(post.published_at);
    const duration = isArticle
        ? readingTime(post.body)
        : post.duration_seconds
          ? Math.ceil(post.duration_seconds / 60)
          : null;
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className={`media-detail ${isArticle ? 'is-article' : 'is-media'}`}
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header
                    className={`media-detail-hero${post.cover_url ? ' has-cover' : ' without-cover'}`}
                >
                    <div className="media-detail-hero-inner">
                        <div className="media-detail-heading">
                            <Link className="media-detail-back" href={indexUrl}>
                                <span aria-hidden="true">←</span>{' '}
                                {isArticle
                                    ? 'Voltar às notícias'
                                    : 'Voltar à biblioteca'}
                            </Link>
                            <div
                                className="media-detail-meta"
                                aria-label="Informações da publicação"
                            >
                                <span>{typeLabels[post.type]}</span>
                                {publishedAt && (
                                    <time dateTime={post.published_at ?? ''}>
                                        {publishedAt}
                                    </time>
                                )}
                                {duration && (
                                    <span>
                                        {duration}{' '}
                                        {isArticle ? 'min de leitura' : 'min'}
                                    </span>
                                )}
                            </div>
                            <h1>{post.title}</h1>
                            {post.excerpt && (
                                <p className="media-detail-deck">
                                    {post.excerpt}
                                </p>
                            )}
                            {post.author && (
                                <p className="media-detail-author">
                                    Por {post.author}
                                </p>
                            )}
                        </div>
                        {post.cover_url && (
                            <figure className="media-detail-cover">
                                <img
                                    src={post.cover_url}
                                    alt={post.cover_alt || ''}
                                />
                            </figure>
                        )}
                    </div>
                </header>
                {post.type !== 'article' && (
                    <section
                        className="media-detail-player"
                        aria-label="Reprodutor"
                    >
                        <MediaPlayer post={post} />
                    </section>
                )}
                <article
                    className={`media-detail-copy${paragraphs.length ? '' : ' is-empty'}`}
                >
                    {paragraphs.length ? (
                        paragraphs.map((paragraph) => (
                            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                        ))
                    ) : (
                        <p>
                            Este conteúdo ainda não possui transcrição ou texto
                            complementar.
                        </p>
                    )}
                </article>
                {post.gallery_images && post.gallery_images.length > 0 && (
                    <ContentGallery
                        items={post.gallery_images}
                        fallbackAlt={`Registro de ${post.title}`}
                    />
                )}
                {related.length > 0 && (
                    <aside className="media-related">
                        <h2>
                            {isArticle
                                ? 'Outras histórias do território'
                                : 'Continue explorando'}
                        </h2>
                        <div>
                            {related.map((item) => (
                                <Link href={contentUrl(item)} key={item.id}>
                                    <span className="media-related-art">
                                        {item.cover_url ? (
                                            <img
                                                src={item.cover_url}
                                                alt={item.cover_alt || ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span aria-hidden="true">
                                                {item.title.charAt(0)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="media-related-copy">
                                        <small>{typeLabels[item.type]}</small>
                                        <strong>{item.title}</strong>
                                        {item.excerpt && <p>{item.excerpt}</p>}
                                        <span className="media-related-link">
                                            Ler conteúdo{' '}
                                            <span aria-hidden="true">→</span>
                                        </span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </aside>
                )}
            </main>
            <PublicFooter />
        </>
    );
}
