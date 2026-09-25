import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { MediaPlayer } from './media-player';
import type { Post } from '@/types/cms';

describe('MediaPlayer', () => {
    it('renders application/ogg podcasts with an audio player', () => {
        const post: Post = {
            id: 1,
            title: 'Vozes do território',
            slug: 'vozes-do-territorio',
            type: 'podcast',
            status: 'published',
            video_url: 'https://azonsocial.org.br/storage/episodio.ogg',
            video_mime_type: 'application/ogg',
            updated_at: '2026-09-25T12:00:00Z',
        };

        const html = renderToStaticMarkup(<MediaPlayer post={post} />);

        expect(html).toContain('<audio');
        expect(html).not.toContain('<video');
        expect(html).toContain('type="application/ogg"');
    });
});
