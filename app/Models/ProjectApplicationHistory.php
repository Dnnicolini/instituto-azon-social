<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $application_id
 * @property int|null $user_id
 * @property string $event
 * @property string|null $from_status
 * @property string|null $to_status
 * @property string|null $note
 * @property bool $is_internal
 * @property Carbon|null $created_at
 * @property User|null $user
 */
class ProjectApplicationHistory extends Model
{
    protected $fillable = ['application_id', 'user_id', 'event', 'from_status', 'to_status', 'note', 'is_internal', 'metadata'];

    protected function casts(): array
    {
        return ['is_internal' => 'boolean', 'metadata' => 'array'];
    }

    /** @return BelongsTo<ProjectApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ProjectApplication::class, 'application_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
