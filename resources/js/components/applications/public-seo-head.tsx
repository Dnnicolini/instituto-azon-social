import { SeoHead } from '@/components/seo-head';
import type { PublicPageSeo } from '@/types/applications';

export function PublicSeoHead({
    seo,
    fallbackTitle,
    fallbackDescription = '',
}: {
    seo?: PublicPageSeo;
    fallbackTitle: string;
    fallbackDescription?: string;
}) {
    return (
        <SeoHead
            seo={{
                title: seo?.title ?? fallbackTitle,
                description: seo?.description ?? fallbackDescription,
                canonical: seo?.canonical ?? '',
                robots: seo?.robots ?? 'index, follow',
                image: seo?.image ?? '',
                imageAlt: seo?.imageAlt ?? '',
                imageWidth: seo?.imageWidth ?? 0,
                imageHeight: seo?.imageHeight ?? 0,
                imageType: seo?.imageType ?? '',
                twitterCard: seo?.twitterCard ?? 'summary',
                keywords: seo?.keywords ?? '',
                type: seo?.type ?? 'website',
                locale: seo?.locale ?? 'pt_BR',
                siteName: seo?.siteName ?? 'Instituto Azon Social',
                schema: seo?.schema ?? [],
            }}
        />
    );
}
