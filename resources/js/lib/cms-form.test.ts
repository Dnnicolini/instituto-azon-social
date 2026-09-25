import { describe, expect, it } from 'vite-plus/test';
import {
    humanizeIdentifier,
    normalizePublicationIntent,
    slugifyTitle,
} from './cms-form';

describe('slugifyTitle', () => {
    it('normaliza acentos, espaços e pontuação para uma URL legível', () => {
        expect(slugifyTitle('Ação & Saúde: edição 2026!')).toBe(
            'acao-saude-edicao-2026',
        );
    });

    it('remove separadores das extremidades', () => {
        expect(slugifyTitle('  -- Projeto Azon --  ')).toBe('projeto-azon');
    });
});

describe('normalizePublicationIntent', () => {
    it('uses the button intent for allowed publication actions', () => {
        expect(normalizePublicationIntent('draft', 'published', true)).toBe(
            'draft',
        );
        expect(normalizePublicationIntent('scheduled', 'draft', true)).toBe(
            'scheduled',
        );
        expect(normalizePublicationIntent('published', 'draft', true)).toBe(
            'published',
        );
    });

    it('sends restricted publication actions to review', () => {
        expect(normalizePublicationIntent('published', 'draft', false)).toBe(
            'review',
        );
        expect(normalizePublicationIntent('scheduled', 'draft', false)).toBe(
            'review',
        );
    });

    it('preserves the current status when no valid action is submitted', () => {
        expect(normalizePublicationIntent(undefined, 'archived', true)).toBe(
            'archived',
        );
        expect(normalizePublicationIntent('invalid', 'review', true)).toBe(
            'review',
        );
    });
});

describe('humanizeIdentifier', () => {
    it('não expõe separadores técnicos na interface', () => {
        expect(humanizeIdentifier('content_editor')).toBe('Content editor');
    });
});
