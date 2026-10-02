<?php

namespace App\Console\Commands;

use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class RefreshInstagramTokenCommand extends Command
{
    protected $signature = 'instagram:refresh-token';

    protected $description = 'Renova com segurança o token de longa duração do Instagram';

    public function handle(InstagramFeedSynchronizer $synchronizer): int
    {
        $refreshed = 0;
        $failed = 0;
        SocialIntegration::query()->where('provider', 'instagram')->where('enabled', true)->whereNotNull('access_token')
            ->eachById(function (SocialIntegration $integration) use ($synchronizer, &$refreshed, &$failed): void {
                try {
                    $refreshed += $synchronizer->refreshToken($integration) ? 1 : 0;
                } catch (Throwable) {
                    $failed++;
                    $this->error("Não foi possível renovar a conta #{$integration->id}; consulte os logs da aplicação.");
                }
            });

        if ($failed > 0) {
            $this->line("{$refreshed} token(s) renovado(s); {$failed} conta(s) com falha.");

            return self::FAILURE;
        }

        $this->line($refreshed > 0 ? "{$refreshed} token(s) do Instagram renovado(s)." : 'Nenhuma renovação do Instagram era necessária.');

        return self::SUCCESS;
    }
}
