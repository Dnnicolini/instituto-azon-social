<?php

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\ContactMessage;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Post;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Http\UploadedFile;
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

it('keeps Instagram account connection exclusive to administrators', function (): void {
    config([
        'services.instagram.client_id' => 'instagram-app-id',
        'services.instagram.client_secret' => 'instagram-app-secret',
    ]);
    $publisher = $this->cmsUser('publisher');
    $administrator = $this->cmsUser('administrator');

    $this->actingAs($publisher)
        ->get(route('admin.instagram.connect'))
        ->assertForbidden();
    $this->actingAs($administrator)
        ->get(route('admin.instagram.connect'))
        ->assertRedirectContains('https://www.instagram.com/oauth/authorize?')
        ->assertSessionHas('instagram_oauth_state');
});

it('does not allow CRM permissions in delegated groups', function (): void {
    $administrator = $this->cmsUser('administrator');
    $crmPermission = Permission::query()->where('slug', 'messages.view')->firstOrFail();

    $this->actingAs($administrator)->post(route('admin.roles.store'), [
        'name' => 'Atendimento delegado',
        'slug' => 'delegated-support',
        'permissions' => [$crmPermission->id],
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

    $this->actingAs($manager)->post(route('admin.roles.store'), [
        'name' => 'Grupo indevido',
        'slug' => 'improper-group',
        'permissions' => [$settingsPermission->id],
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

it('rejects oversized image dimensions for projects and events', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.projects.store'), [
        'title' => 'Projeto com capa enorme',
        'slug' => 'projeto-com-capa-enorme',
        'status' => 'draft',
        'sort_order' => 0,
        'cover' => UploadedFile::fake()->image('projeto.png', 5001, 20),
        'cover_alt' => 'Capa muito larga',
    ])->assertSessionHasErrors('cover');

    $this->actingAs($publisher)->post(route('admin.events.store'), [
        'title' => 'Evento com capa enorme',
        'slug' => 'evento-com-capa-enorme',
        'status' => 'draft',
        'location' => 'Sepetiba, Rio de Janeiro',
        'cover' => UploadedFile::fake()->image('evento.png', 20, 5001),
        'cover_alt' => 'Capa muito alta',
    ])->assertSessionHasErrors('cover');
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
    $this->actingAs($admin)->put(route('admin.users.update', $admin), ['name' => $admin->name, 'email' => $admin->email, 'roles' => [Role::query()->where('slug', 'editor')->value('id')]])->assertUnprocessable();
    $this->actingAs($admin)->delete(route('admin.users.destroy', $admin))->assertForbidden();
});
