import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { InstagramPublicationGrid } from '@/components/instagram-publication-grid';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type { SitePage } from '@/types/cms';
import type { InstagramPublication } from '@/types/instagram';
import type { SeoData } from '@/types/seo';

type ChannelPresentation = {
    accent: 'news' | 'podcast' | 'legidan' | 'presente';
    image: string;
    imageAlt: string;
    imageWidth: number;
    imageHeight: number;
    instagramHandle: string;
    instagramUrl: string;
    sourceUrl: string;
    sourceLabel: string;
    imageMode?: 'logo' | 'poster';
};

const channelPresentations: Record<string, ChannelPresentation> = {
    'azon-news': {
        accent: 'news',
        image: '/social/azon-news-apresentacao.webp',
        imageAlt:
            'Apresentação oficial do Azon News, canal de comunicação do Instituto Azon Social',
        imageWidth: 1440,
        imageHeight: 1440,
        instagramHandle: '@azon.news',
        instagramUrl: 'https://www.instagram.com/azon.news/',
        sourceUrl: 'https://www.instagram.com/azon.news/p/DdWOyY1xGAx/',
        sourceLabel: 'Publicação de apresentação do Azon News',
        imageMode: 'poster',
    },
    'azon-podcast': {
        accent: 'podcast',
        image: '/social/azon-cast-profile.jpg',
        imageAlt: 'Identidade visual oficial do Azon Cast',
        imageWidth: 150,
        imageHeight: 150,
        instagramHandle: '@azon.cast',
        instagramUrl: 'https://www.instagram.com/azon.cast/',
        sourceUrl: 'https://www.instagram.com/azon.cast/',
        sourceLabel: 'Perfil oficial do Azon Cast',
        imageMode: 'logo',
    },
    'hunkpame-azon-legidan': {
        accent: 'legidan',
        image: '/social/instagram-raizes.webp',
        imageAlt:
            'Publicação oficial sobre a identidade do Hunkpame Azon Legidan',
        imageWidth: 864,
        imageHeight: 1080,
        instagramHandle: '@azonlegidan',
        instagramUrl: 'https://www.instagram.com/azonlegidan/',
        sourceUrl: 'https://www.instagram.com/azonlegidan/p/Dc_D8keu35d/',
        sourceLabel: 'Publicação sobre a identidade do Hunkpame',
        imageMode: 'poster',
    },
    'presente-de-iemanja-sepetiba': {
        accent: 'presente',
        image: '/social/presente-sepetiba.jpg',
        imageAlt:
            'Comissão do Presente a Yemonjá em Sepetiba em encontro cultural',
        imageWidth: 1085,
        imageHeight: 814,
        instagramHandle: '@presente.sepetiba',
        instagramUrl: 'https://www.instagram.com/presente.sepetiba/',
        sourceUrl: 'https://www.instagram.com/presente.sepetiba/p/Dd6xVQilXwS/',
        sourceLabel: 'Registro publicado pelo Presente Sepetiba',
    },
};

function ChannelLink({
    className,
    href,
    children,
}: {
    className: string;
    href: string;
    children: ReactNode;
}) {
    if (href.startsWith('https://')) {
        return (
            <a
                className={className}
                href={href}
                target="_blank"
                rel="noreferrer"
            >
                {children}
            </a>
        );
    }

    return (
        <Link className={className} href={href}>
            {children}
        </Link>
    );
}

function ChannelPage({
    page,
    presentation,
    socialPosts,
}: {
    page: SitePage;
    presentation: ChannelPresentation;
    socialPosts: InstagramPublication[];
}) {
    const sections = page.sections ?? [];
    const hero = sections.find((section) => section.type === 'hero');
    const narrativeSections = sections.filter(
        (section) => section.type !== 'hero',
    );
    const intro = narrativeSections[0];
    const features = narrativeSections.slice(1);
    const body = (page.body ?? '').split(/\n{2,}/).filter(Boolean);

    return (
        <main
            className={`channel-page channel-page--${presentation.accent}`}
            id="conteudo-principal"
            tabIndex={-1}
        >
            <section className="channel-hero" aria-labelledby="channel-title">
                <div className="channel-hero-copy">
                    <span className="channel-signal" aria-hidden="true" />
                    <p className="eyebrow">
                        {hero?.eyebrow ?? 'Instituto Azon Social'}
                    </p>
                    <h1 id="channel-title">{page.title}</h1>
                    {hero && (
                        <h2>
                            {hero.title}
                            {hero.emphasis && <em> {hero.emphasis}</em>}
                        </h2>
                    )}
                    {hero?.text && <p className="channel-lead">{hero.text}</p>}
                    <div className="channel-actions">
                        {hero?.cta_url && (
                            <ChannelLink
                                className="button button-gold"
                                href={hero.cta_url}
                            >
                                {hero.cta_label ?? 'Saiba mais'}
                            </ChannelLink>
                        )}
                        <a
                            className="text-link"
                            href={presentation.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {presentation.instagramHandle} no Instagram ↗
                        </a>
                    </div>
                </div>
                <figure
                    className={`channel-hero-media channel-hero-media--${presentation.imageMode ?? 'photo'}`}
                >
                    <img
                        src={presentation.image}
                        alt={presentation.imageAlt}
                        width={presentation.imageWidth}
                        height={presentation.imageHeight}
                    />
                    <figcaption>
                        <a
                            href={presentation.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {presentation.sourceLabel} ↗
                        </a>
                    </figcaption>
                </figure>
            </section>

            {intro && (
                <section
                    className="channel-intro"
                    aria-labelledby="channel-intro-title"
                >
                    <p className="eyebrow">{intro.eyebrow}</p>
                    <div>
                        <h2 id="channel-intro-title">
                            {intro.title}
                            {intro.emphasis && <em> {intro.emphasis}</em>}
                        </h2>
                        {intro.text?.split(/\n{2,}/).map((paragraph) => (
                            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                        ))}
                    </div>
                </section>
            )}

            {features.length > 0 && (
                <section className="channel-features" aria-label="Destaques">
                    {features.map((section, index) => (
                        <article
                            key={`${section.type}-${section.title}-${index}`}
                        >
                            <span className="channel-feature-number">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="eyebrow">{section.eyebrow}</p>
                            <h2>
                                {section.title}
                                {section.emphasis && (
                                    <em> {section.emphasis}</em>
                                )}
                            </h2>
                            {section.text?.split(/\n{2,}/).map((paragraph) => (
                                <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                            ))}
                            {section.cta_url && (
                                <ChannelLink
                                    className="text-link"
                                    href={section.cta_url}
                                >
                                    {section.cta_label ?? 'Saiba mais'} →
                                </ChannelLink>
                            )}
                        </article>
                    ))}
                </section>
            )}

            {body.length > 0 && (
                <section
                    className="channel-statement"
                    aria-label="Sobre este canal"
                >
                    <p className="eyebrow">Instituto Azon Social</p>
                    <div>
                        {body.map((paragraph) => (
                            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                        ))}
                    </div>
                </section>
            )}

            {socialPosts.length > 0 && (
                <section
                    className="social-section section"
                    aria-labelledby="channel-social-title"
                >
                    <header className="social-heading">
                        <div>
                            <p className="eyebrow">Instagram</p>
                            <h2 id="channel-social-title">
                                Publicações desta iniciativa
                            </h2>
                        </div>
                        <Link className="text-link" href="/redes">
                            Ver todas as publicações →
                        </Link>
                    </header>
                    <InstagramPublicationGrid publications={socialPosts} />
                </section>
            )}

            <nav
                className="channel-switcher"
                aria-label="Outros canais e iniciativas"
            >
                <p>Conheça também</p>
                {Object.keys(channelPresentations)
                    .filter((slug) => slug !== page.slug)
                    .map((slug) => (
                        <Link key={slug} href={`/pagina/${slug}`}>
                            {slug === 'azon-news' && 'Azon News'}
                            {slug === 'azon-podcast' && 'Azon Cast'}
                            {slug === 'hunkpame-azon-legidan' &&
                                'Hunkpame Azon Legidan'}
                            {slug === 'presente-de-iemanja-sepetiba' &&
                                'Presente Sepetiba'}
                            <span aria-hidden="true">↗</span>
                        </Link>
                    ))}
            </nav>
        </main>
    );
}

function GenericPage({ page }: { page: SitePage }) {
    const body = (page.body ?? '').split(/\n{2,}/).filter(Boolean);

    return (
        <main className="public-page" id="conteudo-principal" tabIndex={-1}>
            <header>
                <p className="eyebrow">Instituto Azon Social</p>
                <h1>{page.title}</h1>
            </header>
            {page.sections?.map((section, index) => (
                <section key={`${section.type}-${index}`}>
                    <p className="eyebrow">{section.eyebrow}</p>
                    <h2>
                        {section.title}
                        {section.emphasis && <em> {section.emphasis}</em>}
                    </h2>
                    {section.text?.split(/\n{2,}/).map((paragraph) => (
                        <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                    ))}
                    {section.cta_url && (
                        <ChannelLink
                            className="text-link"
                            href={section.cta_url}
                        >
                            {section.cta_label ?? 'Saiba mais'} →
                        </ChannelLink>
                    )}
                </section>
            ))}
            {body.length > 0 && (
                <article>
                    {body.map((paragraph) => (
                        <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                    ))}
                </article>
            )}
            <Link className="text-link" href="/">
                ← Voltar ao início
            </Link>
        </main>
    );
}

export default function PublicPage({
    seo,
    page,
    socialPosts = [],
}: {
    seo: SeoData;
    page: SitePage;
    socialPosts?: InstagramPublication[];
}) {
    const presentation = channelPresentations[page.slug];

    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            {presentation ? (
                <ChannelPage
                    page={page}
                    presentation={presentation}
                    socialPosts={socialPosts}
                />
            ) : (
                <GenericPage page={page} />
            )}
            <PublicFooter />
        </>
    );
}
