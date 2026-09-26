import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { GalleryMediaItem } from './gallery-media-item';

describe('GalleryMediaItem', () => {
    it('renders saved videos with accessible playback controls', () => {
        const html = renderToStaticMarkup(
            <GalleryMediaItem
                media={{
                    id: 1,
                    url: '/storage/cms/videos/acao.mp4',
                    alt: 'Registro da ação comunitária',
                    mime_type: 'video/mp4',
                    media_type: 'video',
                }}
            />,
        );

        expect(html).toContain('<video');
        expect(html).toContain('controls=""');
        expect(html).toContain('type="video/mp4"');
        expect(html).toContain('Registro da ação comunitária');
    });
});
