<?php

namespace App\Console\Commands;

use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class SyncInstagramFeedCommand extends Command
{
    protected $signature = 'instagram:sync {--limit= : Quantidade máxima de publicações}';

    protected $description = 'Sincroniza automaticamente as publicações da conta oficial do Instagram';

    public function handle(InstagramFeedSynchronizer $synchronizer): int
    {
        $storedIntegrationIsActive = SocialIntegration::query()
            ->where('provider', 'instagram')
            ->where('enabled', true)
            ->whereNotNull('access_token')
            ->exists();
        $environmentIntegrationIsActive = (bool) config('services.instagram.enabled')
            && filled(config('services.instagram.access_token'));

        if (! $storedIntegrationIsActive && ! $environmentIntegrationIsActive) {
            $this->line('Instagram ainda não conectado; sincronização automática ignorada.');

            return self::SUCCESS;
        }

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
