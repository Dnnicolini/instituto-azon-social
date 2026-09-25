import type { ContentStatus } from '@/types/cms';

export function slugifyTitle(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function humanizeIdentifier(value: string): string {
    const normalized = value.replace(/[._-]+/g, ' ').trim();

    return normalized
        ? normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1)
        : 'Campo';
}

export function focusFirstFormError(formId: string): void {
    window.requestAnimationFrame(() => {
        const form = document.getElementById(formId);
        const target =
            form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
            form?.querySelector<HTMLElement>('.cms-error-summary');

        target?.focus();
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

const publicationIntents: ContentStatus[] = [
    'draft',
    'review',
    'scheduled',
    'published',
    'archived',
];

export function normalizePublicationIntent(
    value: string | undefined,
    fallback: ContentStatus,
    canPublish: boolean,
): ContentStatus {
    const intent = value as ContentStatus | undefined;

    if (!intent || !publicationIntents.includes(intent)) {
        return fallback;
    }

    if (!canPublish && ['scheduled', 'published'].includes(intent)) {
        return 'review';
    }

    return intent;
}
