<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property string|null $title
 * @property string|null $description
 * @property string|null $instructions
 * @property int|null $max_applications
 * @property bool $allow_editing
 * @property Carbon|null $edit_deadline
 * @property bool $requires_authentication
 * @property bool $one_per_user
 * @property string|null $success_message
 * @property string|null $confirmation_message
 */
class ProjectRegistrationSetting extends Model
{
    protected $fillable = [
        'title', 'description', 'instructions', 'max_applications', 'allow_editing', 'edit_deadline',
        'requires_authentication', 'one_per_user', 'success_message', 'confirmation_message',
    ];

    protected function casts(): array
    {
        return [
            'max_applications' => 'integer', 'allow_editing' => 'boolean', 'edit_deadline' => 'datetime',
            'requires_authentication' => 'boolean', 'one_per_user' => 'boolean',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
