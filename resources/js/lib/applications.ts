import type {
    ApplicationAnswerValue,
    ApplicationField,
    PublicRegistration,
} from '@/types/applications';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
});

export function candidateStatusMessage(status?: string): string | null {
    if (!status) return null;
    if (status === 'verification-link-sent') {
        return 'Enviamos um novo link de confirmação para o seu e-mail.';
    }

    return status;
}

export function formatApplicationDate(
    value?: string | null,
    includeTime = false,
): string {
    if (!value) return 'Não informado';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data a confirmar';

    return (includeTime ? dateTimeFormatter : dateFormatter).format(date);
}

export function registrationStateMessage(
    registration: PublicRegistration,
): string {
    if (registration.state === 'not_started') {
        return registration.start_at
            ? `Inscrições abrem em ${formatApplicationDate(registration.start_at)}`
            : 'Inscrições ainda não iniciadas';
    }

    if (registration.state === 'open') {
        return registration.end_at
            ? `Inscrições abertas até ${formatApplicationDate(registration.end_at)}`
            : 'Inscrições abertas';
    }

    if (registration.state === 'limit_reached') {
        return 'Limite de inscrições atingido';
    }

    if (registration.state === 'disabled') {
        return 'Este projeto não recebe inscrições no momento';
    }

    return 'Inscrições encerradas';
}

export function isSafeExternalApplicationUrl(value?: string | null): boolean {
    if (!value) return false;

    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

export function isPresentationField(field: ApplicationField): boolean {
    return field.type === 'heading' || field.type === 'paragraph';
}

export function fieldErrorKey(field: ApplicationField): string {
    return ['file', 'image'].includes(field.type)
        ? `files.${field.identifier}`
        : `answers.${field.identifier}`;
}

export function formatAnswer(
    field: ApplicationField,
    value: ApplicationAnswerValue | undefined,
): string {
    if (value === null || value === undefined || value === '') {
        return 'Não informado';
    }

    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

    if (Array.isArray(value)) {
        const labels = value.map((item) => {
            const option = field.options?.find((candidate) =>
                typeof candidate === 'string'
                    ? candidate === item
                    : candidate.value === item,
            );
            return typeof option === 'string'
                ? option
                : (option?.label ?? item);
        });
        return labels.length ? labels.join(', ') : 'Não informado';
    }

    if (field.type === 'date') return formatApplicationDate(value);

    const option = field.options?.find((candidate) =>
        typeof candidate === 'string'
            ? candidate === value
            : candidate.value === value,
    );

    return typeof option === 'string' ? option : (option?.label ?? value);
}

export function isAnswerMissing(value: ApplicationAnswerValue | undefined) {
    if (Array.isArray(value)) return value.length === 0;
    return (
        value === null || value === undefined || value === '' || value === false
    );
}
