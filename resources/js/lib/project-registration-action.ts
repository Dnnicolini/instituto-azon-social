import { isSafeExternalApplicationUrl } from '@/lib/applications';
import type { Project } from '@/types/cms';

export type ProjectRegistrationAction = {
    kind: 'external' | 'internal' | 'contact';
    url: string;
    label: string;
};

export function projectRegistrationAction(
    project: Project,
): ProjectRegistrationAction {
    const label = project.registration_button_label?.trim() || 'Inscreva-se';
    const registrationUrl = project.registration_url;

    if (project.registration_enabled && project.registration_state === 'open') {
        if (
            project.registration_type === 'external' &&
            typeof registrationUrl === 'string' &&
            isSafeExternalApplicationUrl(registrationUrl)
        ) {
            return {
                kind: 'external',
                url: registrationUrl,
                label,
            };
        }

        if (project.registration_type === 'internal') {
            return {
                kind: 'internal',
                url: `/projetos/${encodeURIComponent(project.slug)}/inscricao`,
                label,
            };
        }
    }

    return {
        kind: 'contact',
        url: '#contato',
        label: 'Entrar em contato',
    };
}
