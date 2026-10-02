import { expect, test } from '@playwright/test';

for (const path of [
    '/',
    '/eventos',
    '/calendario',
    '/noticias',
    '/noticias/folhas-territorio-e-ancestralidade',
    '/midia',
    '/redes',
    '/pagina/azon-news',
    '/pagina/azon-podcast',
    '/pagina/hunkpame-azon-legidan',
    '/pagina/presente-de-iemanja-sepetiba',
]) {
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

test('the social feed keeps filters and cards readable on a phone', async ({
    page,
}) => {
    await page.goto('/redes');

    const accountFilter = page.getByLabel('Perfil');
    const groupFilter = page.getByLabel('Iniciativa');
    const applyButton = page.getByRole('button', {
        name: 'Aplicar filtros',
    });

    await expect(accountFilter).toBeVisible();
    await expect(groupFilter).toBeVisible();
    await expect(applyButton).toBeVisible();

    const [accountBox, groupBox, buttonBox] = await Promise.all([
        accountFilter.boundingBox(),
        groupFilter.boundingBox(),
        applyButton.boundingBox(),
    ]);

    expect(accountBox).not.toBeNull();
    expect(groupBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(groupBox!.y).toBeGreaterThan(accountBox!.y + accountBox!.height);
    expect(buttonBox!.width).toBeGreaterThan(300);

    const firstCard = page.getByRole('article').first();
    await expect(firstCard).toBeVisible();
    expect((await firstCard.boundingBox())!.width).toBeLessThanOrEqual(
        (await page.locator('main').boundingBox())!.width,
    );
});
