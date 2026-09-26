import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { ContentGallery } from './content-gallery';

describe('ContentGallery', () => {
    it('uses the contained single-media presentation without dropping old data', () => {
        const html = renderToStaticMarkup(
            <ContentGallery
                items={[
                    {
                        id: 1,
                        url: '/storage/cartaz.webp',
                        alt: 'Cartaz da ação comunitária',
                        mime_type: 'image/webp',
                        media_type: 'image',
                        width: 800,
                        height: 1200,
                    },
                ]}
            />,
        );

        expect(html).toContain('content-gallery is-single');
        expect(html).toContain('class="is-portrait"');
        expect(html).toContain('Abrir Cartaz da ação comunitária');
        expect(html).toContain('content-lightbox');
    });

    it('uses the thumbnail grid for multiple media items', () => {
        const html = renderToStaticMarkup(
            <ContentGallery
                items={[
                    {
                        id: 1,
                        url: '/storage/foto.webp',
                        media_type: 'image',
                    },
                    {
                        id: 2,
                        url: '/storage/video.mp4',
                        mime_type: 'video/mp4',
                        media_type: 'video',
                    },
                ]}
            />,
        );

        expect(html).toContain('content-gallery is-grid');
        expect(html).toContain('Reproduzir vídeo');
        expect(html).toContain('<figcaption>Imagem 1</figcaption>');
    });
});
