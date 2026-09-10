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

test('institutional pillars and founder presentation are visible', async ({
    page,
}) => {
    await page.goto('/');

    await expect(
        page.getByRole('heading', {
            name: 'Cuidar das pessoas também é preservar nossas raízes.',
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Cuidado Coletivo' }),
    ).toBeVisible();
    await expect(page.locator('.value-card-top svg')).toHaveCount(3);
    await expect(page.locator('.value-card-top span').first()).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
    );
    const iconRightGap = await page
        .locator('.value-card-top')
        .first()
        .evaluate((element) => {
            const parent = element.getBoundingClientRect();
            const icon = element.querySelector('span')?.getBoundingClientRect();

            return icon ? parent.right - icon.right : 99;
        });
    expect(iconRightGap).toBeLessThanOrEqual(1);
    await expect(
        page.getByRole('heading', { name: 'Doté Rodrigo D’ Avimaje' }),
    ).toBeVisible();
    await expect(
        page.getByText(/é o idealizador do Instituto Azon Social/i),
    ).toBeVisible();
    await expect(
        page.getByRole('img', { name: 'Doté Rodrigo D’ Avimaje' }),
    ).toHaveAttribute('src', '/dote-rodrigo.webp');
    await expect(
        page.getByText(/presidente do Presente de Yamanjá de Sepetiba/i),
    ).toBeVisible();
    await page.goto('/eventos');
    await expect(
        page.getByRole('img', { name: 'Logomarca do Instituto Azon Social' }),
    ).toHaveAttribute('src', '/azon-social-logo-v2.webp');
    await expect(page.locator('#transparencia')).toHaveCount(0);
    await expect(page.locator('.participate-featured img')).toHaveCount(0);
});

test('calendar exposes CRM events, details and participation guidance', async ({
    page,
}) => {
    await page.goto('/calendario');

    await expect(
        page.getByRole('heading', { name: 'Calendário', exact: true }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: /agosto de 2026/i }),
    ).toBeVisible();
    const eventButton = page.getByRole('button', {
        name: /Ver detalhes de Sabeje Sepetiba 2026.*29 de agosto de 2026/i,
    });
    await eventButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
        dialog.getByRole('heading', { name: 'Sabeje Sepetiba 2026' }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('heading', { name: 'Mais detalhes' }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('heading', { name: 'Como participar' }),
    ).toBeVisible();
    await expect(dialog.getByText('Praça Américo Marçal')).toBeVisible();
    await page.keyboard.press('Shift+Tab');
    await expect(
        dialog.getByRole('link', { name: 'Falar com a equipe →' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
        dialog.getByRole('button', { name: 'Fechar detalhes do evento' }),
    ).toBeFocused();
    await page.evaluate(() =>
        document.documentElement.setAttribute('data-a11y-dark-theme', ''),
    );
    await expect(dialog).toHaveCSS('background-color', 'rgb(23, 21, 18)');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(eventButton).toBeFocused();

    await expect(
        page.getByRole('heading', {
            name: 'Inscrições e atividades contínuas',
        }),
    ).toBeVisible();
});

test('calendar remains usable without horizontal overflow on a phone', async ({
    page,
}) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/calendario');

    await expect(page.locator('.calendar-grid-shell')).toBeHidden();
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page
        .getByRole('button', { name: /Sabeje Sepetiba 2026.*29 de agosto/i })
        .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const bounds = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, viewport: innerWidth };
    });
    expect(bounds.width).toBeLessThanOrEqual(bounds.viewport);
});

test('calendar returns focus to the visible event after a responsive layout change', async ({
    page,
}) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('/calendario');

    await page
        .getByRole('button', { name: /Sabeje Sepetiba 2026.*29 de agosto/i })
        .click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    await page.keyboard.press('Escape');

    await expect(
        page.getByRole('button', {
            name: /Sabeje Sepetiba 2026.*29 de agosto/i,
        }),
    ).toBeFocused();
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

test('social publications open an accessible preview and link to Instagram', async ({
    page,
}) => {
    await page.goto('/#redes-sociais');

    await expect(
        page.getByRole('heading', { name: 'Acompanhe nossas redes sociais' }),
    ).toBeVisible();
    const publicationImage = page.getByRole('img', {
        name: /Publicação do projeto Lewa Orí/i,
    });
    await expect(publicationImage).toBeVisible();
    await expect(publicationImage).toHaveAttribute(
        'src',
        '/social/instagram-lewa-ori.webp',
    );
    await page
        .getByRole('button', { name: /Abrir prévia: Projeto Lewa Orí/i })
        .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
        dialog.getByRole('img', {
            name: /Publicação do projeto Lewa Orí/i,
        }),
    ).toHaveAttribute('src', '/social/instagram-lewa-ori.webp');
    await expect(
        dialog.getByRole('link', { name: 'Ver no Instagram ↗' }),
    ).toHaveAttribute('target', '_blank');
    await expect(dialog.locator('.social-dialog-caption')).toContainText(
        'Contando com a colaboração voluntária',
    );

    const centering = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();

        return {
            horizontal: Math.abs(rect.left + rect.width / 2 - innerWidth / 2),
            vertical: Math.abs(rect.top + rect.height / 2 - innerHeight / 2),
        };
    });
    expect(centering.horizontal).toBeLessThan(3);
    expect(centering.vertical).toBeLessThan(3);

    await dialog.getByRole('button', { name: 'Fechar prévia' }).click();
    await expect(dialog).not.toBeVisible();
});

test('AYI GBE and Hunto projects expose their new artwork and details', async ({
    page,
}) => {
    await page.goto('/#projetos');

    await expect(page.getByRole('heading', { name: 'AYI GBÈ' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Huntó' })).toBeVisible();
    await expect(
        page.getByRole('img', {
            name: 'AYI GBÈ — Saúde preventiva e cuidado com o corpo',
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('img', { name: 'Huntó — Mestres dos Saberes' }),
    ).toBeVisible();
    await expect(page.getByText('Corpo & saúde integral')).toBeVisible();
    await expect(
        page.getByRole('img', {
            name: 'AYI GBÈ — Saúde preventiva e cuidado com o corpo',
        }),
    ).toHaveCSS('object-fit', 'contain');

    await page
        .getByRole('button', { name: 'Conhecer projeto AYI GBÈ' })
        .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
        dialog.getByText('Saúde que começa no cuidado com a vida'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar projeto' }).click();
    await expect(dialog).not.toBeVisible();
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

test('accessibility controls apply and restore user preferences', async ({
    page,
}) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'Ir para o conteúdo' });
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
    await page.getByRole('button', { name: 'Acessibilidade' }).click();
    await page.getByRole('button', { name: 'Alto contraste' }).click();
    await expect(page.locator('html')).toHaveAttribute(
        'data-a11y-high-contrast',
        '',
    );
    await page
        .getByRole('button', { name: 'Aumentar tamanho do texto' })
        .click();
    await expect(page.getByText('110%', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Restaurar configurações/ }).click();
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-a11y-high-contrast',
        '',
    );
    await expect(page.getByText('100%', { exact: true })).toBeVisible();
});

test('mobile accessibility can read a chosen part and keeps controls centered', async ({
    page,
}) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.addInitScript(() => {
        const speechWindow = window as typeof window & { __spoken: string[] };
        speechWindow.__spoken = [];
        window.speechSynthesis.cancel = () => undefined;
        window.speechSynthesis.resume = () => undefined;
        window.speechSynthesis.getVoices = () => [];
        window.speechSynthesis.speak = (utterance) => {
            speechWindow.__spoken.push(utterance.text);
        };
    });
    await page.goto('/');

    const brandLeft = await page
        .locator('.site-header > .brand')
        .evaluate((element) => {
            const rect = element.getBoundingClientRect();

            return rect.left;
        });
    expect(brandLeft).toBeLessThanOrEqual(24);

    await page.getByRole('button', { name: 'Acessibilidade' }).click();
    const panel = page.locator('#accessibility-panel');
    await expect(panel).toBeVisible();
    const panelCenter = await panel.evaluate((element) => {
        const rect = element.getBoundingClientRect();

        return Math.abs(rect.left + rect.width / 2 - innerWidth / 2);
    });
    expect(panelCenter).toBeLessThanOrEqual(1);

    const firstOption = panel.getByRole('button', { name: 'Alto contraste' });
    const iconAlignment = await firstOption.evaluate((button) => {
        const buttonRect = button.getBoundingClientRect();
        const iconRect = button
            .querySelector('.accessibility-option-icon')
            ?.getBoundingClientRect();

        return iconRect
            ? Math.abs(
                  iconRect.top +
                      iconRect.height / 2 -
                      (buttonRect.top + buttonRect.height / 2),
              )
            : 99;
    });
    expect(iconAlignment).toBeLessThanOrEqual(1);

    await panel
        .getByRole('button', { name: 'Escolher parte para ouvir' })
        .click();
    await expect(
        page.getByText('Toque no texto ou na imagem que deseja ouvir.'),
    ).toBeVisible();
    await page
        .getByRole('heading', { name: /Ancestralidade que cuida/i })
        .click();

    const spoken = await page.evaluate(
        () => (window as typeof window & { __spoken: string[] }).__spoken,
    );
    expect(spoken.join(' ')).toContain('Ancestralidade que cuida');
    await expect(page.getByRole('button', { name: 'Lendo…' })).toBeVisible();
});

test('larger accessibility text remains responsive on a phone', async ({
    page,
}) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Acessibilidade' }).click();
    await page
        .getByRole('button', { name: 'Aumentar tamanho do texto' })
        .click();
    await page
        .getByRole('button', { name: 'Aumentar tamanho do texto' })
        .click();

    await expect(page.getByText('120%', { exact: true })).toBeVisible();
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
});

for (const width of [360, 768, 1280]) {
    test(`public and login layouts do not overflow at ${width}px`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const path of ['/', '/admin/login']) {
            await page.goto(path);
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth,
            );
            expect(overflow).toBeLessThanOrEqual(1);

            if (path === '/') {
                const brandLeft = await page
                    .locator('.site-header > .brand')
                    .evaluate((element) => {
                        return element.getBoundingClientRect().left;
                    });
                expect(brandLeft).toBeLessThan(width * 0.15);

                const footerBrandLeft = await page
                    .locator('footer .footer-brand')
                    .evaluate((element) => {
                        return element.getBoundingClientRect().left;
                    });
                expect(footerBrandLeft).toBeLessThan(width * 0.15);
            }
        }
    });
}
