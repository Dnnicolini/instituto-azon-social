import type { ManagedUser } from '@/types/cms';

export const managedUserStatuses: Record<
    ManagedUser['status'],
    { label: string; description: string }
> = {
    active: {
        label: 'Ativo',
        description: 'Pode acessar o sistema.',
    },
    pending: {
        label: 'Convite pendente',
        description: 'Ainda precisa definir a senha.',
    },
    disabled: {
        label: 'Desativado',
        description: 'O acesso está temporariamente bloqueado.',
    },
};
