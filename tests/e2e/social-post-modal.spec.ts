import { expect, test } from '@playwright/test';
import type { InstagramPublication } from '../../resources/js/types/instagram';

function publication(
    id: number,
    title: string,
    overrides: Partial<InstagramPublication> = {},
): InstagramPublication {
    return {
        id,
        title,
        display_text: `Legenda completa: ${title}`,
        source_type: 'automatic',
        provider_media_type: 'IMAGE',
        cover_url: '/social/instagram-lewa-ori.webp',
        external_url: `https://www.instagram.com/p/post-${id}/`,
        published_at: '2026-09-18T12:00:00-03:00',
        social_account: {
            id: 1,
            slug: 'azon.social',
            display_name: 'Instituto Azon Social',
            username: 'azon.social',
            group_key: null,
        },
        ...overrides,
    };
}

test.beforeEach(async ({ page }) => {
    await page.route('**/api/instagram/publicacoes?*', async (route) => {
        await route.fulfill({
            json: {
                data: [
                    publication(950, 'Vídeo sincronizado', {
                        provider_media_type: 'VIDEO',
                        items: [
                            {
                                id: 950,
                                type: 'VIDEO',
                                media_url: '/qa-video.mp4',
                                thumbnail_url:
                                    '/social/instagram-lewa-ori.webp',
                            },
                        ],
                    }),
                    publication(951, 'Carrossel sincronizado', {
                        provider_media_type: 'CAROUSEL_ALBUM',
                        items: [
                            {
                                id: 951,
                                type: 'IMAGE',
                                media_url: '/social/instagram-lewa-ori.webp',
                                thumbnail_url: null,
                            },
                            {
                                id: 952,
                                type: 'IMAGE',
                                media_url: '/azon-social-logo-v2.webp',
                                thumbnail_url: null,
                            },
                        ],
                    }),
                ],
                current_page: 1,
                last_page: 1,
            },
        });
    });
    await page.goto('/redes');
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();
});

test('opens a complete video post and restores focus when it closes', async ({
    page,
}) => {
    const trigger = page.getByRole('button', {
        name: 'Abrir publicação de @azon.social: Vídeo sincronizado',
    });

    await expect(trigger).toBeVisible();
    const mediaBox = await trigger.locator('.social-card-media').boundingBox();
    const copyBox = await trigger.locator('.social-card-copy').boundingBox();
    expect(mediaBox).not.toBeNull();
    expect(copyBox).not.toBeNull();
    expect(copyBox!.x).toBeGreaterThan(mediaBox!.x + mediaBox!.width - 2);
    await expect(page.getByText('Sincronizada do Instagram')).toHaveCount(0);
    await expect(page.getByText('18/09/2026')).toHaveCount(0);
    await trigger.focus();
    await trigger.press('Enter');

    const dialog = page.getByRole('dialog', {
        name: 'Vídeo sincronizado',
    });
    await expect(dialog).toBeVisible();
    await expect(
        dialog.getByRole('button', { name: 'Fechar publicação' }),
    ).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expect(
        dialog.getByText('Legenda completa: Vídeo sincronizado'),
    ).toBeVisible();

    const video = dialog.getByLabel(
        'Publicação de Instituto Azon Social: Vídeo sincronizado',
    );
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).not.toHaveAttribute('autoplay', '');
    await expect(page.locator('iframe')).toHaveCount(0);

    const source = dialog.getByRole('link', {
        name: /Ver publicação original no Instagram/,
    });
    await expect(source).toHaveAttribute('target', '_blank');
    await expect(source).toHaveAttribute('rel', 'noopener noreferrer');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('navigates a carousel inside the post modal', async ({ page }) => {
    const trigger = page.getByRole('button', {
        name: 'Abrir publicação de @azon.social: Carrossel sincronizado',
    });
    await trigger.click();

    const dialog = page.getByRole('dialog', {
        name: 'Carrossel sincronizado',
    });
    const media = dialog.getByRole('img', {
        name: 'Publicação de Instituto Azon Social: Carrossel sincronizado',
    });
    await expect(media).toHaveAttribute(
        'src',
        '/social/instagram-lewa-ori.webp',
    );
    await expect(dialog.getByText('1 de 2')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(media).toHaveAttribute('src', '/azon-social-logo-v2.webp');
    await expect(dialog.getByText('2 de 2')).toBeVisible();

    await dialog.getByRole('button', { name: 'Mídia anterior' }).click();
    await expect(media).toHaveAttribute(
        'src',
        '/social/instagram-lewa-ori.webp',
    );
});

test('keeps the modal usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page
        .getByRole('button', {
            name: 'Abrir publicação de @azon.social: Carrossel sincronizado',
        })
        .click();

    const dialog = page.getByRole('dialog', {
        name: 'Carrossel sincronizado',
    });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(390);
    await expect(
        dialog.getByRole('button', { name: 'Fechar publicação' }),
    ).toBeVisible();
});

test('preserves modal contrast in dark and high-contrast modes', async ({
    page,
}) => {
    const trigger = page.getByRole('button', {
        name: 'Abrir publicação de @azon.social: Vídeo sincronizado',
    });
    const html = page.locator('html');

    await html.evaluate((element) =>
        element.setAttribute('data-a11y-dark-theme', ''),
    );
    await trigger.click();

    const dialog = page.getByRole('dialog', {
        name: 'Vídeo sincronizado',
    });
    const inner = dialog.locator('.social-dialog-inner');
    const title = dialog.getByRole('heading', {
        name: 'Vídeo sincronizado',
    });
    await expect(inner).toHaveCSS('background-color', 'rgb(40, 36, 30)');
    await expect(title).toHaveCSS('color', 'rgb(248, 243, 232)');
    await page.keyboard.press('Escape');

    await html.evaluate((element) => {
        element.removeAttribute('data-a11y-dark-theme');
        element.setAttribute('data-a11y-high-contrast', '');
    });
    await trigger.click();
    await expect(inner).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(title).toHaveCSS('color', 'rgb(255, 255, 255)');
});
