<?php

namespace App\Console\Commands;

use App\Services\InstagramFeedSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class SyncInstagramFeedCommand extends Command
{
    protected $signature = 'instagram:sync {--limit= : Quantidade máxima de publicações}';

    protected $description = 'Sincroniza automaticamente as publicações da conta oficial do Instagram';

    public function handle(InstagramFeedSynchronizer $synchronizer): int
    {
        $limit = $this->option('limit');

        try {
            $result = $synchronizer->sync(is_numeric($limit) ? (int) $limit : null);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Instagram sincronizado: {$result['created']} nova(s), {$result['updated']} atualizada(s).");

        return self::SUCCESS;
    }
}
