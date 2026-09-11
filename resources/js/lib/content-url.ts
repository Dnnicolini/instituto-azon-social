import type { Post } from '@/types/cms';

type PublicContent = Pick<Post, 'slug' | 'type' | 'url'>;

export function contentUrl(content: PublicContent): string {
    if (content.url) return content.url;

    return content.type === 'article'
        ? `/noticias/${content.slug}`
        : `/midia/${content.slug}`;
}
