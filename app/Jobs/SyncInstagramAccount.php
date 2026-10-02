<?php

namespace App\Jobs;

use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncInstagramAccount implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 180;

    public int $uniqueFor = 300;

    public function __construct(
        public int $integrationId,
        public string $trigger = 'scheduled',
        public ?int $limit = null,
    ) {}

    public function uniqueId(): string
    {
        return (string) $this->integrationId;
    }

    public function handle(InstagramFeedSynchronizer $synchronizer): void
    {
        $integration = SocialIntegration::query()->find($this->integrationId);
        if (! $integration || ! $integration->enabled || $integration->paused_at || blank($integration->access_token)) {
            return;
        }
        $synchronizer->syncAccount($integration, $this->limit, $this->trigger);
    }
}
