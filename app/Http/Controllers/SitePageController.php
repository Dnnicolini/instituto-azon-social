<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class SitePageController extends Controller
{
    public function home(): InertiaResponse
    {
        $organization = $this->organizationSchema();

        return Inertia::render('home', [
            'seo' => $this->seo(
                title: 'Instituto Azon Social | Ancestralidade, cuidado e transformação',
                description: (string) config('site.description'),
                path: '/',
                schema: [
                    $organization,
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'WebSite',
                        'name' => config('site.name'),
                        'url' => $this->absoluteUrl('/'),
                        'inLanguage' => 'pt-BR',
                        'publisher' => ['@id' => $organization['@id']],
                    ],
                ],
            ),
        ]);
    }

    public function events(): InertiaResponse
    {
        $organization = $this->organizationSchema();

        return Inertia::render('events', [
            'seo' => $this->seo(
                title: 'Eventos e inscrições | Instituto Azon Social',
                description: 'Confira eventos, inscrições e ações comunitárias do Instituto Azon Social e do Hunkpame Azon Legidan em Sepetiba, Rio de Janeiro.',
                path: '/eventos',
                schema: [
                    $organization,
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'CollectionPage',
                        'name' => 'Eventos e inscrições do Instituto Azon Social',
                        'url' => $this->absoluteUrl('/eventos'),
                        'inLanguage' => 'pt-BR',
                        'about' => ['@id' => $organization['@id']],
                    ],
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'Event',
                        'name' => 'Sabeje Sepetiba 2026',
                        'description' => 'Caminhada de tradição e ancestralidade realizada pelas ruas de Sepetiba até o Hunkpame Azon Legidan.',
                        'startDate' => '2026-08-29T09:00:00-03:00',
                        'eventAttendanceMode' => 'https://schema.org/OfflineEventAttendanceMode',
                        'eventStatus' => 'https://schema.org/EventScheduled',
                        'location' => [
                            '@type' => 'Place',
                            'name' => 'Praça Américo Marçal',
                            'address' => [
                                '@type' => 'PostalAddress',
                                'addressLocality' => 'Rio de Janeiro',
                                'addressRegion' => 'RJ',
                                'addressCountry' => 'BR',
                            ],
                        ],
                        'image' => [$this->absoluteUrl('/evento-sabeje.png')],
                        'organizer' => ['@id' => $organization['@id']],
                        'url' => $this->absoluteUrl('/eventos#sabeje-2026'),
                    ],
                ],
            ),
        ]);
    }

    public function adminLogin(): Response
    {
        $response = Inertia::render('admin/login', [
            'seo' => $this->seo(
                title: 'Demonstração do painel | Instituto Azon Social',
                description: 'Área demonstrativa do painel do Instituto Azon Social.',
                path: '/admin/login',
                robots: 'noindex, nofollow',
            ),
        ])->toResponse(request());

        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }

    public function adminDashboard(): Response
    {
        $response = Inertia::render('admin/dashboard', [
            'seo' => $this->seo(
                title: 'Painel administrativo demonstrativo | Instituto Azon Social',
                description: 'Protótipo visual do painel administrativo do Instituto Azon Social.',
                path: '/admin',
                robots: 'noindex, nofollow',
            ),
        ])->toResponse(request());

        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }

    public function robots(): Response
    {
        $body = "User-agent: *\nAllow: /\nSitemap: {$this->absoluteUrl('/sitemap.xml')}\n";

        return response($body, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(): Response
    {
        $urls = [
            ['loc' => $this->absoluteUrl('/'), 'priority' => '1.0'],
            ['loc' => $this->absoluteUrl('/eventos'), 'priority' => '0.8'],
        ];

        $xml = view('sitemap', compact('urls'))->render();

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * @param  array<int, array<string, mixed>>  $schema
     * @return array<string, mixed>
     */
    private function seo(
        string $title,
        string $description,
        string $path,
        string $robots = 'index, follow, max-image-preview:large',
        array $schema = [],
    ): array {
        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $this->absoluteUrl($path),
            'robots' => $robots,
            'image' => $this->absoluteUrl('/azon-social-logo.png'),
            'imageAlt' => 'Logomarca do Instituto Azon Social',
            'type' => 'website',
            'locale' => 'pt_BR',
            'siteName' => config('site.name'),
            'schema' => $schema,
        ];
    }

    /** @return array<string, mixed> */
    private function organizationSchema(): array
    {
        $url = $this->absoluteUrl('/');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'NGO',
            '@id' => $url.'#organization',
            'name' => (string) config('site.name'),
            'alternateName' => (string) config('site.short_name'),
            'url' => $url,
            'logo' => $this->absoluteUrl('/azon-social-logo.png'),
            'description' => (string) config('site.description'),
            'email' => (string) config('site.email'),
            'telephone' => (string) config('site.phone'),
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => (string) config('site.location.city'),
                'addressRegion' => (string) config('site.location.region'),
                'addressCountry' => (string) config('site.location.country'),
            ],
            'areaServed' => [
                '@type' => 'Place',
                'name' => 'Sepetiba, Rio de Janeiro',
            ],
            'sameAs' => array_values((array) config('site.social')),
        ];
    }

    private function absoluteUrl(string $path): string
    {
        return rtrim((string) config('app.url'), '/').'/'.ltrim($path, '/');
    }
}
