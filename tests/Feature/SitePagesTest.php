<?php

use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config([
        'app.url' => 'https://instituto-azon-social.dnnicolini.chatgpt.site',
        'inertia.ssr.enabled' => false,
    ]);
});

it('renders the institutional home with complete SEO data', function (): void {
    $response = $this->get(route('home'));

    $response->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('home')
        ->where('seo.title', 'Instituto Azon Social | Ancestralidade, cuidado e transformação')
        ->where('seo.canonical', 'https://instituto-azon-social.dnnicolini.chatgpt.site/')
        ->where('seo.robots', 'index, follow, max-image-preview:large')
        ->has('seo.schema', 2));

    $response
        ->assertSee('<html lang="pt-BR">', false)
        ->assertSee('<title>Instituto Azon Social | Ancestralidade, cuidado e transformação</title>', false)
        ->assertSee('<meta name="description" content="Ações sociais, culturais e ambientais', false)
        ->assertSee('<link rel="canonical" href="https://instituto-azon-social.dnnicolini.chatgpt.site/">', false)
        ->assertSee('<meta property="og:site_name" content="Instituto Azon Social">', false)
        ->assertSee('<meta name="twitter:card" content="summary">', false)
        ->assertSee('"@type":"NGO"', false)
        ->assertSee('"@type":"WebSite"', false);
});

it('renders events with page-specific metadata and structured data', function (): void {
    $response = $this->get(route('events'));

    $response->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('events')
        ->where('seo.title', 'Eventos e inscrições | Instituto Azon Social')
        ->where('seo.canonical', 'https://instituto-azon-social.dnnicolini.chatgpt.site/eventos')
        ->where('seo.schema.2.@type', 'Event')
        ->where('seo.schema.2.startDate', '2026-08-29T09:00:00-03:00')
        ->where('seo.schema.2.location.name', 'Praça Américo Marçal')
        ->where('seo.schema.2.url', 'https://instituto-azon-social.dnnicolini.chatgpt.site/eventos#sabeje-2026')
        ->has('seo.schema', 3));

    $response
        ->assertSee('<title>Eventos e inscrições | Instituto Azon Social</title>', false)
        ->assertSee('<link rel="canonical" href="https://instituto-azon-social.dnnicolini.chatgpt.site/eventos">', false)
        ->assertSee('"@type":"CollectionPage"', false)
        ->assertSee('"@type":"Event"', false);
});

it('keeps demonstration admin pages out of search indexes', function (string $routeName, string $component): void {
    $this->get(route($routeName))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertSee('<meta name="robots" content="noindex, nofollow">', false)
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component($component)
            ->where('seo.robots', 'noindex, nofollow'));
})->with([
    ['admin.login', 'admin/login'],
    ['admin.dashboard', 'admin/dashboard'],
]);

it('serves robots rules and points crawlers to the sitemap', function (): void {
    $this->get(route('robots'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertDontSeeText('Disallow: /admin')
        ->assertSeeText('Sitemap: https://instituto-azon-social.dnnicolini.chatgpt.site/sitemap.xml');
});

it('serves a sitemap with only public indexable pages', function (): void {
    $response = $this->get(route('sitemap'));

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/', false)
        ->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/eventos', false)
        ->assertDontSee('<lastmod>', false)
        ->assertDontSee('/admin', false);

    expect(substr_count($response->getContent(), '<url>'))->toBe(2);
});
