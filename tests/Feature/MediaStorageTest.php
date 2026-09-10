<?php

use App\Models\MediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('stores new CMS uploads on the configured media disk', function (): void {
    Storage::fake('r2');
    config(['filesystems.media_disk' => 'r2']);
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.posts.store'), [
        'type' => 'article',
        'title' => 'Conteúdo no R2',
        'slug' => 'conteudo-no-r2',
        'status' => 'draft',
        'cover' => UploadedFile::fake()->image('capa-r2.jpg', 1200, 675),
        'cover_alt' => 'Atividade comunitária do Instituto Azon Social',
    ])->assertRedirect();

    $asset = MediaAsset::query()->where('original_name', 'capa-r2.jpg')->firstOrFail();
    expect($asset->disk)->toBe('r2');
    Storage::disk('r2')->assertExists($asset->path);
});

it('migrates local media to R2 idempotently while preserving the source copy', function (): void {
    Storage::fake('public');
    Storage::fake('r2');
    Storage::disk('public')->put('posts/existing-image.webp', 'image-content');
    $asset = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'posts/existing-image.webp',
        'original_name' => 'existing-image.webp',
        'mime_type' => 'image/webp',
        'size' => 13,
        'alt_text' => 'Imagem existente',
    ]);

    $this->artisan('media:migrate-storage --from=public --to=r2')
        ->assertSuccessful();

    expect($asset->fresh()->disk)->toBe('r2');
    Storage::disk('r2')->assertExists('posts/existing-image.webp');
    Storage::disk('public')->assertExists('posts/existing-image.webp');

    $this->artisan('media:migrate-storage --from=public --to=r2 --delete-source')
        ->assertSuccessful();
    $this->assertDatabaseCount('media_assets', 1);
    Storage::disk('public')->assertMissing('posts/existing-image.webp');
    Storage::disk('r2')->assertExists('posts/existing-image.webp');
});

it('replaces a same-size collision before removing the source media', function (): void {
    Storage::fake('public');
    Storage::fake('r2');
    Storage::disk('public')->put('posts/collision.webp', 'correct-content');
    Storage::disk('r2')->put('posts/collision.webp', 'incorrect-bytes');
    $asset = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'posts/collision.webp',
        'original_name' => 'collision.webp',
        'mime_type' => 'image/webp',
        'size' => 15,
        'alt_text' => 'Imagem com colisão de caminho',
    ]);

    $this->artisan('media:migrate-storage --from=public --to=r2 --delete-source')
        ->assertSuccessful();

    expect($asset->fresh()->disk)->toBe('r2')
        ->and(Storage::disk('r2')->get('posts/collision.webp'))->toBe('correct-content');
    Storage::disk('public')->assertMissing('posts/collision.webp');
});

it('fails when the source disk does not confirm deletion', function (): void {
    $source = Mockery::mock();
    $target = Mockery::mock();
    $stream = static function (string $contents) {
        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $contents);
        rewind($handle);

        return $handle;
    };

    $source->shouldReceive('exists')->andReturnTrue();
    $source->shouldReceive('readStream')->andReturnUsing(fn () => $stream('image-content'));
    $source->shouldReceive('delete')->once()->andReturnFalse();
    $target->shouldReceive('exists')->andReturnFalse();
    $target->shouldReceive('put')->once()->andReturnTrue();
    $target->shouldReceive('readStream')->andReturnUsing(fn () => $stream('image-content'));
    Storage::shouldReceive('disk')->with('public')->andReturn($source);
    Storage::shouldReceive('disk')->with('r2')->andReturn($target);

    $asset = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'posts/delete-failure.webp',
        'original_name' => 'delete-failure.webp',
        'mime_type' => 'image/webp',
        'size' => 13,
        'alt_text' => 'Imagem cuja origem não pode ser removida',
    ]);

    $this->artisan('media:migrate-storage --from=public --to=r2 --delete-source')
        ->assertFailed();

    expect($asset->fresh()->disk)->toBe('r2');
});
