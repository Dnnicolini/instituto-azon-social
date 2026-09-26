import type { Event, GalleryImage, Paginated, Post } from '@/types/cms';
import type { SeoData } from '@/types/seo';

/**
 * Public applications Inertia contract.
 *
 * Pages:
 * - projects/show: { seo, project, registration, viewer }
 * - projects/apply: { seo, project, registration, viewer, form, application?, confirmation? }
 * - applications/index: { seo, applications }
 * - applications/show: { seo, application }
 *
 * Mutations:
 * - POST /projetos/{slug}/inscricao
 * - POST /minhas-inscricoes/{id} with `_method=put` for multipart edits
 *
 * The payload separates scalar answers from uploaded files:
 * `{ answers: Record<identifier, value>, files: Record<identifier, File|null>, submit: boolean }`.
 */

export type RegistrationState =
    | 'disabled'
    | 'not_started'
    | 'open'
    | 'closed'
    | 'limit_reached';

export type RegistrationType = 'internal' | 'external';

export type ApplicationStatus =
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'pending_documents'
    | 'approved'
    | 'rejected'
    | 'cancelled';

export type ApplicationFieldType =
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

export type ApplicationAnswerValue = string | string[] | boolean | null;

export type ApplicationFieldOption =
    | string
    | {
          value: string;
          label: string;
      };

export type ApplicationFieldValidation = {
    min?: number | null;
    max?: number | null;
    max_length?: number | null;
    max_size_mb?: number | null;
    accepted_mime_types?: string[];
};

export type ApplicationField = {
    id: number;
    identifier: string;
    type: ApplicationFieldType;
    label: string;
    description?: string | null;
    placeholder?: string | null;
    required: boolean;
    options?: ApplicationFieldOption[];
    validation?: ApplicationFieldValidation | null;
    validations?: string[] | null;
    max_length?: number | null;
    allowed_mime_types?: string[];
    max_file_size_kb?: number | null;
    min_value?: number | string | null;
    max_value?: number | string | null;
};

export type ApplicationFormDefinition = {
    id: number;
    title?: string | null;
    description?: string | null;
    fields: ApplicationField[];
};

export type PublicRegistration = {
    enabled: boolean;
    type?: RegistrationType | null;
    state: RegistrationState;
    state_label?: string | null;
    title?: string | null;
    description?: string | null;
    instructions?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    max_applications?: number | null;
    remaining_spots?: number | null;
    button_label?: string | null;
    url?: string | null;
    requires_auth: boolean;
    allow_editing: boolean;
    edit_deadline?: string | null;
    success_message?: string | null;
    can_apply: boolean;
};

export type ApplicationFile = {
    id: number;
    identifier: string;
    label: string;
    name: string;
    mime_type?: string | null;
    size?: number | null;
    url: string;
};

export type ApplicationHistoryItem = {
    id: number;
    event: string;
    from_status?: string | null;
    to_status?: string | null;
    note?: string | null;
    created_at: string;
};

export type ProjectApplication = {
    id: number;
    protocol?: string | null;
    status: ApplicationStatus;
    status_label: string;
    project: PublicProjectSummary;
    answers: Record<string, ApplicationAnswer>;
    files: ApplicationFile[];
    history?: ApplicationHistoryItem[];
    can_edit: boolean;
    submitted_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type ApplicationAnswer = {
    field_id: number;
    label: string;
    type: ApplicationFieldType;
    value: ApplicationAnswerValue;
};

export type PublicProjectSummary = {
    id: number;
    title: string;
    slug: string;
};

export type PublicProject = PublicProjectSummary & {
    summary: string;
    body?: string | null;
    badge_label?: string | null;
    cover_url?: string | null;
    cover_alt?: string | null;
    gallery_images?: GalleryImage[];
    related_posts?: RelatedProjectPost[];
    related_events?: RelatedProjectEvent[];
};

export type RelatedProjectPost = Pick<
    Post,
    | 'id'
    | 'title'
    | 'slug'
    | 'url'
    | 'type'
    | 'excerpt'
    | 'cover_url'
    | 'cover_alt'
    | 'published_at'
>;

export type RelatedProjectEvent = Pick<
    Event,
    | 'id'
    | 'title'
    | 'slug'
    | 'summary'
    | 'starts_at'
    | 'ends_at'
    | 'date_label'
    | 'location'
    | 'cover_url'
    | 'cover_alt'
>;

export type ApplicationListItem = Pick<
    ProjectApplication,
    | 'id'
    | 'protocol'
    | 'status'
    | 'status_label'
    | 'project'
    | 'can_edit'
    | 'submitted_at'
    | 'created_at'
    | 'updated_at'
> & {
    show_url?: string | null;
    registration_ends_at?: string | null;
};

export type ApplicationViewer = {
    id: number;
    name: string;
    email: string;
    authenticated?: boolean;
    my_applications_url?: string;
};

export type ApplicationConfirmation = {
    protocol: string;
    message?: string | null;
    submitted_at: string;
    show_url?: string | null;
};

export type PublicPageSeo = Partial<SeoData> & Pick<SeoData, 'title'>;

export type ProjectShowProps = {
    seo: PublicPageSeo;
    project: PublicProject;
    registration?: PublicRegistration | null;
    viewer?: ApplicationViewer | null;
    related_posts?: RelatedProjectPost[];
    related_events?: RelatedProjectEvent[];
};

export type ProjectApplyProps = ProjectShowProps & {
    registration: PublicRegistration;
    form: ApplicationFormDefinition;
    application?: ProjectApplication | null;
    confirmation?: ApplicationConfirmation | null;
};

export type ApplicationsIndexProps = {
    seo: PublicPageSeo;
    applications: Paginated<ApplicationListItem>;
};

export type ApplicationShowProps = {
    seo: PublicPageSeo;
    application: ProjectApplication;
    form?: ApplicationFormDefinition | null;
    flash?: { success?: string; error?: string };
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
    draft: 'Rascunho',
    submitted: 'Enviada',
    under_review: 'Em análise',
    pending_documents: 'Documentação pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada',
};
