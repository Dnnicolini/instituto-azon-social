<?php

use App\Enums\ContentStatus;
use App\Models\Document;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false, 'filesystems.media_disk' => 'r2']);
    Storage::fake('local', (array) config('filesystems.disks.local'));
    Storage::fake('public');
    Storage::fake('r2');
});

it('stores document uploads privately regardless of the media disk', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.documents.store'), [
        'title' => 'Relatório anual',
        'slug' => 'relatorio-anual',
        'status' => 'draft',
        'file' => UploadedFile::fake()->create('relatorio.pdf', 10, 'application/pdf'),
    ])->assertRedirect();

    $document = Document::query()->with('media')->where('slug', 'relatorio-anual')->firstOrFail();
    expect($document->media?->disk)->toBe('local');
    Storage::disk('local')->assertExists((string) $document->media?->path);
    expect(Storage::disk('local')->visibility((string) $document->media?->path))->toBe('private');
    Storage::disk('public')->assertMissing((string) $document->media?->path);
    Storage::disk('r2')->assertMissing((string) $document->media?->path);

    $this->actingAs($publisher)->get(route('admin.documents.edit', $document))->assertInertia(
        fn (Assert $page): Assert => $page->where('item.file_url', route('admin.documents.file', $document)),
    );

    $this->actingAs($publisher)->put(route('admin.documents.update', $document), [
        'title' => 'Relatório revisado',
        'slug' => 'relatorio-anual',
        'status' => 'draft',
        'file' => UploadedFile::fake()->create('revisado.pdf', 10, 'application/pdf'),
    ])->assertRedirect();

    $document->refresh()->load('media');
    expect($document->media?->disk)->toBe('local');
    Storage::disk('local')->assertExists((string) $document->media?->path);
});

it('serves only published and due private PDFs on the public route', function (): void {
    Storage::disk('local')->put('cms/documents/relatorio.pdf', '%PDF-1.4');
    $asset = MediaAsset::query()->create([
        'disk' => 'local', 'path' => 'cms/documents/relatorio.pdf', 'original_name' => 'relatorio.pdf',
        'mime_type' => 'application/pdf', 'size' => 8,
    ]);
    $draft = Document::query()->create(['media_asset_id' => $asset->id, 'title' => 'Rascunho', 'slug' => 'rascunho', 'status' => ContentStatus::Draft]);
    $future = Document::query()->create(['media_asset_id' => $asset->id, 'title' => 'Futuro', 'slug' => 'futuro', 'status' => ContentStatus::Published, 'published_at' => now()->addDay()]);
    $published = Document::query()->create(['media_asset_id' => $asset->id, 'title' => 'Publicado', 'slug' => 'publicado', 'status' => ContentStatus::Published, 'published_at' => now()->subMinute()]);

    $this->get(route('documents.file', $draft))->assertNotFound();
    $this->get(route('documents.file', $future))->assertNotFound();
    $this->get(route('documents.file', $published))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Cache-Control', 'no-store, private');

    $this->get(route('home'))->assertInertia(
        fn (Assert $page): Assert => $page->has('documents', 1)->where('documents.0.file_url', route('documents.file', $published)),
    );

    $published->delete();
    $this->get(route('documents.file', $published))->assertNotFound();
});

it('requires document view permission for a draft preview and prevents caching', function (): void {
    Storage::disk('local')->put('cms/documents/rascunho.pdf', '%PDF-1.4');
    $asset = MediaAsset::query()->create([
        'disk' => 'local', 'path' => 'cms/documents/rascunho.pdf', 'original_name' => 'rascunho.pdf',
        'mime_type' => 'application/pdf', 'size' => 8,
    ]);
    $document = Document::query()->create(['media_asset_id' => $asset->id, 'title' => 'Rascunho', 'slug' => 'rascunho', 'status' => ContentStatus::Draft]);

    $this->get(route('admin.documents.file', $document))->assertRedirect(route('admin.login'));
    $this->actingAs(User::factory()->create())->get(route('admin.documents.file', $document))->assertForbidden();
    $this->actingAs($this->cmsUser('editor'))->get(route('admin.documents.file', $document))
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
});

it('does not serve a legacy public document or move it into R2', function (): void {
    Storage::disk('public')->put('cms/documents/legacy.pdf', '%PDF-1.4');
    $asset = MediaAsset::query()->create([
        'disk' => 'public', 'path' => 'cms/documents/legacy.pdf', 'original_name' => 'legacy.pdf',
        'mime_type' => 'application/pdf', 'size' => 8,
    ]);
    $document = Document::query()->create(['media_asset_id' => $asset->id, 'title' => 'Legado', 'slug' => 'legado', 'status' => ContentStatus::Published, 'published_at' => now()->subMinute()]);

    $this->get(route('documents.file', $document))->assertNotFound();
    $this->get(route('home'))->assertInertia(fn (Assert $page): Assert => $page->has('documents', 0));
    $this->artisan('media:migrate-storage --from=public --to=r2')->assertFailed();
    expect($asset->fresh()->disk)->toBe('public');
    Storage::disk('r2')->assertMissing($asset->path);
});
