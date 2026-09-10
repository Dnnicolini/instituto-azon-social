import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type { SitePage } from '@/types/cms';
import type { SeoData } from '@/types/seo';

export default function PublicPage({
    seo,
    page,
}: {
    seo: SeoData;
    page: SitePage;
}) {
    const body = (page.body ?? '').split(/\n{2,}/).filter(Boolean);
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
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
                            {section.emphasis && (
                                <>
                                    {' '}
                                    <em>{section.emphasis}</em>
                                </>
                            )}
                        </h2>
                        {section.text?.split(/\n{2,}/).map((paragraph) => (
                            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                        ))}
                        {section.cta_url && (
                            <a className="text-link" href={section.cta_url}>
                                {section.cta_label ?? 'Saiba mais'} →
                            </a>
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
            <PublicFooter />
        </>
    );
}
