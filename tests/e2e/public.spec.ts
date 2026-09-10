import { expect, test } from '@playwright/test';

test('public content, navigation and SEO are available', async ({ page }) => {
    await page.goto('/');

    await expect(
        page.getByRole('heading', { name: /Ancestralidade que cuida/i }),
    ).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /\/$/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /index, follow/,
    );

    await page.getByRole('link', { name: 'Eventos' }).first().click();
    await expect(page).toHaveURL(/\/eventos$/);
    await expect(
        page.getByRole('heading', { name: /Encontros que fortalecem/i }),
    ).toBeVisible();
    await expect(page.getByText('Sabeje Sepetiba 2026')).toBeVisible();
});

test('media library exposes the requested formats and a real empty state', async ({
    page,
}) => {
    await page.goto('/midia');

    await expect(
        page.getByRole('heading', {
            name: 'Histórias para ver, ouvir e levar adiante.',
        }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vlogs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vídeos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Podcasts' })).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Nenhum conteúdo encontrado' }),
    ).toBeVisible();

    await page
        .getByRole('searchbox', { name: 'Buscar na biblioteca' })
        .fill('Axé');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page).toHaveURL(/search=Ax%C3%A9/);
});

test('contact form validates and persists a message', async ({ page }) => {
    await page.goto('/#contato');

    const form = page.locator('#contato form');
    await form.getByLabel('Nome').fill('Pessoa de QA');
    await form.getByLabel('E-mail').fill('qa@example.org');
    await form.getByLabel('Assunto').selectOption({ label: 'Parceria' });
    await form
        .getByLabel('Mensagem')
        .fill('Gostaria de conversar sobre uma parceria comunitária.');
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();

    await expect(
        form.getByText('Mensagem enviada. A equipe entrará em contato.'),
    ).toBeVisible();
});

test('admin is private and authentication is not indexable', async ({
    page,
}) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
        page.getByRole('heading', { name: 'Entre no painel' }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, nofollow',
    );
});
