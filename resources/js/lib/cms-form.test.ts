import { describe, expect, it } from 'vite-plus/test';
import { humanizeIdentifier, slugifyTitle } from './cms-form';

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

describe('humanizeIdentifier', () => {
    it('não expõe separadores técnicos na interface', () => {
        expect(humanizeIdentifier('content_editor')).toBe('Content editor');
    });
});
