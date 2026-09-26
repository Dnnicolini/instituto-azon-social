<?php

namespace App\Jobs;

use App\Models\MediaAsset;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class OptimizeVideoAsset implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 900;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900];

    public function __construct(public int $mediaAssetId)
    {
        $this->afterCommit();
    }

    public function handle(): void
    {
        $asset = MediaAsset::query()->find($this->mediaAssetId);
        if ($asset === null
            || ! str_starts_with((string) $asset->mime_type, 'video/')
            || str_contains($asset->path, '-optimized-'.$asset->id.'.mp4')) {
            return;
        }

        $temporaryDirectory = sys_get_temp_dir().'/azon-video-'.Str::uuid();
        if (! mkdir($temporaryDirectory, 0700, true) && ! is_dir($temporaryDirectory)) {
            throw new RuntimeException('Não foi possível preparar o diretório temporário do vídeo.');
        }

        $extension = pathinfo($asset->path, PATHINFO_EXTENSION) ?: 'video';
        $inputPath = $temporaryDirectory.'/input.'.$extension;
        $outputPath = $temporaryDirectory.'/optimized.mp4';

        try {
            $source = Storage::disk($asset->disk)->readStream($asset->path);
            if (! is_resource($source)) {
                throw new RuntimeException('Não foi possível ler o vídeo original.');
            }

            $destination = fopen($inputPath, 'wb');
            if (! is_resource($destination)) {
                fclose($source);
                throw new RuntimeException('Não foi possível preparar a cópia temporária do vídeo.');
            }

            stream_copy_to_stream($source, $destination);
            fclose($source);
            fclose($destination);

            $result = Process::timeout(840)->run([
                (string) config('services.ffmpeg.binary', 'ffmpeg'),
                '-nostdin',
                '-hide_banner',
                '-loglevel',
                'error',
                '-y',
                '-i',
                $inputPath,
                '-map',
                '0:v:0',
                '-map',
                '0:a?',
                '-vf',
                "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
                '-c:v',
                'libx264',
                '-preset',
                'medium',
                '-crf',
                '22',
                '-pix_fmt',
                'yuv420p',
                '-c:a',
                'aac',
                '-b:a',
                '128k',
                '-movflags',
                '+faststart',
                '-threads',
                '1',
                $outputPath,
            ]);

            if (! $result->successful() || ! is_file($outputPath) || filesize($outputPath) === 0) {
                throw new RuntimeException('O FFmpeg não conseguiu otimizar o vídeo enviado.');
            }

            $optimizedSize = filesize($outputPath);
            if (! is_int($optimizedSize)) {
                throw new RuntimeException('Não foi possível conferir o vídeo otimizado.');
            }

            $mustConvertFormat = $asset->mime_type !== 'video/mp4';
            if (! $mustConvertFormat && $optimizedSize >= (int) $asset->size) {
                return;
            }

            $optimizedPath = pathinfo($asset->path, PATHINFO_DIRNAME).'/'
                .pathinfo($asset->path, PATHINFO_FILENAME)
                .'-optimized-'.$asset->id.'.mp4';
            $optimizedStream = fopen($outputPath, 'rb');
            if (! is_resource($optimizedStream)) {
                throw new RuntimeException('Não foi possível ler o vídeo otimizado.');
            }

            $stored = Storage::disk($asset->disk)->put($optimizedPath, $optimizedStream);
            fclose($optimizedStream);
            if (! $stored) {
                throw new RuntimeException('Não foi possível armazenar o vídeo otimizado.');
            }

            $originalPath = $asset->path;
            $asset->update([
                'path' => $optimizedPath,
                'mime_type' => 'video/mp4',
                'size' => $optimizedSize,
                'width' => null,
                'height' => null,
            ]);
            Storage::disk($asset->disk)->delete($originalPath);
        } finally {
            foreach ([$inputPath, $outputPath] as $temporaryFile) {
                if (is_file($temporaryFile)) {
                    @unlink($temporaryFile);
                }
            }
            @rmdir($temporaryDirectory);
        }
    }

    public function failed(?Throwable $exception): void
    {
        report($exception ?? new RuntimeException('Falha desconhecida ao otimizar vídeo.'));
    }
}
