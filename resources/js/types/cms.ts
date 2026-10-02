import type { SeoData } from './seo';

export type ContentStatus =
    | 'draft'
    | 'review'
    | 'scheduled'
    | 'published'
    | 'archived';

export type ContentType = 'article' | 'vlog' | 'video' | 'podcast' | 'social';

export type MediaProvider =
    | 'instagram'
    | 'facebook'
    | 'youtube'
    | 'vimeo'
    | 'spotify'
    | 'tiktok'
    | 'linkedin'
    | 'anchor'
    | 'other';

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
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    path: string;
    links: PaginationLink[];
};

export type GalleryImage = {
    id: number;
    url: string;
    alt?: string | null;
    mime_type?: string | null;
    media_type?: 'image' | 'video';
    width?: number | null;
    height?: number | null;
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
    url?: string;
    type: ContentType;
    status: ContentStatus;
    excerpt?: string | null;
    body?: string | null;
    editorial_summary?: string | null;
    original_caption?: string | null;
    source_type?: 'automatic' | 'manual' | null;
    source_available?: boolean;
    cover_url?: string | null;
    cover_alt?: string | null;
    gallery_images?: GalleryImage[];
    project_ids?: number[];
    video_url?: string | null;
    video_name?: string | null;
    video_mime_type?: string | null;
    source_mode?: 'upload' | 'link' | null;
    provider?: MediaProvider | null;
    external_url?: string | null;
    duration_seconds?: number | null;
    is_featured?: boolean;
    sort_order?: number;
    published_at?: string | null;
    author?: string | null;
    updated_at: string;
};

export type Project = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    badge_label?: string | null;
    body?: string | null;
    status: ContentStatus;
    cover_url?: string | null;
    cover_alt?: string | null;
    gallery_images?: GalleryImage[];
    sort_order?: number;
    published_at?: string | null;
    registration_enabled?: boolean;
    registration_type?: RegistrationType | null;
    registration_title?: string | null;
    registration_description?: string | null;
    registration_instructions?: string | null;
    registration_start_at?: string | null;
    registration_end_at?: string | null;
    registration_max_applications?: number | null;
    registration_allow_editing?: boolean;
    registration_edit_deadline?: string | null;
    registration_requires_authentication?: boolean;
    registration_one_per_user?: boolean;
    registration_success_message?: string | null;
    registration_confirmation_message?: string | null;
    registration_url?: string | null;
    registration_button_label?: string | null;
    applications_count?: number;
    registration_state?: RegistrationState | null;
    registration_period_label?: string | null;
    updated_at: string;
};

export type RegistrationType = 'internal' | 'external';

export type RegistrationState =
    | 'not_started'
    | 'open'
    | 'closed'
    | 'limit_reached';

export type ApplicationStatus =
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'pending_documents'
    | 'approved'
    | 'rejected'
    | 'cancelled';

export type RegistrationFieldType =
    | 'short_text'
    | 'long_text'
    | 'email'
    | 'phone'
    | 'cpf'
    | 'cnpj'
    | 'date'
    | 'number'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'multiple_choice'
    | 'file'
    | 'image'
    | 'url'
    | 'acceptance'
    | 'heading'
    | 'paragraph';

export type ProjectRegistration = {
    enabled: boolean;
    type: RegistrationType | null;
    state: RegistrationState;
    can_apply: boolean;
    url?: string | null;
    title?: string | null;
    description?: string | null;
    instructions?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    max_applications?: number | null;
    allow_editing: boolean;
    edit_deadline?: string | null;
    requires_auth: boolean;
    one_per_user: boolean;
    success_message?: string | null;
    confirmation_message?: string | null;
    button_label: string;
};

export type ProjectRegistrationField = {
    id: number | string;
    type: RegistrationFieldType;
    label: string;
    identifier: string;
    description?: string | null;
    placeholder?: string | null;
    required: boolean;
    sort_order: number;
    options: string[];
    validations?: Record<string, string | number | boolean | null>;
    max_length?: number | null;
    allowed_mime_types?: string[];
    max_file_size_kb?: number | null;
    min_value?: number | null;
    max_value?: number | null;
};

export type RegistrationFormSource = {
    id: number;
    title: string;
};

export type RegistrationMetrics = {
    total: number;
    today: number;
    this_week: number;
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
};

export type ProjectApplicationSummary = {
    id: number;
    protocol: string;
    applicant_name: string;
    applicant_email?: string | null;
    applicant_cpf?: string | null;
    status: ApplicationStatus;
    status_label: string;
    project: { id: number; title: string; slug: string };
    submitted_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type ProjectApplication = ProjectApplicationSummary & {
    answers: Record<
        string,
        {
            field_id: number;
            label: string;
            type: RegistrationFieldType;
            value: string | string[] | boolean | null;
        }
    >;
    files: Array<{
        id: number;
        field_id: number;
        identifier: string;
        label: string;
        name: string;
        mime_type: string;
        size: number;
        url: string;
    }>;
    history: Array<{
        id: number;
        event: string;
        from_status?: ApplicationStatus | null;
        to_status?: ApplicationStatus | null;
        note?: string | null;
        user?: string | null;
        created_at: string;
    }>;
    can_edit: boolean;
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
    gallery_images?: GalleryImage[];
    project_ids?: number[];
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
    social_integration_id?: number | null;
    is_channel?: boolean;
    instagram_account?: {
        id: number;
        display_name: string;
        username: string;
    } | null;
    status: ContentStatus;
    body?: string | null;
    sections_count?: number;
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
    status: 'active' | 'pending' | 'disabled';
    disabled_at: string | null;
    capabilities: {
        update: boolean;
        delete: boolean;
        toggle_status: boolean;
        reset_password: boolean;
    };
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
    social: 'Postagem de rede social',
};

export const registrationStateLabels: Record<RegistrationState, string> = {
    not_started: 'Não iniciado',
    open: 'Aberto',
    closed: 'Encerrado',
    limit_reached: 'Limite atingido',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
    draft: 'Rascunho',
    submitted: 'Enviada',
    under_review: 'Em análise',
    pending_documents: 'Pendente de documentação',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada',
};

export const registrationFieldTypeLabels: Record<
    RegistrationFieldType,
    string
> = {
    short_text: 'Texto curto',
    long_text: 'Texto longo',
    email: 'E-mail',
    phone: 'Telefone',
    cpf: 'CPF',
    cnpj: 'CNPJ',
    date: 'Data',
    number: 'Número',
    select: 'Lista de seleção',
    radio: 'Escolha única',
    checkbox: 'Caixa de seleção',
    multiple_choice: 'Múltipla escolha',
    file: 'Arquivo',
    image: 'Imagem',
    url: 'URL/link',
    acceptance: 'Aceite/termo',
    heading: 'Título/separador',
    paragraph: 'Texto explicativo',
};
