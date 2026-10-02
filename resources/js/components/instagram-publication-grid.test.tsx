import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
    InstagramPublicationGrid,
    instagramPublicationExternalUrl,
    instagramPublicationMedia,
} from './instagram-publication-grid';
import type { InstagramPublication } from '@/types/instagram';

const publication: InstagramPublication = {
    id: 12,
    title: 'Projeto Aman',
    display_text: 'Cultivando o cuidado e a ancestralidade.',
    cover_url: '/social/aman.webp',
    external_url: 'https://www.instagram.com/p/exemplo/',
    published_at: '2026-09-18T12:00:00-03:00',
    source_type: 'automatic',
    provider_media_type: 'IMAGE',
    social_account: {
        id: 1,
        slug: 'azon.social',
        display_name: 'Instituto Azon Social',
        username: 'azon.social',
        group_key: null,
    },
};

describe('InstagramPublicationGrid', () => {
    it('renders the whole post as a dialog trigger without technical sync metadata', () => {
        const html = renderToStaticMarkup(
            <InstagramPublicationGrid
                publications={[publication]}
                eagerFirst
            />,
        );

        expect(html).toContain(
            'aria-label="Abrir publicação de @azon.social: Projeto Aman"',
        );
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain('loading="eager"');
        expect(html).toContain('Cultivando o cuidado e a ancestralidade.');
        expect(html).not.toContain('Sincronizada do Instagram');
        expect(html).not.toContain('18/09/2026');
        expect(html).not.toContain('<iframe');
    });

    it('prefers the locally stored cover for a single image', () => {
        expect(instagramPublicationMedia(publication)).toEqual([
            {
                id: '12-cover',
                type: 'image',
                url: '/social/aman.webp',
            },
        ]);
    });

    it('keeps every valid carousel item and uses the cover for its first image', () => {
        expect(
            instagramPublicationMedia({
                ...publication,
                provider_media_type: 'CAROUSEL_ALBUM',
                items: [
                    {
                        id: 8,
                        type: 'IMAGE',
                        media_url: 'https://cdn.example.test/first.webp',
                        thumbnail_url: null,
                    },
                    {
                        id: 9,
                        type: 'IMAGE',
                        media_url: '/social/second.webp',
                        thumbnail_url: null,
                    },
                ],
            }),
        ).toEqual([
            {
                id: 8,
                type: 'image',
                url: '/social/aman.webp',
            },
            {
                id: 9,
                type: 'image',
                url: '/social/second.webp',
            },
        ]);
    });

    it('defers a synchronized video to the modal and preserves its poster', () => {
        expect(
            instagramPublicationMedia({
                ...publication,
                provider_media_type: 'VIDEO',
                items: [
                    {
                        id: 15,
                        type: 'VIDEO',
                        media_url: 'https://cdn.example.test/video.mp4',
                        thumbnail_url: '/social/video-poster.webp',
                    },
                ],
            }),
        ).toEqual([
            {
                id: 15,
                type: 'video',
                url: 'https://cdn.example.test/video.mp4',
                thumbnailUrl: '/social/video-poster.webp',
            },
        ]);
    });

    it('only exposes HTTPS links for the real Instagram host', () => {
        expect(
            instagramPublicationExternalUrl(
                'https://www.instagram.com/p/exemplo/',
            ),
        ).toBe('https://www.instagram.com/p/exemplo/');
        expect(
            instagramPublicationExternalUrl(
                'https://instagram.com.evil.test/p/exemplo/',
            ),
        ).toBeNull();
        expect(
            instagramPublicationExternalUrl('javascript:alert(1)'),
        ).toBeNull();
        expect(
            instagramPublicationExternalUrl('http://instagram.com/p/exemplo/'),
        ).toBeNull();
    });
});
