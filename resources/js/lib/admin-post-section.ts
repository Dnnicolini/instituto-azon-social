import type { ContentType } from '@/types/cms';

export type PostSection = 'article' | 'media' | 'social';

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
    article: {
        title: 'Artigos',
        description: 'Gerencie somente notícias, histórias e artigos do site.',
        createLabel: 'Novo artigo',
        emptyTitle: 'Nenhum artigo encontrado',
        emptyDescription: 'Ajuste os filtros ou crie o primeiro artigo.',
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
        description:
            'Gerencie postagens do Instagram, Facebook e outras redes exibidas no site.',
        createLabel: 'Nova postagem de rede social',
        emptyTitle: 'Nenhuma postagem de rede social encontrada',
        emptyDescription:
            'Ajuste os filtros ou adicione a primeira postagem de rede social.',
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
    return section === 'article'
        ? `/admin/posts/${id}/edit`
        : `/admin/posts/${id}/edit?section=${section}`;
}

export function typesForSection(section: PostSection): ContentType[] {
    if (section === 'media') return ['vlog', 'video', 'podcast'];
    if (section === 'social') return ['social'];
    return ['article'];
}
