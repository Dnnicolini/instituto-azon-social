<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\Document;
use App\Models\Event;
use App\Models\Page;
use App\Models\Post;
use App\Models\Project;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class SitePageController extends Controller
{
    public function home(): InertiaResponse
    {
        $organization = $this->organizationSchema();
        $page = Page::query()->published()->where('slug', 'inicio')->first();

        return Inertia::render('home', [
            'page' => $page ? $this->serializePage($page) : null,
            'settings' => $this->publicSettings(),
            'posts' => Post::query()->published()->with('cover')->where('type', PostType::Article)->latest('published_at')->limit(3)->get()->map(fn (Post $post): array => $this->serializePost($post)),
            'projects' => Project::query()->published()->with('cover')->orderBy('sort_order')->limit(8)->get()->map(fn (Project $project): array => $this->serializeProject($project)),
            'events' => Event::query()->published()->with('cover')->orderByRaw('starts_at IS NULL')->orderBy('starts_at')->limit(3)->get()->map(fn (Event $event): array => $this->serializeEvent($event)),
            'documents' => Document::query()->published()->with('media')->latest('published_at')->limit(10)->get()->map(fn (Document $document): array => ['id' => $document->id, 'title' => $document->title, 'category' => $document->category, 'file_url' => $document->media->url, 'published_at' => $document->published_at?->toIso8601String()]),
            'seo' => $this->seo(
                title: $page?->seo_title ?: 'Instituto Azon Social | Ancestralidade, cuidado e transformação',
                description: $page?->seo_description ?: (string) config('site.description'),
                path: '/',
                schema: [$organization, ['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => config('site.name'), 'url' => $this->absoluteUrl('/'), 'inLanguage' => 'pt-BR', 'publisher' => ['@id' => $organization['@id']]]],
            ),
        ]);
    }

    public function events(): InertiaResponse
    {
        $organization = $this->organizationSchema();
        $events = Event::query()->published()->with('cover')->orderByRaw('starts_at IS NULL')->orderByDesc('starts_at')->paginate(12)->withQueryString()->through(fn (Event $event): array => $this->serializeEvent($event));

        return Inertia::render('events', [
            'events' => $events,
            'seo' => $this->seo(
                title: 'Eventos e inscrições | Instituto Azon Social',
                description: 'Confira eventos, inscrições e ações comunitárias do Instituto Azon Social e do Hunkpame Azon Legidan em Sepetiba, Rio de Janeiro.',
                path: '/eventos',
                schema: [$organization, ['@context' => 'https://schema.org', '@type' => 'CollectionPage', 'name' => 'Eventos e inscrições do Instituto Azon Social', 'url' => $this->absoluteUrl('/eventos'), 'inLanguage' => 'pt-BR', 'about' => ['@id' => $organization['@id']]]],
            ),
        ]);
    }

    public function media(Request $request): InertiaResponse
    {
        $allowedTypes = [PostType::Vlog->value, PostType::Video->value, PostType::Podcast->value];
        $type = in_array($request->query('type'), $allowedTypes, true) ? (string) $request->query('type') : null;
        $search = mb_substr(trim((string) $request->query('search', '')), 0, 100);
        $query = Post::query()->published()->with(['cover', 'author:id,name'])->whereIn('type', $allowedTypes)->latest('published_at');
        if ($type) {
            $query->where('type', $type);
        }
        if ($search !== '') {
            $query->where(function ($query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        return Inertia::render('media/index', [
            'posts' => $query->paginate(12)->withQueryString()->through(fn (Post $post): array => $this->serializePost($post)),
            'filters' => ['type' => $type, 'search' => $search, 'availableTypes' => $allowedTypes],
            'seo' => $this->seo('Vlogs, vídeos e podcasts | Instituto Azon Social', 'Histórias, conversas, vídeos e podcasts produzidos pelo Instituto Azon Social.', '/midia'),
        ]);
    }

    public function mediaShow(Post $post): InertiaResponse
    {
        abort_unless($post->status->value === 'published' && $post->published_at?->isPast(), 404);
        abort_unless(in_array($post->type, [PostType::Vlog, PostType::Video, PostType::Podcast], true), 404);
        $post->load(['cover', 'author:id,name']);

        return Inertia::render('media/show', [
            'post' => $this->serializePost($post, withBody: true),
            'related' => Post::query()->published()->with('cover')->where('type', $post->type)->whereKeyNot($post->id)->latest('published_at')->limit(3)->get()->map(fn (Post $related): array => $this->serializePost($related)),
            'seo' => $this->seo($post->seo_title ?: $post->title.' | Instituto Azon Social', $post->seo_description ?: ($post->excerpt ?: (string) config('site.description')), '/midia/'.$post->slug, type: $post->type === PostType::Podcast ? 'music.song' : 'video.other'),
        ]);
    }

    public function articleShow(Post $post): InertiaResponse
    {
        abort_unless($post->status->value === 'published' && $post->published_at?->isPast() && $post->type === PostType::Article, 404);
        $post->load(['cover', 'author:id,name']);

        return Inertia::render('media/show', [
            'post' => $this->serializePost($post, withBody: true),
            'related' => Post::query()->published()->with('cover')->where('type', PostType::Article)->whereKeyNot($post->id)->latest('published_at')->limit(3)->get()->map(fn (Post $related): array => $this->serializePost($related)),
            'seo' => $this->seo($post->seo_title ?: $post->title.' | Instituto Azon Social', $post->seo_description ?: ($post->excerpt ?: (string) config('site.description')), '/noticias/'.$post->slug, type: 'article'),
        ]);
    }

    public function page(string $slug): InertiaResponse
    {
        $page = Page::query()->published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('page', [
            'page' => $this->serializePage($page),
            'seo' => $this->seo($page->seo_title ?: $page->title.' | Instituto Azon Social', $page->seo_description ?: (string) config('site.description'), '/pagina/'.$page->slug),
        ]);
    }

    public function podcast(): Response
    {
        $episodes = Post::query()->published()->where('type', PostType::Podcast)->latest('published_at')->limit(100)->get();

        return response(view('podcast', compact('episodes'))->render())->header('Content-Type', 'application/rss+xml; charset=UTF-8');
    }

    public function robots(): Response
    {
        return response("User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: {$this->absoluteUrl('/sitemap.xml')}\n")->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(): Response
    {
        $urls = [
            ['loc' => $this->absoluteUrl('/'), 'priority' => '1.0'],
            ['loc' => $this->absoluteUrl('/eventos'), 'priority' => '0.8'],
            ['loc' => $this->absoluteUrl('/midia'), 'priority' => '0.8'],
        ];
        Post::query()->published()->whereIn('type', [PostType::Vlog, PostType::Video, PostType::Podcast])->select(['slug', 'updated_at'])->latest('updated_at')->limit(45000)->each(function (Post $post) use (&$urls): void {
            $urls[] = ['loc' => $this->absoluteUrl('/midia/'.$post->slug), 'priority' => '0.7', 'lastmod' => $post->updated_at?->toAtomString()];
        });
        Post::query()->published()->where('type', PostType::Article)->select(['slug', 'updated_at'])->latest('updated_at')->limit(45000)->each(function (Post $post) use (&$urls): void {
            $urls[] = ['loc' => $this->absoluteUrl('/noticias/'.$post->slug), 'priority' => '0.7', 'lastmod' => $post->updated_at?->toAtomString()];
        });
        Page::query()->published()->where('slug', '!=', 'inicio')->select(['slug', 'updated_at'])->each(function (Page $page) use (&$urls): void {
            $urls[] = ['loc' => $this->absoluteUrl('/pagina/'.$page->slug), 'priority' => '0.6', 'lastmod' => $page->updated_at?->toAtomString()];
        });

        return response(view('sitemap', compact('urls'))->render())->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /** @param array<int, array<string, mixed>> $schema
     * @return array<string, mixed>
     */
    private function seo(string $title, string $description, string $path, string $robots = 'index, follow, max-image-preview:large', array $schema = [], string $type = 'website'): array
    {
        return ['title' => $title, 'description' => $description, 'canonical' => $this->absoluteUrl($path), 'robots' => $robots, 'image' => $this->absoluteUrl('/azon-social-logo.png'), 'imageAlt' => 'Logomarca do Instituto Azon Social', 'type' => $type, 'locale' => 'pt_BR', 'siteName' => config('site.name'), 'schema' => $schema];
    }

    /** @return array<string, mixed> */
    private function organizationSchema(): array
    {
        $url = $this->absoluteUrl('/');

        return ['@context' => 'https://schema.org', '@type' => 'NGO', '@id' => $url.'#organization', 'name' => config('site.name'), 'alternateName' => config('site.short_name'), 'url' => $url, 'logo' => $this->absoluteUrl('/azon-social-logo.png'), 'description' => config('site.description'), 'email' => config('site.email'), 'telephone' => config('site.phone'), 'address' => ['@type' => 'PostalAddress', 'addressLocality' => config('site.location.city'), 'addressRegion' => config('site.location.region'), 'addressCountry' => config('site.location.country')], 'areaServed' => ['@type' => 'Place', 'name' => 'Sepetiba, Rio de Janeiro'], 'sameAs' => array_values((array) config('site.social'))];
    }

    /** @return array<string, string|null> */
    private function publicSettings(): array
    {
        return SiteSetting::query()->where('is_public', true)->pluck('value', 'key')->all();
    }

    /** @return array<string, mixed> */
    private function serializePost(Post $post, bool $withBody = false): array
    {
        return ['id' => $post->id, 'slug' => $post->slug, 'title' => $post->title, 'type' => $post->type->value, 'excerpt' => $post->excerpt, 'body' => $withBody ? $post->body : null, 'cover_url' => $post->cover?->url, 'cover_alt' => $post->cover?->alt_text, 'provider' => $post->provider, 'external_url' => $post->external_url, 'duration_seconds' => $post->duration_seconds, 'published_at' => $post->published_at?->toIso8601String(), 'author' => $post->relationLoaded('author') ? $post->author?->name : null];
    }

    /** @return array<string, mixed> */
    private function serializeProject(Project $project): array
    {
        return ['id' => $project->id, 'name' => $project->title, 'title' => $project->title, 'slug' => $project->slug, 'summary' => $project->summary, 'body' => $project->body, 'cover_url' => $project->cover?->url];
    }

    /** @return array<string, mixed> */
    private function serializeEvent(Event $event): array
    {
        return ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug, 'summary' => $event->summary, 'body' => $event->body, 'starts_at' => $event->starts_at?->toIso8601String(), 'ends_at' => $event->ends_at?->toIso8601String(), 'date_label' => $event->date_label, 'location' => $event->location, 'registration_url' => $event->registration_url, 'cover_url' => $event->cover?->url, 'cover_alt' => $event->cover?->alt_text];
    }

    /** @return array<string, mixed> */
    private function serializePage(Page $page): array
    {
        return ['id' => $page->id, 'title' => $page->title, 'slug' => $page->slug, 'body' => $page->body, 'sections' => $page->sections ?? [], 'updated_at' => $page->updated_at?->toIso8601String()];
    }

    private function absoluteUrl(string $path): string
    {
        return rtrim((string) config('app.url'), '/').'/'.ltrim($path, '/');
    }
}
