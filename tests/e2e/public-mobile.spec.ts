import { expect, test } from '@playwright/test';

for (const path of ['/', '/eventos', '/calendario', '/midia']) {
    test(`${path} has no horizontal overflow on a phone`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('body')).toBeVisible();

        const dimensions = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(dimensions.scrollWidth).toBeLessThanOrEqual(
            dimensions.clientWidth + 1,
        );
    });
}

test('mobile navigation opens, closes and reaches the media library', async ({
    page,
}) => {
    await page.goto('/');

    const menu = page.locator('button[aria-controls="main-navigation"]');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(
        page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible();

    await page
        .getByRole('navigation', { name: 'Navegação principal' })
        .getByRole('link', { name: 'Mídia' })
        .click();
    await expect(page).toHaveURL(/\/midia$/);
    await expect(
        page.getByRole('heading', {
            name: 'Histórias para ver, ouvir e levar adiante.',
        }),
    ).toBeVisible();
});
