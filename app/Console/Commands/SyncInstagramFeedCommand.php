<?php

namespace App\Console\Commands;

use App\Jobs\SyncInstagramAccount;
use App\Models\SocialIntegration;
use Illuminate\Console\Command;

class SyncInstagramFeedCommand extends Command
{
    protected $signature = 'instagram:sync {--limit= : Quantidade máxima de publicações}';

    protected $description = 'Sincroniza automaticamente as publicações da conta oficial do Instagram';

    public function handle(): int
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

        if (! $storedIntegrationIsActive) {
            $username = strtolower(ltrim((string) config('services.instagram.username', 'azon.social'), '@'));
            $integration = SocialIntegration::query()->firstOrCreate(
                ['provider' => 'instagram', 'expected_username' => $username],
                ['display_name' => 'Instituto Azon Social'],
            );
            $integration->update([
                'account_id' => config('services.instagram.account_id'),
                'username' => $username,
                'access_token' => config('services.instagram.access_token'),
                'token_expires_at' => config('services.instagram.token_expires_at'),
                'enabled' => true,
                'paused_at' => null,
            ]);
        }

        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT);
        $limit = is_int($limit) ? min(max($limit, 1), 100) : null;

        $integrations = SocialIntegration::query()->where('provider', 'instagram')->where('enabled', true)
            ->whereNull('paused_at')->whereNotNull('access_token')->pluck('id');
        foreach ($integrations as $integrationId) {
            SyncInstagramAccount::dispatch((int) $integrationId, 'scheduled', $limit);
        }
        $this->info("Sincronização do Instagram enfileirada para {$integrations->count()} conta(s).");

        return self::SUCCESS;
    }
}
