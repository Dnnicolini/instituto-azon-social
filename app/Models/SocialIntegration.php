<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * @property bool $enabled
 * @property string|null $access_token
 * @property string|null $account_id
 * @property string|null $username
 * @property CarbonInterface|null $token_expires_at
 * @property CarbonInterface|null $last_synced_at
 * @property string|null $last_error
 */
class SocialIntegration extends Model
{
    protected $fillable = [
        'provider',
        'account_id',
        'username',
        'access_token',
        'enabled',
        'token_expires_at',
        'last_synced_at',
        'last_error',
    ];

    protected $hidden = ['access_token'];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'enabled' => 'boolean',
            'token_expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }
}
