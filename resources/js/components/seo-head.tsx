import { Head } from '@inertiajs/react';
import type { SeoData } from '@/types/seo';

type SeoHeadProps = {
    seo: SeoData;
};

export function SeoHead({ seo }: SeoHeadProps) {
    return (
        <Head>
            <title>{seo.title}</title>
            <meta
                head-key="description"
                name="description"
                content={seo.description}
            />
            <meta head-key="robots" name="robots" content={seo.robots} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            <meta
                head-key="og:description"
                property="og:description"
                content={seo.description}
            />
            <meta head-key="og:type" property="og:type" content={seo.type} />
            <meta head-key="og:url" property="og:url" content={seo.canonical} />
            <meta
                head-key="og:site_name"
                property="og:site_name"
                content={seo.siteName}
            />
            <meta
                head-key="og:locale"
                property="og:locale"
                content={seo.locale}
            />
            <meta head-key="og:image" property="og:image" content={seo.image} />
            <meta
                head-key="og:image:alt"
                property="og:image:alt"
                content={seo.imageAlt}
            />
            <meta
                head-key="twitter:card"
                name="twitter:card"
                content="summary"
            />
            <meta
                head-key="twitter:title"
                name="twitter:title"
                content={seo.title}
            />
            <meta
                head-key="twitter:description"
                name="twitter:description"
                content={seo.description}
            />
            <meta
                head-key="twitter:image"
                name="twitter:image"
                content={seo.image}
            />
            {seo.schema.map((schema, index) => (
                <script
                    head-key={`structured-data-${index}`}
                    key={`structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </Head>
    );
}
