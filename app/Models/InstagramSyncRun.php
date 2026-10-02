<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstagramSyncRun extends Model
{
    protected $fillable = [
        'social_integration_id', 'trigger', 'status', 'processed_count', 'created_count', 'updated_count',
        'error_message', 'started_at', 'finished_at',
    ];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'finished_at' => 'datetime'];
    }

    /** @return BelongsTo<SocialIntegration, $this> */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(SocialIntegration::class, 'social_integration_id');
    }
}
