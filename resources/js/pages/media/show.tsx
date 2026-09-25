import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { MediaPlayer } from '@/components/media-player';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import { contentUrl } from '@/lib/content-url';
import type { Post } from '@/types/cms';
import { typeLabels } from '@/types/cms';
import type { SeoData } from '@/types/seo';
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
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="media-detail"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header>
                    <Link href={indexUrl}>
                        ←{' '}
                        {isArticle
                            ? 'Voltar às notícias'
                            : 'Voltar à biblioteca'}
                    </Link>
                    <p>
                        {typeLabels[post.type]}
                        {post.duration_seconds
                            ? ` • ${Math.ceil(post.duration_seconds / 60)} min`
                            : ''}
                    </p>
                    <h1>{post.title}</h1>
                    <p>{post.excerpt}</p>
                </header>
                {post.type !== 'article' && (
                    <section
                        className="media-detail-player"
                        aria-label="Reprodutor"
                    >
                        <MediaPlayer post={post} />
                    </section>
                )}
                <article className="media-detail-copy">
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
                    <section
                        className="content-gallery"
                        aria-labelledby="content-gallery-title"
                    >
                        <h2 id="content-gallery-title">Galeria de fotos</h2>
                        <div>
                            {post.gallery_images.map((image) => (
                                <img
                                    key={image.id}
                                    src={image.url}
                                    alt={image.alt ?? ''}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </section>
                )}
                {related.length > 0 && (
                    <aside className="media-related">
                        <h2>Continue explorando</h2>
                        <div>
                            {related.map((item) => (
                                <Link href={contentUrl(item)} key={item.id}>
                                    <small>{typeLabels[item.type]}</small>
                                    <strong>{item.title}</strong>
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
