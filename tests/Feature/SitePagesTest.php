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
        ->where('seo.title', 'Instituto Azon Social | Projetos sociais em Sepetiba, RJ')
        ->where('seo.canonical', 'https://instituto-azon-social.dnnicolini.chatgpt.site/')
        ->where('seo.robots', 'index, follow, max-image-preview:large')
        ->has('seo.schema', 2));

    $response
        ->assertHeader('Content-Security-Policy', "frame-ancestors 'self'")
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertSee('<html lang="pt-BR">', false)
        ->assertSee('<title data-inertia="title">Instituto Azon Social | Projetos sociais em Sepetiba, RJ</title>', false)
        ->assertSee('<meta data-inertia="description" name="description" content="Instituto social em Sepetiba', false)
        ->assertSee('<meta data-inertia="keywords" name="keywords" content="instituto social, projetos sociais em Sepetiba', false)
        ->assertSee('<link data-inertia="canonical" rel="canonical" href="https://instituto-azon-social.dnnicolini.chatgpt.site/">', false)
        ->assertSee('<meta data-inertia="og:site_name" property="og:site_name" content="Instituto Azon Social">', false)
        ->assertSee('<meta data-inertia="twitter:card" name="twitter:card" content="summary">', false)
        ->assertSee('<meta data-inertia="og:image:width" property="og:image:width" content="1200">', false)
        ->assertSee('"@type":"NGO"', false)
        ->assertSee('"@type":"WebSite"', false);
});

it('renders events with page-specific metadata and structured data', function (): void {
    $response = $this->get(route('events'));

    $response->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('events')
        ->where('seo.title', 'Eventos e inscrições | Instituto Azon Social')
        ->where('seo.canonical', 'https://instituto-azon-social.dnnicolini.chatgpt.site/eventos')
        ->has('events.data', 0)
        ->has('seo.schema', 2));

    $response
        ->assertSee('<title data-inertia="title">Eventos e inscrições | Instituto Azon Social</title>', false)
        ->assertSee('<link data-inertia="canonical" rel="canonical" href="https://instituto-azon-social.dnnicolini.chatgpt.site/eventos">', false)
        ->assertSee('"@type":"CollectionPage"', false)
        ->assertDontSee('"@type":"Event"', false);
});

it('renders the public calendar with indexable metadata', function (): void {
    $this->get(route('calendar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('calendar')
            ->where('seo.title', 'Calendário de ações | Instituto Azon Social')
            ->where('seo.canonical', 'https://instituto-azon-social.dnnicolini.chatgpt.site/calendario')
            ->has('events', 0)
            ->has('seo.schema', 2));
});

it('keeps authentication out of search indexes and blocks the admin dashboard', function (): void {
    $this->get(route('admin.login'))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertSee('<meta data-inertia="robots" name="robots" content="noindex, nofollow">', false)
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/login')
            ->where('seo.robots', 'noindex, nofollow'));

    $this->get(route('admin.dashboard'))->assertRedirect(route('admin.login'));
});

it('serves robots rules and points crawlers to the sitemap', function (): void {
    $this->get(route('robots'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSeeText('Disallow: /admin')
        ->assertSeeText('User-agent: OAI-SearchBot')
        ->assertSeeText('Sitemap: https://instituto-azon-social.dnnicolini.chatgpt.site/sitemap.xml');
});

it('serves an AI-readable institutional source without exposing the CRM', function (): void {
    $this->get(route('llms'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSeeText('# Instituto Azon Social')
        ->assertSeeText('Hunkpame Azon Legidan')
        ->assertSeeText('Idealizador: Doté Rodrigo D’ Avimaje')
        ->assertDontSee('/admin');
});

it('serves a sitemap with only public indexable pages', function (): void {
    $response = $this->get(route('sitemap'));

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/', false)
        ->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/eventos', false)
        ->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/calendario', false)
        ->assertDontSee('<lastmod>', false)
        ->assertDontSee('/admin', false);

    $response->assertSee('https://instituto-azon-social.dnnicolini.chatgpt.site/midia', false);
    expect(substr_count($response->getContent(), '<url>'))->toBe(4);
});
