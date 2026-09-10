export type StructuredData = Record<string, unknown>;

export type SeoData = {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    image: string;
    imageAlt: string;
    type: string;
    locale: string;
    siteName: string;
    schema: StructuredData[];
};
