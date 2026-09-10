<?php

namespace App\Console\Commands;

use App\Services\InstagramFeedSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class RefreshInstagramTokenCommand extends Command
{
    protected $signature = 'instagram:refresh-token';

    protected $description = 'Renova com segurança o token de longa duração do Instagram';

    public function handle(InstagramFeedSynchronizer $synchronizer): int
    {
        try {
            $refreshed = $synchronizer->refreshToken();
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->line($refreshed ? 'Token do Instagram renovado.' : 'Nenhuma renovação do Instagram era necessária.');

        return self::SUCCESS;
    }
}
