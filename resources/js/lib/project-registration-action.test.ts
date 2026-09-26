import { describe, expect, it } from 'vite-plus/test';
import { projectRegistrationAction } from './project-registration-action';
import type { Project } from '@/types/cms';

const project: Project = {
    id: 1,
    title: 'Lewa Orí',
    slug: 'lewa-ori',
    summary: 'Saúde mental',
    status: 'published',
    updated_at: '2026-09-26T00:00:00Z',
};

describe('projectRegistrationAction', () => {
    it('uses the internal registration path while applications are open', () => {
        expect(
            projectRegistrationAction({
                ...project,
                registration_enabled: true,
                registration_state: 'open',
                registration_type: 'internal',
            }),
        ).toEqual({
            kind: 'internal',
            url: '/projetos/lewa-ori/inscricao',
            label: 'Inscreva-se',
        });
    });

    it('falls back to contact when registration is unavailable', () => {
        expect(projectRegistrationAction(project)).toEqual({
            kind: 'contact',
            url: '#contato',
            label: 'Entrar em contato',
        });
    });
});
