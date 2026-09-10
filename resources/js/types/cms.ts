import type { SeoData } from './seo';

export type ContentStatus =
    | 'draft'
    | 'review'
    | 'scheduled'
    | 'published'
    | 'archived';

export type ContentType = 'article' | 'vlog' | 'video' | 'podcast' | 'social';

export type SelectOption = {
    value: string;
    label: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type AdminUserSummary = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    avatar?: string | null;
};

export type AdminSharedProps = {
    seo: SeoData;
    auth: { user: AdminUserSummary };
    flash?: { success?: string; error?: string };
    unreadMessages?: number;
};

export type Post = {
    id: number;
    title: string;
    slug: string;
    type: ContentType;
    status: ContentStatus;
    excerpt?: string | null;
    body?: string | null;
    cover_url?: string | null;
    cover_alt?: string | null;
    provider?:
        | 'youtube'
        | 'vimeo'
        | 'spotify'
        | 'anchor'
        | 'instagram'
        | 'other'
        | null;
    external_url?: string | null;
    duration_seconds?: number | null;
    is_featured?: boolean;
    sort_order?: number;
    seo_title?: string | null;
    seo_description?: string | null;
    published_at?: string | null;
    updated_at: string;
};

export type Project = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    body?: string | null;
    status: ContentStatus;
    cover_url?: string | null;
    cover_alt?: string | null;
    sort_order?: number;
    published_at?: string | null;
    updated_at: string;
};

export type Event = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    body?: string | null;
    status: ContentStatus | 'open' | 'closed' | 'completed';
    starts_at?: string | null;
    ends_at?: string | null;
    date_label?: string | null;
    location: string;
    cover_url?: string | null;
    cover_alt?: string | null;
    registration_url?: string | null;
    participation_details?: string | null;
    published_at?: string | null;
    updated_at: string;
};

export type TransparencyDocument = {
    id: number;
    title: string;
    category: string;
    status: ContentStatus;
    file_url?: string | null;
    published_at?: string | null;
    updated_at: string;
};

export type SitePage = {
    id: number;
    title: string;
    slug: string;
    status: ContentStatus;
    body?: string | null;
    sections?: Array<{
        type:
            | 'hero'
            | 'intro'
            | 'history'
            | 'transparency'
            | 'participate'
            | 'text';
        eyebrow?: string | null;
        title: string;
        emphasis?: string | null;
        text?: string | null;
        cta_label?: string | null;
        cta_url?: string | null;
    }>;
    seo_title?: string | null;
    seo_description?: string | null;
    published_at?: string | null;
    updated_at: string;
};

export type ContactMessage = {
    id: number;
    name: string;
    email: string;
    subject: string;
    message?: string;
    body?: string;
    phone?: string | null;
    status: 'new' | 'read' | 'responded' | 'archived';
    created_at: string;
};

export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    roles: Array<{ id: number; name: string; slug: string }>;
    email_verified_at?: string | null;
    created_at: string;
};

export type PermissionGroup = {
    id: number;
    name: string;
    description?: string | null;
    permissions: Array<{
        id: number;
        name: string;
        slug: string;
        group: string;
    }>;
    users_count: number;
    slug?: string;
    is_system?: boolean;
};

export type SiteSettings = {
    site_name: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    hero_title: string;
    hero_emphasis: string;
    hero_text: string;
    founder_name: string;
    founder_text: string;
};

export const statusLabels: Record<ContentStatus, string> = {
    draft: 'Rascunho',
    review: 'Em revisão',
    scheduled: 'Agendado',
    published: 'Publicado',
    archived: 'Arquivado',
};

export const typeLabels: Record<ContentType, string> = {
    article: 'Artigo',
    vlog: 'Vlog',
    video: 'Vídeo',
    podcast: 'Podcast',
    social: 'Publicação social',
};
