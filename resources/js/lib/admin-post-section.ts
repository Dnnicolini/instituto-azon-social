import type { ContentType } from '@/types/cms';

export type PostSection = 'all' | 'media' | 'social';

export const postSectionContent: Record<
    PostSection,
    {
        title: string;
        description: string;
        createLabel: string;
        emptyTitle: string;
        emptyDescription: string;
    }
> = {
    all: {
        title: 'Conteúdos',
        description: 'Gerencie artigos e todos os formatos do fluxo editorial.',
        createLabel: 'Novo conteúdo',
        emptyTitle: 'Nenhum conteúdo encontrado',
        emptyDescription: 'Ajuste os filtros ou crie o primeiro conteúdo.',
    },
    media: {
        title: 'Mídia',
        description:
            'Gerencie vlogs, vídeos e podcasts publicados na biblioteca de mídia.',
        createLabel: 'Nova mídia',
        emptyTitle: 'Nenhuma mídia encontrada',
        emptyDescription:
            'Ajuste os filtros ou adicione o primeiro vídeo, vlog ou podcast.',
    },
    social: {
        title: 'Redes sociais',
        description: 'Gerencie as publicações do Instagram exibidas no site.',
        createLabel: 'Nova publicação',
        emptyTitle: 'Nenhuma publicação social encontrada',
        emptyDescription:
            'Ajuste os filtros ou adicione a primeira publicação do Instagram.',
    },
};

export function postIndexHref(section: PostSection): string {
    if (section === 'media') return '/admin/posts?type=media';
    if (section === 'social') return '/admin/posts?type=social';
    return '/admin/posts';
}

export function postCreateHref(section: PostSection): string {
    if (section === 'media') return '/admin/posts/create?type=media';
    if (section === 'social') return '/admin/posts/create?type=social';
    return '/admin/posts/create';
}

export function postEditHref(id: number, section: PostSection): string {
    return section === 'all'
        ? `/admin/posts/${id}/edit`
        : `/admin/posts/${id}/edit?section=${section}`;
}

export function typesForSection(section: PostSection): ContentType[] {
    if (section === 'media') return ['vlog', 'video', 'podcast'];
    if (section === 'social') return ['social'];
    return ['article', 'vlog', 'video', 'podcast', 'social'];
}
