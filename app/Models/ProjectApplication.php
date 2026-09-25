<?php

namespace App\Models;

use App\Enums\ProjectApplicationStatus;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property int|null $user_id
 * @property string|null $protocol
 * @property ProjectApplicationStatus $status
 * @property string|null $applicant_name
 * @property string|null $applicant_email
 * @property string|null $applicant_cpf
 * @property Carbon|null $submitted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Project $project
 * @property User|null $user
 * @property Collection<int, ProjectApplicationAnswer> $answers
 * @property Collection<int, ProjectApplicationFile> $files
 * @property Collection<int, ProjectApplicationHistory> $histories
 */
class ProjectApplication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'user_id', 'protocol', 'status', 'applicant_name', 'applicant_email', 'applicant_cpf',
        'submitted_at', 'ip_hash',
    ];

    protected function casts(): array
    {
        return ['status' => ProjectApplicationStatus::class, 'submitted_at' => 'datetime'];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ProjectApplicationAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(ProjectApplicationAnswer::class, 'application_id');
    }

    /** @return HasMany<ProjectApplicationFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ProjectApplicationFile::class, 'application_id');
    }

    /** @return HasMany<ProjectApplicationHistory, $this> */
    public function histories(): HasMany
    {
        return $this->hasMany(ProjectApplicationHistory::class, 'application_id')->latest('id');
    }
}
