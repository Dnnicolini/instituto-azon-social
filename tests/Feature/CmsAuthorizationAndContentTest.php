<?php

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Jobs\OptimizeVideoAsset;
use App\Models\ContactMessage;
use App\Models\Document;
use App\Models\Event;
use App\Models\MediaAsset;
use App\Models\Page;
use App\Models\Permission;
use App\Models\Post;
use App\Models\Project;
use App\Models\Role;
use App\Models\SocialIntegration;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

it('blocks guests and users without permission from admin content', function (): void {
    $this->get(route('admin.posts.index'))->assertRedirect(route('admin.login'));

    $outsider = User::factory()->create();
    $this->actingAs($outsider)->get(route('admin.posts.index'))->assertForbidden();
});

it('keeps the contact CRM exclusive to administrators', function (): void {
    $publisher = $this->cmsUser('publisher');
    $administrator = $this->cmsUser('administrator');
    $delegatedRole = Role::query()->create([
        'name' => 'Acesso delegado indevido',
        'slug' => 'delegated-crm',
        'is_system' => false,
    ]);
    $delegatedRole->permissions()->sync(Permission::query()
        ->whereIn('slug', ['access-admin', 'messages.view', 'messages.manage'])
        ->pluck('id'));
    $delegatedUser = User::factory()->create();
    $delegatedUser->roles()->attach($delegatedRole);
    ContactMessage::query()->create([
        'name' => 'Contato privado',
        'email' => 'contato@example.org',
        'message' => 'Informação que não pode vazar no painel editorial.',
    ]);

    $this->actingAs($publisher)->get(route('admin.messages.index'))->assertForbidden();
    $this->actingAs($publisher)->get(route('admin.dashboard'))->assertInertia(
        fn (Assert $page): Assert => $page->where('stats.unreadMessages', 0),
    );
    $this->actingAs($delegatedUser)->get(route('admin.messages.index'))->assertForbidden();
    $this->actingAs($delegatedUser)->get(route('admin.dashboard'))->assertInertia(
        fn (Assert $page): Assert => $page->where('stats.unreadMessages', 0),
    );
    $this->actingAs($administrator)->get(route('admin.messages.index'))->assertOk();
});

it('filters and paginates contact messages on the server', function (): void {
    $administrator = $this->cmsUser('administrator');
    foreach (range(1, 12) as $index) {
        ContactMessage::query()->create([
            'name' => "Pessoa {$index}",
            'email' => "pessoa{$index}@example.org",
            'subject' => "Atendimento prioridade {$index}",
            'message' => 'Mensagem para acompanhamento.',
            'status' => 'responded',
        ]);
    }
    ContactMessage::query()->create([
        'name' => 'Outro contato',
        'email' => 'outro@example.org',
        'subject' => 'Assunto diferente',
        'message' => 'Não deve aparecer no resultado filtrado.',
        'status' => 'new',
    ]);

    $this->actingAs($administrator)->get(route('admin.messages.index', [
        'search' => 'PRIORIDADE',
        'status' => 'responded',
        'per_page' => 10,
    ]))->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('filters.search', 'PRIORIDADE')
        ->where('filters.status', 'responded')
        ->where('filters.per_page', 10)
        ->where('messages.total', 12)
        ->where('messages.per_page', 10)
        ->has('messages.data', 10));
});

it('keeps Instagram account connection exclusive to administrators', function (): void {
    config([
        'services.instagram.client_id' => 'instagram-app-id',
        'services.instagram.client_secret' => 'instagram-app-secret',
    ]);
    $publisher = $this->cmsUser('publisher');
    $administrator = $this->cmsUser('administrator');
    $integration = SocialIntegration::query()->create(['provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social']);

    $this->actingAs($publisher)
        ->get(route('admin.instagram.connect', $integration))
        ->assertForbidden();
    $this->actingAs($administrator)
        ->get(route('admin.instagram.connect', $integration))
        ->assertRedirectContains('https://www.instagram.com/oauth/authorize?')
        ->assertSessionHas('instagram_oauth_state');
});

it('does not allow CRM permissions in delegated groups', function (): void {
    $administrator = $this->cmsUser('administrator');
    $crmPermission = Permission::query()->where('slug', 'messages.view')->firstOrFail();
    $accessAdminPermission = Permission::query()->where('slug', 'access-admin')->firstOrFail();

    $this->actingAs($administrator)->post(route('admin.roles.store'), [
        'name' => 'Atendimento delegado',
        'slug' => 'delegated-support',
        'permissions' => [$accessAdminPermission->id, $crmPermission->id],
    ])->assertForbidden();

    $this->assertDatabaseMissing('roles', ['slug' => 'delegated-support']);
});

it('prevents delegated user managers from granting administrator access', function (): void {
    $managerRole = Role::query()->create([
        'name' => 'Gestor de equipe',
        'slug' => 'team-manager',
        'is_system' => false,
    ]);
    $this->seed(AuthorizationSeeder::class);
    $managerRole->permissions()->sync(Permission::query()
        ->whereIn('slug', ['access-admin', 'users.manage'])
        ->pluck('id'));
    $manager = User::factory()->create();
    $manager->roles()->attach($managerRole);
    $administratorRole = Role::query()->where('slug', 'administrator')->firstOrFail();

    $this->actingAs($manager)->post(route('admin.users.store'), [
        'name' => 'Novo administrador',
        'email' => 'novo-admin@example.org',
        'roles' => [$administratorRole->id],
    ])->assertForbidden();

    $this->assertDatabaseMissing('users', ['email' => 'novo-admin@example.org']);
});

it('prevents delegated role managers from granting permissions they do not have', function (): void {
    $this->seed(AuthorizationSeeder::class);
    $roleManager = Role::query()->create([
        'name' => 'Gestor de grupos limitado',
        'slug' => 'limited-role-manager',
        'is_system' => false,
    ]);
    $roleManager->permissions()->sync(Permission::query()
        ->whereIn('slug', ['access-admin', 'roles.manage'])
        ->pluck('id'));
    $manager = User::factory()->create();
    $manager->roles()->attach($roleManager);
    $settingsPermission = Permission::query()->where('slug', 'settings.manage')->firstOrFail();
    $accessAdminPermission = Permission::query()->where('slug', 'access-admin')->firstOrFail();

    $this->actingAs($manager)->post(route('admin.roles.store'), [
        'name' => 'Grupo indevido',
        'slug' => 'improper-group',
        'permissions' => [$accessAdminPermission->id, $settingsPermission->id],
    ])->assertForbidden();

    $this->assertDatabaseMissing('roles', ['slug' => 'improper-group']);
});

it('allows editors to draft but not publish and allows publishers to publish', function (): void {
    $editor = $this->cmsUser('editor');
    $payload = ['type' => 'article', 'title' => 'Texto comunitário', 'slug' => 'texto-comunitario', 'body' => 'Conteúdo seguro', 'status' => 'draft'];

    $this->actingAs($editor)->post(route('admin.posts.store'), $payload)->assertRedirect();
    $this->assertDatabaseHas('posts', ['slug' => 'texto-comunitario', 'status' => 'draft']);

    $payload['slug'] = 'publicacao-editor';
    $payload['status'] = 'published';
    $this->actingAs($editor)->post(route('admin.posts.store'), $payload)->assertSessionHasErrors('status');

    $publisher = $this->cmsUser('publisher');
    $payload['slug'] = 'publicacao-aprovada';
    $this->actingAs($publisher)->post(route('admin.posts.store'), $payload)->assertRedirect();
    $this->assertDatabaseHas('posts', ['slug' => 'publicacao-aprovada', 'status' => 'published']);
});

it('makes publish now immediately visible even when a future schedule was present', function (): void {
    $publisher = $this->cmsUser('publisher');
    $post = Post::query()->create([
        'type' => PostType::Article,
        'title' => 'Publicação agendada',
        'slug' => 'publicacao-agendada-agora',
        'status' => ContentStatus::Scheduled,
        'published_at' => now()->addMonth(),
    ]);

    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'article',
        'title' => $post->title,
        'slug' => $post->slug,
        'status' => 'published',
        'published_at' => now()->addMonth()->toDateTimeString(),
    ])->assertRedirect();

    $post->refresh();
    expect($post->status)->toBe(ContentStatus::Published)
        ->and($post->published_at?->isFuture())->toBeFalse()
        ->and(Post::query()->published()->whereKey($post->getKey())->exists())->toBeTrue();
});

it('validates and stores generated image uploads', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');
    $cover = UploadedFile::fake()->image('capa.png', 1200, 675);

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'video', 'title' => 'Vídeo da comunidade', 'slug' => 'video-comunidade', 'status' => 'draft',
        'external_url' => 'https://www.youtube.com/watch?v=abc123', 'provider' => 'youtube', 'cover' => $cover, 'cover_alt' => 'Pessoas reunidas em atividade',
    ])->assertRedirect();

    $post = Post::query()->where('slug', 'video-comunidade')->with('cover')->firstOrFail();
    expect($post->cover?->original_name)->toBe('capa.png')->and($post->cover?->path)->not->toContain('capa.png');
    Storage::disk('public')->assertExists((string) $post->cover?->path);

    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'video',
        'title' => $post->title,
        'slug' => $post->slug,
        'status' => 'draft',
        'provider' => 'youtube',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
        'cover_alt' => 'Descrição alternativa revisada',
    ])->assertRedirect();
    expect($post->cover?->fresh()->alt_text)->toBe('Descrição alternativa revisada');
});

it('accepts a video upload separately from the cover image', function (): void {
    Storage::fake('public');
    Queue::fake();
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'vlog',
        'title' => 'Relato em vídeo',
        'slug' => 'relato-em-video',
        'status' => 'draft',
        'video' => UploadedFile::fake()->create('relato.MOV', 1024, 'video/quicktime'),
    ])->assertRedirect();

    $post = Post::query()->where('slug', 'relato-em-video')->with(['video', 'cover'])->firstOrFail();
    expect($post->video?->original_name)->toBe('relato.MOV')
        ->and($post->video?->mime_type)->toBe('video/quicktime')
        ->and($post->cover)->toBeNull();
    Storage::disk('public')->assertExists((string) $post->video?->path);
    Queue::assertPushed(OptimizeVideoAsset::class);
});

it('accepts an audio upload for podcasts without persisting the form source mode', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'podcast',
        'title' => 'Vozes do território',
        'slug' => 'vozes-do-territorio',
        'status' => 'draft',
        'source_mode' => 'upload',
        'video' => UploadedFile::fake()->create('episodio.mp3', 2048, 'audio/mpeg'),
    ])->assertRedirect();

    $post = Post::query()->where('slug', 'vozes-do-territorio')->with('video')->firstOrFail();
    expect($post->video?->original_name)->toBe('episodio.mp3')
        ->and($post->provider)->toBeNull()
        ->and($post->external_url)->toBeNull()
        ->and($post->getAttributes())->not->toHaveKey('source_mode');
    Storage::disk('public')->assertExists((string) $post->video?->path);
});

it('keeps the current upload on edit and clears it only when switching to a link', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');
    $media = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/media/existente.mp4',
        'original_name' => 'existente.mp4',
        'mime_type' => 'video/mp4',
        'size' => 1024,
    ]);
    $post = Post::query()->create([
        'type' => PostType::Video,
        'title' => 'Vídeo existente',
        'slug' => 'video-existente',
        'status' => ContentStatus::Draft,
        'video_media_id' => $media->id,
    ]);

    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'video',
        'title' => 'Vídeo revisado',
        'slug' => 'video-existente',
        'status' => 'draft',
        'source_mode' => 'upload',
    ])->assertRedirect();
    expect($post->fresh()->video_media_id)->toBe($media->id);

    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'video',
        'title' => 'Vídeo por link',
        'slug' => 'video-existente',
        'status' => 'draft',
        'source_mode' => 'link',
        'provider' => 'youtube',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
    ])->assertRedirect();

    $post->refresh();
    expect($post->video_media_id)->toBeNull()
        ->and($post->provider)->toBe('youtube')
        ->and($post->external_url)->toBe('https://www.youtube.com/watch?v=abc123');
});

it('rejects a stored upload when its mime is incompatible with the changed media type', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');
    $video = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/media/existente.mp4',
        'original_name' => 'existente.mp4',
        'mime_type' => 'video/mp4',
        'size' => 1024,
    ]);
    $post = Post::query()->create([
        'type' => PostType::Video,
        'title' => 'Vídeo existente',
        'slug' => 'video-existente-mime',
        'status' => ContentStatus::Draft,
        'video_media_id' => $video->id,
    ]);

    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'podcast',
        'title' => 'Podcast inválido',
        'slug' => 'video-existente-mime',
        'status' => 'draft',
        'source_mode' => 'upload',
    ])->assertSessionHasErrors('video');

    expect($post->fresh()->type)->toBe(PostType::Video);

    $audio = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/media/existente.mp3',
        'original_name' => 'existente.mp3',
        'mime_type' => 'audio/mpeg',
        'size' => 1024,
    ]);
    $podcast = Post::query()->create([
        'type' => PostType::Podcast,
        'title' => 'Podcast existente',
        'slug' => 'podcast-existente-mime',
        'status' => ContentStatus::Draft,
        'video_media_id' => $audio->id,
    ]);

    $this->actingAs($publisher)->put(route('admin.posts.update', $podcast), [
        'type' => 'video',
        'title' => 'Vídeo inválido',
        'slug' => 'podcast-existente-mime',
        'status' => 'draft',
        'source_mode' => 'upload',
    ])->assertSessionHasErrors('video');

    expect($podcast->fresh()->type)->toBe(PostType::Podcast);
});

it('requires exactly one coherent media source', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'video',
        'title' => 'Duas origens',
        'slug' => 'duas-origens',
        'status' => 'draft',
        'source_mode' => 'upload',
        'provider' => 'youtube',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
        'video' => UploadedFile::fake()->create('video.mp4', 1024, 'video/mp4'),
    ])->assertSessionHasErrors(['provider', 'external_url']);

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'podcast',
        'title' => 'Áudio no modo link',
        'slug' => 'audio-no-modo-link',
        'status' => 'draft',
        'source_mode' => 'link',
        'provider' => 'spotify',
        'external_url' => 'https://open.spotify.com/episode/123',
        'video' => UploadedFile::fake()->create('episodio.mp3', 1024, 'audio/mpeg'),
    ])->assertSessionHasErrors('video');

    $this->assertDatabaseMissing('posts', ['slug' => 'duas-origens']);
    $this->assertDatabaseMissing('posts', ['slug' => 'audio-no-modo-link']);
});

it('rejects unsupported video files and video uploads on non-video content', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'video',
        'title' => 'Arquivo incompatível',
        'slug' => 'arquivo-incompativel',
        'status' => 'draft',
        'video' => UploadedFile::fake()->create('arquivo.avi', 100, 'video/x-msvideo'),
    ])->assertSessionHasErrors('video');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'article',
        'title' => 'Artigo com vídeo indevido',
        'slug' => 'artigo-com-video-indevido',
        'status' => 'draft',
        'video' => UploadedFile::fake()->create('arquivo.mp4', 100, 'video/mp4'),
    ])->assertSessionHasErrors('video');
});

it('separates content, media and social admin experiences and preserves their context', function (): void {
    $publisher = $this->cmsUser('publisher');
    Post::query()->create(['type' => PostType::Article, 'title' => 'Artigo', 'slug' => 'artigo-admin', 'status' => ContentStatus::Draft]);
    Post::query()->create(['type' => PostType::Video, 'title' => 'Vídeo', 'slug' => 'video-admin', 'status' => ContentStatus::Draft]);
    Post::query()->create(['type' => PostType::Social, 'title' => 'Instagram', 'slug' => 'instagram-admin', 'status' => ContentStatus::Draft]);

    $this->actingAs($publisher)->get(route('admin.posts.index', ['type' => 'media']))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('section', 'media')
            ->where('filters.type', 'media')
            ->has('items.data', 1)
            ->where('items.data.0.type', 'video'));

    $this->actingAs($publisher)->get(route('admin.posts.index', ['type' => 'social']))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('section', 'social')
            ->has('items.data', 1)
            ->where('items.data.0.type', 'social'));

    $this->actingAs($publisher)->get(route('admin.posts.create', ['type' => 'media']))
        ->assertInertia(fn (Assert $page): Assert => $page->where('section', 'media')->where('initialType', 'vlog'));
    $this->actingAs($publisher)->get(route('admin.posts.create', ['type' => 'social']))
        ->assertInertia(fn (Assert $page): Assert => $page->where('section', 'social')->where('initialType', 'social'));

    $response = $this->actingAs($publisher)->post(route('admin.posts.store', ['section' => 'media']), [
        'type' => 'video',
        'title' => 'Vídeo externo',
        'slug' => 'video-externo',
        'status' => 'draft',
        'provider' => 'youtube',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
    ]);
    Post::query()->where('slug', 'video-externo')->firstOrFail();
    $response
        ->assertRedirect(route('admin.posts.index', ['type' => 'media']))
        ->assertSessionHas('success', 'Conteúdo cadastrado com sucesso.');
});

it('confirms every content registration and returns to its listing', function (): void {
    Storage::fake('local');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'article',
        'title' => 'Novo artigo',
        'slug' => 'novo-artigo-retorno',
        'status' => 'draft',
    ])->assertRedirect(route('admin.posts.index', ['type' => 'article']))
        ->assertSessionHas('success', 'Conteúdo cadastrado com sucesso.');

    $this->actingAs($publisher)->post(route('admin.projects.store'), [
        'title' => 'Novo projeto',
        'slug' => 'novo-projeto-retorno',
        'badge_label' => 'Cultura',
        'status' => 'draft',
        'sort_order' => 1,
    ])->assertRedirect(route('admin.projects.index'))
        ->assertSessionHas('success', 'Projeto cadastrado com sucesso.');

    $this->actingAs($publisher)->post(route('admin.events.store'), [
        'title' => 'Novo evento',
        'slug' => 'novo-evento-retorno',
        'location' => 'Sede Azon',
        'status' => 'draft',
    ])->assertRedirect(route('admin.events.index'))
        ->assertSessionHas('success', 'Evento cadastrado com sucesso.');

    $this->actingAs($publisher)->post(route('admin.documents.store'), [
        'title' => 'Novo documento',
        'slug' => 'novo-documento-retorno',
        'status' => 'draft',
        'file' => UploadedFile::fake()->create('novo-documento.pdf', 10, 'application/pdf'),
    ])->assertRedirect(route('admin.documents.index'))
        ->assertSessionHas('success', 'Documento cadastrado com sucesso.');

    $this->actingAs($publisher)->post(route('admin.pages.store'), [
        'title' => 'Nova página',
        'slug' => 'nova-pagina-retorno',
        'status' => 'draft',
    ])->assertRedirect(route('admin.pages.index'))
        ->assertSessionHas('success', 'Página cadastrada com sucesso.');
});

it('filters every content directory on the server and preserves validated filters', function (): void {
    $publisher = $this->cmsUser('publisher');
    Project::query()->create([
        'title' => 'Horta Comunitária',
        'slug' => 'horta-comunitaria',
        'summary' => 'Cultivo no território',
        'status' => ContentStatus::Published,
    ]);
    Project::query()->create([
        'title' => 'Oficina de leitura',
        'slug' => 'oficina-leitura',
        'status' => ContentStatus::Draft,
    ]);
    Event::query()->create([
        'title' => 'Encontro futuro',
        'slug' => 'encontro-futuro',
        'location' => 'Sede Azon',
        'starts_at' => now()->addWeek(),
        'status' => ContentStatus::Published,
    ]);
    Event::query()->create([
        'title' => 'Encontro realizado',
        'slug' => 'encontro-realizado',
        'starts_at' => now()->subWeeks(2),
        'ends_at' => now()->subWeek(),
        'status' => ContentStatus::Published,
    ]);
    Page::query()->create([
        'title' => 'História do Instituto',
        'slug' => 'historia-instituto',
        'status' => ContentStatus::Review,
    ]);
    Page::query()->create([
        'title' => 'Página sem relação',
        'slug' => 'pagina-sem-relacao',
        'status' => ContentStatus::Draft,
    ]);

    $media = MediaAsset::query()->create([
        'disk' => 'local',
        'path' => 'cms/documents/relatorio.pdf',
        'original_name' => 'relatorio.pdf',
        'mime_type' => 'application/pdf',
        'size' => 1024,
    ]);
    Document::query()->create([
        'media_asset_id' => $media->id,
        'title' => 'Relatório anual',
        'slug' => 'relatorio-anual',
        'category' => 'Relatórios',
        'status' => ContentStatus::Published,
    ]);

    $this->actingAs($publisher)->get(route('admin.projects.index', [
        'search' => 'horta',
        'status' => 'published',
        'per_page' => 10,
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->where('filters.search', 'horta')
        ->where('filters.status', 'published')
        ->where('filters.per_page', 10)
        ->where('items.per_page', 10)
        ->has('items.data', 1)
        ->where('items.data.0.slug', 'horta-comunitaria'));

    $this->actingAs($publisher)->get(route('admin.events.index', [
        'period' => 'upcoming',
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->where('filters.period', 'upcoming')
        ->has('items.data', 1)
        ->where('items.data.0.slug', 'encontro-futuro'));

    $this->actingAs($publisher)->get(route('admin.documents.index', [
        'category' => 'Relatórios',
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->where('filters.category', 'Relatórios')
        ->where('categories.0', 'Relatórios')
        ->has('items.data', 1)
        ->where('items.data.0.slug', 'relatorio-anual'));

    $this->actingAs($publisher)->get(route('admin.pages.index', [
        'search' => 'historia',
        'status' => 'review',
    ]))->assertInertia(fn (Assert $page): Assert => $page
        ->where('filters.search', 'historia')
        ->where('filters.status', 'review')
        ->has('items.data', 1)
        ->where('items.data.0.slug', 'historia-instituto'));
});

it('serves valid admin routes directly with SSR configured and returns 404 for unknown routes', function (): void {
    config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    Http::preventStrayRequests();
    $publisher = $this->cmsUser('publisher');
    $paths = [
        '/admin/posts',
        '/admin/posts?type=media',
        '/admin/posts?type=social',
        '/admin/posts/create',
        '/admin/projetos',
        '/admin/projetos/create',
        '/admin/eventos',
    ];

    foreach ($paths as $path) {
        $this->actingAs($publisher)->get($path)->assertOk();
        $this->actingAs($publisher)->get($path)->assertOk();
    }

    $this->actingAs($publisher)->get('/admin/rota-inexistente')->assertNotFound();
    expect(config('inertia.ssr.enabled'))->toBeTrue();
});

it('requires a coherent platform and secure URL for media', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'video',
        'title' => 'Vídeo sem plataforma',
        'slug' => 'video-sem-plataforma',
        'status' => 'draft',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
    ])->assertSessionHasErrors('provider');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'podcast',
        'title' => 'Podcast incompatível',
        'slug' => 'podcast-incompativel',
        'status' => 'draft',
        'provider' => 'spotify',
        'external_url' => 'https://example.org/episode/123',
    ])->assertSessionHasErrors('external_url');
});

it('validates and stores curated Instagram publications', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'social',
        'title' => 'Destaque do território',
        'slug' => 'destaque-do-territorio',
        'status' => 'published',
        'published_at' => now()->subMinute()->toDateTimeString(),
        'provider' => 'instagram',
        'external_url' => 'https://www.instagram.com/p/SafePost123/',
        'is_featured' => true,
        'sort_order' => 5,
    ])->assertRedirect();

    $this->assertDatabaseHas('posts', [
        'slug' => 'destaque-do-territorio',
        'type' => 'social',
        'provider' => 'instagram',
        'is_featured' => true,
        'sort_order' => 5,
    ]);

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'social',
        'title' => 'Link inseguro',
        'slug' => 'link-inseguro',
        'status' => 'draft',
        'provider' => 'instagram',
        'external_url' => 'https://instagram.com.example.org/p/Fake123/',
    ])->assertSessionHasErrors('external_url');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'social',
        'title' => 'Perfil sem publicação',
        'slug' => 'perfil-sem-publicacao',
        'status' => 'draft',
        'provider' => 'instagram',
        'external_url' => 'https://www.instagram.com/azon.social/',
    ])->assertSessionHasErrors('external_url');
});

it('accepts direct Facebook TikTok and LinkedIn publications and rejects profiles or forged hosts', function (): void {
    $publisher = $this->cmsUser('publisher');
    $socialLinks = [
        ['facebook', 'https://www.facebook.com/azon.social/posts/123456789', 'facebook-direto'],
        ['tiktok', 'https://www.tiktok.com/@azon.social/video/7420000000000000000', 'tiktok-direto'],
        ['linkedin', 'https://www.linkedin.com/posts/azon-social_atividade-123456789', 'linkedin-direto'],
    ];

    foreach ($socialLinks as [$provider, $url, $slug]) {
        $this->actingAs($publisher)->post(route('admin.posts.store'), [
            'type' => 'social',
            'title' => 'Publicação '.$provider,
            'slug' => $slug,
            'status' => 'draft',
            'source_mode' => 'link',
            'provider' => $provider,
            'external_url' => $url,
        ])->assertRedirect();
    }

    $this->assertDatabaseHas('posts', ['slug' => 'facebook-direto', 'provider' => 'facebook']);
    $this->assertDatabaseHas('posts', ['slug' => 'tiktok-direto', 'provider' => 'tiktok']);
    $this->assertDatabaseHas('posts', ['slug' => 'linkedin-direto', 'provider' => 'linkedin']);

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'social',
        'title' => 'Perfil do Facebook',
        'slug' => 'perfil-facebook',
        'status' => 'draft',
        'source_mode' => 'link',
        'provider' => 'facebook',
        'external_url' => 'https://www.facebook.com/azon.social',
    ])->assertSessionHasErrors('external_url');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'social',
        'title' => 'Host forjado',
        'slug' => 'host-forjado-social',
        'status' => 'draft',
        'source_mode' => 'link',
        'provider' => 'linkedin',
        'external_url' => 'https://linkedin.com.example.org/posts/azon-falso',
    ])->assertSessionHasErrors('external_url');
});

it('requires media permission before storing an upload', function (): void {
    Storage::fake('public');
    $this->seed(AuthorizationSeeder::class);
    $contentRole = Role::query()->create([
        'name' => 'Autor sem mídia',
        'slug' => 'author-without-media',
        'is_system' => false,
    ]);
    $contentRole->permissions()->sync(Permission::query()
        ->whereIn('slug', ['access-admin', 'content.create'])
        ->pluck('id'));
    $author = User::factory()->create();
    $author->roles()->attach($contentRole);

    $this->actingAs($author)->post(route('admin.posts.store'), [
        'type' => 'video',
        'title' => 'Vídeo sem autorização de mídia',
        'slug' => 'video-sem-autorizacao-de-midia',
        'status' => 'draft',
        'provider' => 'youtube',
        'external_url' => 'https://www.youtube.com/watch?v=abc123',
        'cover' => UploadedFile::fake()->image('capa.png', 1200, 675),
        'cover_alt' => 'Capa do vídeo',
    ])->assertForbidden();

    $this->assertDatabaseMissing('posts', ['slug' => 'video-sem-autorizacao-de-midia']);
});

it('requires media permission only when an existing cover description changes', function (): void {
    $this->seed(AuthorizationSeeder::class);
    $contentRole = Role::query()->create([
        'name' => 'Editor sem mídia',
        'slug' => 'editor-without-media',
        'is_system' => false,
    ]);
    $contentRole->permissions()->sync(Permission::query()
        ->whereIn('slug', ['access-admin', 'content.update'])
        ->pluck('id'));
    $editor = User::factory()->create();
    $editor->roles()->attach($contentRole);
    $cover = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/images/capa-existente.webp',
        'original_name' => 'capa-existente.webp',
        'mime_type' => 'image/webp',
        'size' => 100,
        'alt_text' => 'Descrição original',
    ]);
    $post = Post::query()->create([
        'type' => PostType::Article,
        'title' => 'Conteúdo existente',
        'slug' => 'conteudo-existente',
        'status' => ContentStatus::Draft,
        'cover_media_id' => $cover->id,
    ]);
    $payload = [
        'type' => 'article',
        'title' => 'Conteúdo revisado',
        'slug' => 'conteudo-existente',
        'status' => 'draft',
        'cover_alt' => 'Descrição original',
    ];

    $this->actingAs($editor)->put(route('admin.posts.update', $post), $payload)->assertRedirect();

    $payload['cover_alt'] = 'Descrição alterada sem permissão';
    $this->actingAs($editor)->put(route('admin.posts.update', $post), $payload)->assertForbidden();
    expect($cover->fresh()->alt_text)->toBe('Descrição original');
});

it('accepts images without imposing pixel dimension limits', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.projects.store'), [
        'title' => 'Projeto com capa enorme',
        'slug' => 'projeto-com-capa-enorme',
        'badge_label' => 'Ação comunitária',
        'status' => 'draft',
        'sort_order' => 0,
        'cover' => UploadedFile::fake()->image('projeto.png', 5001, 20),
        'cover_alt' => 'Capa muito larga',
    ])->assertRedirect();

    $this->actingAs($publisher)->post(route('admin.events.store'), [
        'title' => 'Evento com capa enorme',
        'slug' => 'evento-com-capa-enorme',
        'status' => 'draft',
        'location' => 'Sepetiba, Rio de Janeiro',
        'cover' => UploadedFile::fake()->image('evento.png', 20, 5001),
        'cover_alt' => 'Capa muito alta',
    ])->assertRedirect();

    expect(Project::query()->where('slug', 'projeto-com-capa-enorme')->exists())->toBeTrue()
        ->and(Event::query()->where('slug', 'evento-com-capa-enorme')->exists())->toBeTrue();
});

it('stores the project badge configured in the admin form', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.projects.store'), [
        'title' => 'Projeto de leitura',
        'slug' => 'projeto-leitura',
        'summary' => 'Encontros comunitários de leitura.',
        'badge_label' => 'Educação e cultura',
        'status' => 'draft',
        'sort_order' => 10,
    ])->assertRedirect();

    expect(Project::query()->where('slug', 'projeto-leitura')->value('badge_label'))
        ->toBe('Educação e cultura');

    $this->actingAs($publisher)->post(route('admin.projects.store'), [
        'title' => 'Projeto sem categoria',
        'slug' => 'projeto-sem-categoria',
        'status' => 'draft',
        'sort_order' => 11,
    ])->assertSessionHasErrors('badge_label');
});

it('publishes scheduled content once when it becomes due', function (): void {
    $post = Post::query()->create(['type' => PostType::Podcast, 'title' => 'Episódio', 'slug' => 'episodio', 'status' => ContentStatus::Scheduled, 'published_at' => now()->subMinute(), 'external_url' => 'https://example.org/audio']);

    $this->artisan('cms:publish-scheduled')->assertSuccessful();
    $this->artisan('cms:publish-scheduled')->assertSuccessful();

    expect($post->fresh()->status)->toBe(ContentStatus::Published);
    $this->assertDatabaseCount('audit_logs', 1);
});

it('protects system groups, self demotion and the last administrator', function (): void {
    $admin = $this->cmsUser();
    $administrator = Role::query()->where('slug', 'administrator')->firstOrFail();

    $this->actingAs($admin)->delete(route('admin.roles.destroy', $administrator))->assertForbidden();
    $this->actingAs($admin)->put(route('admin.users.update', $admin), ['name' => $admin->name, 'email' => $admin->email, 'roles' => [Role::query()->where('slug', 'editor')->value('id')]])
        ->assertRedirect(route('admin.users.edit', $admin))
        ->assertSessionHasErrors('roles');
    $this->actingAs($admin)->delete(route('admin.users.destroy', $admin))->assertForbidden();
});
