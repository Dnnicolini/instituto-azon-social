import { Link, router } from '@inertiajs/react';
import { EmptyState, Pagination } from '@/components/admin/cms-ui';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type { Paginated, Post } from '@/types/cms';
import { typeLabels } from '@/types/cms';
import type { SeoData } from '@/types/seo';
type Filters = { type?: string; search?: string; availableTypes?: string[] };
export default function MediaIndex({
    seo,
    posts,
    filters = {},
}: {
    seo: SeoData;
    posts: Paginated<Post>;
    filters?: Filters;
}) {
    const featured = posts.data[0];
    function filter(type: string) {
        router.get(
            '/midia',
            { ...filters, type: type || undefined },
            { preserveState: true, replace: true },
        );
    }
    const available = [
        ['', 'Todos'],
        ['vlog', 'Vlogs'],
        ['video', 'Vídeos'],
        ['podcast', 'Podcasts'],
    ].filter(
        ([value]) =>
            value === '' ||
            !filters.availableTypes ||
            filters.availableTypes.includes(value),
    );
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main className="media-page" id="conteudo-principal" tabIndex={-1}>
                <section className="media-hero">
                    <div>
                        <p className="eyebrow light">Vozes do território</p>
                        <h1>Histórias para ver, ouvir e levar adiante.</h1>
                        <p>
                            Vlogs, conversas, registros e podcasts produzidos
                            pelo Instituto Azon Social.
                        </p>
                    </div>
                    {featured ? (
                        <Link
                            className="media-feature"
                            href={`/midia/${featured.slug}`}
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
                                <b>Assistir ou ouvir →</b>
                            </div>
                            <div>
                                <small>{typeLabels[featured.type]}</small>
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
                            <h2>Biblioteca Azon</h2>
                            <p>
                                Escolha um formato ou explore toda a produção.
                            </p>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                const search = data.get('search');
                                router.get(
                                    '/midia',
                                    {
                                        ...filters,
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
                            <label className="sr-only" htmlFor="media-search">
                                Buscar na biblioteca
                            </label>
                            <input
                                id="media-search"
                                name="search"
                                type="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Buscar por título"
                            />
                            <button type="submit">Buscar</button>
                        </form>
                    </header>
                    <div
                        className="media-filters"
                        role="group"
                        aria-label="Filtrar por formato"
                    >
                        {available.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                className={
                                    (filters.type ?? '') === value
                                        ? 'active'
                                        : ''
                                }
                                aria-pressed={(filters.type ?? '') === value}
                                onClick={() => filter(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {posts.data.length ? (
                        <div className="media-grid">
                            {posts.data.map((post, index) => (
                                <article
                                    className={index === 0 ? 'wide' : ''}
                                    key={post.id}
                                >
                                    <Link
                                        className="media-card-art"
                                        href={`/midia/${post.slug}`}
                                    >
                                        {post.cover_url ? (
                                            <img
                                                src={post.cover_url}
                                                alt={post.cover_alt ?? ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span aria-hidden="true">
                                                {post.type === 'podcast'
                                                    ? '◖'
                                                    : 'A'}
                                            </span>
                                        )}
                                        {post.type === 'podcast' && (
                                            <i
                                                className="media-wave"
                                                aria-hidden="true"
                                            >
                                                ▁▃▆▂▅▇▃▁▅▂▆
                                            </i>
                                        )}
                                    </Link>
                                    <small>
                                        {typeLabels[post.type]}
                                        {post.duration_seconds
                                            ? ` • ${Math.ceil(post.duration_seconds / 60)} min`
                                            : ''}
                                    </small>
                                    <h3>
                                        <Link href={`/midia/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <p>{post.excerpt}</p>
                                    <Link
                                        className="text-link"
                                        href={`/midia/${post.slug}`}
                                    >
                                        Abrir conteúdo →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhum conteúdo encontrado"
                            description="Altere o formato ou a busca para explorar a biblioteca."
                        />
                    )}
                    <Pagination page={posts} />
                </section>
            </main>
            <PublicFooter />
        </>
    );
}
