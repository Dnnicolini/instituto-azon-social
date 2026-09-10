<?php

namespace App\Console\Commands;

use App\Models\MediaAsset;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MigrateMediaStorageCommand extends Command
{
    protected $signature = 'media:migrate-storage
        {--from=public : Disco de origem}
        {--to=r2 : Disco de destino}
        {--delete-source : Remove a cópia de origem somente após validar o destino}';

    protected $description = 'Copia mídias do CMS entre discos e atualiza cada registro de forma idempotente';

    public function handle(): int
    {
        $sourceDisk = trim((string) $this->option('from'));
        $targetDisk = trim((string) $this->option('to'));
        $deleteSource = (bool) $this->option('delete-source');

        if ($sourceDisk === '' || $targetDisk === '' || $sourceDisk === $targetDisk) {
            $this->error('Informe discos de origem e destino diferentes.');

            return self::INVALID;
        }

        if (! array_key_exists($sourceDisk, (array) config('filesystems.disks'))
            || ! array_key_exists($targetDisk, (array) config('filesystems.disks'))) {
            $this->error('O disco de origem ou destino não está configurado.');

            return self::INVALID;
        }

        $migrated = 0;
        $skipped = 0;
        $deleted = 0;
        $failed = 0;

        MediaAsset::query()
            ->when(
                $deleteSource,
                fn ($query) => $query->whereIn('disk', [$sourceDisk, $targetDisk]),
                fn ($query) => $query->where('disk', $sourceDisk),
            )
            ->orderBy('id')
            ->chunkById(100, function ($assets) use (
                $sourceDisk,
                $targetDisk,
                $deleteSource,
                &$migrated,
                &$skipped,
                &$deleted,
                &$failed,
            ): void {
                foreach ($assets as $asset) {
                    try {
                        if (! Storage::disk($sourceDisk)->exists($asset->path)) {
                            if ($asset->disk === $targetDisk) {
                                $skipped++;

                                continue;
                            }

                            $this->warn("Arquivo de origem ausente: {$asset->path}");
                            $failed++;

                            continue;
                        }

                        $sourceChecksum = $this->checksum($sourceDisk, $asset->path);
                        $targetExists = Storage::disk($targetDisk)->exists($asset->path);
                        $targetMatches = $targetExists
                            && hash_equals($sourceChecksum, $this->checksum($targetDisk, $asset->path));

                        if (! $targetMatches) {
                            $stream = Storage::disk($sourceDisk)->readStream($asset->path);
                            if (! is_resource($stream)) {
                                throw new \RuntimeException('Não foi possível abrir o arquivo de origem.');
                            }

                            try {
                                $written = Storage::disk($targetDisk)->put($asset->path, $stream, [
                                    'ContentType' => $asset->mime_type,
                                    'CacheControl' => 'public, max-age=31536000, immutable',
                                ]);
                            } finally {
                                fclose($stream);
                            }

                            if (! $written) {
                                throw new \RuntimeException('O destino não confirmou o envio do arquivo.');
                            }
                        } elseif ($asset->disk !== $targetDisk || ! $deleteSource) {
                            $skipped++;
                        }

                        if (! hash_equals($sourceChecksum, $this->checksum($targetDisk, $asset->path))) {
                            throw new \RuntimeException('O checksum do arquivo no destino não corresponde à origem.');
                        }

                        if ($asset->disk !== $targetDisk) {
                            $asset->update(['disk' => $targetDisk]);
                            $migrated++;
                        }
                        if ($deleteSource) {
                            if (! Storage::disk($sourceDisk)->delete($asset->path)) {
                                throw new \RuntimeException('O disco de origem não confirmou a remoção do arquivo.');
                            }
                            $deleted++;
                        }
                    } catch (Throwable $exception) {
                        report($exception);
                        $this->error("Falha ao migrar {$asset->path}.");
                        $failed++;
                    }
                }
            });

        $this->table(
            ['Migrados', 'Ignorados', 'Origens removidas', 'Falhas'],
            [[$migrated, $skipped, $deleted, $failed]],
        );

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function checksum(string $disk, string $path): string
    {
        $stream = Storage::disk($disk)->readStream($path);
        if (! is_resource($stream)) {
            throw new \RuntimeException('Não foi possível ler o arquivo para validação.');
        }

        try {
            $context = hash_init('sha256');
            hash_update_stream($context, $stream);

            return hash_final($context);
        } finally {
            fclose($stream);
        }
    }
}
