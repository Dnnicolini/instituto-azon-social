import { Link, router } from '@inertiajs/react';
import { EmptyState, Pagination } from '@/components/admin/cms-ui';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import { contentUrl } from '@/lib/content-url';
import type { Paginated, Post } from '@/types/cms';
import type { SeoData } from '@/types/seo';

type Filters = { search?: string };

export default function NewsIndex({
    seo,
    posts,
    filters = {},
}: {
    seo: SeoData;
    posts: Paginated<Post>;
    filters?: Filters;
}) {
    const featured = posts.data[0];

    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main className="media-page" id="conteudo-principal" tabIndex={-1}>
                <section className="media-hero">
                    <div>
                        <p className="eyebrow light">Azon em movimento</p>
                        <h1>Histórias do nosso território.</h1>
                        <p>
                            Notícias, artigos e registros das iniciativas do
                            Instituto Azon Social.
                        </p>
                    </div>
                    {featured ? (
                        <Link
                            className="media-feature"
                            href={contentUrl(featured)}
                        >
                            <div className="media-feature-art">
                                {featured.cover_url ? (
                                    <img
                                        src={featured.cover_url}
                                        alt={featured.cover_alt ?? ''}
                                    />
                                ) : (
                                    <span aria-hidden="true">A</span>
                                )}
                                <b>Continuar lendo →</b>
                            </div>
                            <div>
                                <small>Artigo em destaque</small>
                                <h2>{featured.title}</h2>
                                <p>{featured.excerpt}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="media-feature-empty">
                            <span aria-hidden="true">A</span>
                            <p>Novas histórias serão publicadas aqui.</p>
                        </div>
                    )}
                </section>
                <section className="media-library">
                    <header>
                        <div>
                            <h2>Todas as notícias</h2>
                            <p>
                                Acompanhe os projetos, encontros e ações do
                                Instituto.
                            </p>
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                const search = data.get('search');
                                router.get(
                                    '/noticias',
                                    {
                                        search:
                                            typeof search === 'string'
                                                ? search
                                                : '',
                                    },
                                    { preserveState: true },
                                );
                            }}
                            role="search"
                        >
                            <label className="sr-only" htmlFor="news-search">
                                Buscar nas notícias
                            </label>
                            <input
                                id="news-search"
                                name="search"
                                type="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Buscar por título"
                            />
                            <button type="submit">Buscar</button>
                        </form>
                    </header>
                    {posts.data.length ? (
                        <div className="media-grid news-grid-list">
                            {posts.data.map((post, index) => (
                                <article
                                    className={index === 0 ? 'wide' : ''}
                                    key={post.id}
                                >
                                    <Link
                                        className="media-card-art"
                                        href={contentUrl(post)}
                                    >
                                        {post.cover_url ? (
                                            <img
                                                src={post.cover_url}
                                                alt={post.cover_alt ?? ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span aria-hidden="true">A</span>
                                        )}
                                    </Link>
                                    <small>Artigo</small>
                                    <h3>
                                        <Link href={contentUrl(post)}>
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <p>{post.excerpt}</p>
                                    <Link
                                        className="text-link"
                                        href={contentUrl(post)}
                                    >
                                        Continuar lendo →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhuma notícia encontrada"
                            description="Altere a busca para encontrar outras histórias."
                        />
                    )}
                    <Pagination page={posts} />
                </section>
            </main>
            <PublicFooter />
        </>
    );
}
