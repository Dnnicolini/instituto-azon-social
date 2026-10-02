<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property bool $enabled
 * @property string|null $access_token
 * @property string|null $account_id
 * @property string|null $username
 * @property string|null $display_name
 * @property string|null $expected_username
 * @property string|null $group_key
 * @property array<int, string>|null $display_locations
 * @property CarbonInterface|null $token_expires_at
 * @property CarbonInterface|null $last_synced_at
 * @property CarbonInterface|null $last_successful_sync_at
 * @property string|null $last_error
 */
class SocialIntegration extends Model
{
    protected $fillable = [
        'provider',
        'display_name',
        'account_id',
        'username',
        'expected_username',
        'description',
        'group_key',
        'sort_order',
        'access_token',
        'enabled',
        'public_enabled',
        'auto_publish',
        'display_locations',
        'paused_at',
        'token_expires_at',
        'last_synced_at',
        'last_successful_sync_at',
        'last_error',
        'imported_posts_count',
    ];

    protected $hidden = ['access_token'];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'enabled' => 'boolean',
            'public_enabled' => 'boolean',
            'auto_publish' => 'boolean',
            'display_locations' => 'array',
            'paused_at' => 'datetime',
            'token_expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'last_successful_sync_at' => 'datetime',
            'imported_posts_count' => 'integer',
        ];
    }

    /** @return HasMany<Post, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'social_integration_id');
    }

    /** @return HasMany<Page, $this> */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    /** @return HasMany<InstagramSyncRun, $this> */
    public function syncRuns(): HasMany
    {
        return $this->hasMany(InstagramSyncRun::class, 'social_integration_id');
    }
}
