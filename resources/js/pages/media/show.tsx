import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { MediaPlayer } from '@/components/media-player';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
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
                {related.length > 0 && (
                    <aside className="media-related">
                        <h2>Continue explorando</h2>
                        <div>
                            {related.map((item) => (
                                <Link
                                    href={
                                        item.type === 'article'
                                            ? `/noticias/${item.slug}`
                                            : `/midia/${item.slug}`
                                    }
                                    key={item.id}
                                >
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
