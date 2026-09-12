export type StructuredData = Record<string, unknown>;

export type SeoData = {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    image: string;
    imageAlt: string;
    imageWidth: number;
    imageHeight: number;
    imageType: string;
    twitterCard: 'summary' | 'summary_large_image';
    keywords: string;
    type: string;
    locale: string;
    siteName: string;
    schema: StructuredData[];
};
