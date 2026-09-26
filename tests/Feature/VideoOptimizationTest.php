<?php

use App\Jobs\OptimizeVideoAsset;
use App\Models\MediaAsset;
use Illuminate\Support\Facades\Storage;

it('replaces a gallery video only after producing an optimized mp4', function (): void {
    Storage::fake('public');
    Storage::disk('public')->put('cms/videos/original.mov', str_repeat('a', 1024));
    $asset = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/videos/original.mov',
        'original_name' => 'original.mov',
        'mime_type' => 'video/quicktime',
        'size' => 1024,
    ]);

    $fakeFfmpeg = tempnam(sys_get_temp_dir(), 'azon-fake-ffmpeg-');
    expect($fakeFfmpeg)->not->toBeFalse();
    file_put_contents($fakeFfmpeg, <<<'SH'
#!/bin/sh
input=''
output=''
previous=''
for argument in "$@"; do
    if [ "$previous" = '-i' ]; then
        input="$argument"
    fi
    previous="$argument"
    output="$argument"
done
head -c 128 "$input" > "$output"
SH);
    chmod($fakeFfmpeg, 0700);
    config(['services.ffmpeg.binary' => $fakeFfmpeg]);

    try {
        (new OptimizeVideoAsset($asset->id))->handle();
    } finally {
        @unlink($fakeFfmpeg);
    }

    $asset->refresh();
    expect($asset->path)->toEndWith('-optimized-'.$asset->id.'.mp4')
        ->and($asset->mime_type)->toBe('video/mp4')
        ->and($asset->size)->toBe(128);
    Storage::disk('public')->assertMissing('cms/videos/original.mov');
    Storage::disk('public')->assertExists($asset->path);
});

it('preserves the original video when optimization fails', function (): void {
    Storage::fake('public');
    Storage::disk('public')->put('cms/videos/keep-original.mov', 'original-video');
    $asset = MediaAsset::query()->create([
        'disk' => 'public',
        'path' => 'cms/videos/keep-original.mov',
        'original_name' => 'keep-original.mov',
        'mime_type' => 'video/quicktime',
        'size' => 14,
    ]);
    config(['services.ffmpeg.binary' => '/bin/false']);

    expect(fn () => (new OptimizeVideoAsset($asset->id))->handle())
        ->toThrow('RuntimeException', 'O FFmpeg não conseguiu otimizar');

    expect($asset->fresh()->path)->toBe('cms/videos/keep-original.mov')
        ->and($asset->fresh()->mime_type)->toBe('video/quicktime');
    Storage::disk('public')->assertExists('cms/videos/keep-original.mov');
});
