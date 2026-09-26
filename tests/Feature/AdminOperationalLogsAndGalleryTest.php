<?php

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\AuditLog;
use App\Models\Post;
use App\Models\Project;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

it('shows sanitized operational activity only to administrators', function (): void {
    $administrator = $this->cmsUser('administrator');
    $publisher = $this->cmsUser('publisher');
    AuditLog::query()->create([
        'user_id' => $administrator->id,
        'action' => 'post.updated',
        'auditable_type' => Post::class,
        'auditable_id' => 42,
        'metadata' => ['secret' => 'must-not-leak'],
        'ip_hash' => str_repeat('a', 64),
    ]);
    DB::table('failed_jobs')->insert([
        'uuid' => '12345678-1234-1234-1234-123456789012',
        'connection' => 'database',
        'queue' => 'default',
        'payload' => '{"password":"must-not-leak"}',
        'exception' => 'stack trace must-not-leak',
        'failed_at' => now(),
    ]);

    $this->actingAs($publisher)->get(route('admin.logs.index'))->assertForbidden();

    $this->actingAs($administrator)->get(route('admin.logs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/logs')
            ->where('activities.data.0.action', 'post.updated')
            ->where('activities.data.0.user', $administrator->name)
            ->missing('activities.data.0.metadata')
            ->missing('activities.data.0.ip_hash')
            ->where('failedJobs.0.reference', '12345678')
            ->missing('failedJobs.0.payload')
            ->missing('failedJobs.0.exception'));
});

it('keeps articles, media and social posts in separate admin lists', function (): void {
    $publisher = $this->cmsUser('publisher');
    Post::query()->create(['type' => PostType::Article, 'title' => 'Artigo isolado', 'slug' => 'artigo-isolado', 'status' => ContentStatus::Draft]);
    Post::query()->create(['type' => PostType::Social, 'title' => 'Postagem social isolada', 'slug' => 'social-isolada', 'status' => ContentStatus::Draft]);
    Post::query()->create(['type' => PostType::Video, 'title' => 'Vídeo isolado', 'slug' => 'video-isolado', 'status' => ContentStatus::Draft]);

    $this->actingAs($publisher)->get(route('admin.posts.index'))
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('section', 'article')
            ->where('items.total', 1)
            ->where('items.data.0.title', 'Artigo isolado'));
    $this->actingAs($publisher)->get(route('admin.posts.index', ['type' => 'social']))
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('section', 'social')
            ->where('items.total', 1)
            ->where('items.data.0.title', 'Postagem social isolada'));
});

it('stores multiple gallery photos while keeping a distinct cover', function (): void {
    Storage::fake('public');
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'article',
        'title' => 'História com galeria',
        'slug' => 'historia-com-galeria',
        'status' => 'draft',
        'cover' => UploadedFile::fake()->image('capa.jpg', 1200, 675),
        'cover_alt' => 'Foto de capa',
        'gallery' => [
            UploadedFile::fake()->image('foto-1.jpg', 1200, 675),
            UploadedFile::fake()->image('foto-2.webp', 1200, 675),
        ],
    ])->assertRedirect();

    $post = Post::query()->where('slug', 'historia-com-galeria')->with(['cover', 'galleryImages.media'])->firstOrFail();
    expect($post->cover)->not->toBeNull()
        ->and($post->galleryImages)->toHaveCount(2)
        ->and($post->galleryImages->pluck('media_asset_id'))->not->toContain($post->cover_media_id);

    $removed = $post->galleryImages->firstOrFail();
    $this->actingAs($publisher)->put(route('admin.posts.update', $post), [
        'type' => 'article',
        'title' => $post->title,
        'slug' => $post->slug,
        'status' => 'draft',
        'remove_gallery_ids' => [$removed->id],
    ])->assertRedirect();

    expect($post->galleryImages()->count())->toBe(1);
});

it('links posts to social programs without mixing their records', function (): void {
    $publisher = $this->cmsUser('publisher');
    $project = Project::query()->create([
        'title' => 'Programa Juventude',
        'slug' => 'programa-juventude',
        'summary' => 'Programa social',
        'status' => ContentStatus::Draft,
    ]);

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'article',
        'title' => 'História do programa',
        'slug' => 'historia-do-programa',
        'status' => 'draft',
        'project_ids' => [$project->id],
    ])->assertRedirect();

    $post = Post::query()->where('slug', 'historia-do-programa')->firstOrFail();
    expect($post->projects()->pluck('projects.id')->all())->toBe([$project->id])
        ->and($project->relatedPosts()->pluck('posts.id')->all())->toBe([$post->id]);
});
