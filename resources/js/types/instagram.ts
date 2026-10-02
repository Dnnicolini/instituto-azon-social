export type InstagramConnectionStatus =
    | 'connected'
    | 'disconnected'
    | 'paused'
    | 'expired'
    | 'error'
    | 'pending';

export type InstagramDisplayLocation =
    | 'home'
    | 'social_feed'
    | 'azon_news'
    | 'azon_cast'
    | 'hunkpame'
    | 'presente';

export type InstagramAccount = {
    id: number;
    slug: string;
    display_name: string;
    expected_username: string;
    username?: string | null;
    description?: string | null;
    group_key?: string | null;
    display_locations: InstagramDisplayLocation[];
    sort_order: number;
    status: InstagramConnectionStatus;
    enabled: boolean;
    public_enabled: boolean;
    auto_publish: boolean;
    last_success_at?: string | null;
    last_error?: string | null;
    imported_count: number;
    connected: boolean;
    can_connect: boolean;
    pages?: Array<{ id: number; title: string; slug: string }>;
};

export type PublicInstagramAccount = Pick<
    InstagramAccount,
    'id' | 'slug' | 'display_name' | 'username' | 'group_key'
>;

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL';

export type InstagramPublication = {
    id: number;
    title?: string | null;
    display_text?: string | null;
    cover_url?: string | null;
    provider_media_type?: InstagramMediaType | null;
    external_url?: string | null;
    published_at?: string | null;
    source_type: 'automatic' | 'manual';
    social_account: PublicInstagramAccount;
    items?: Array<{
        id?: number;
        type: InstagramMediaType;
        media_url: string | null;
        thumbnail_url: string | null;
    }>;
};

export type InstagramPublicationPage = {
    data: InstagramPublication[];
    current_page: number;
    last_page: number;
    next_page_url?: string | null;
    total?: number;
};

export type InstagramGroupOption = {
    value: string;
    label: string;
};

export type InstagramFeedFilters = {
    account?: string;
    group?: string;
};
