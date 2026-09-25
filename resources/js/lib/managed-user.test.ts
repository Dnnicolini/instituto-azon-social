import { describe, expect, it } from 'vite-plus/test';
import { managedUserStatuses } from './managed-user';

describe('managed user presentation', () => {
    it('nomeia todos os estados de acesso em linguagem humana', () => {
        expect(managedUserStatuses.active.label).toBe('Ativo');
        expect(managedUserStatuses.pending.label).toBe('Convite pendente');
        expect(managedUserStatuses.disabled.label).toBe('Desativado');
    });
});
