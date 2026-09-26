<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $project_id
 * @property int $version
 * @property Collection<int, ProjectRegistrationField> $fields
 */
class ProjectRegistrationForm extends Model
{
    protected $fillable = ['project_id', 'version'];

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return HasMany<ProjectRegistrationField, $this> */
    public function fields(): HasMany
    {
        return $this->hasMany(ProjectRegistrationField::class, 'form_id')->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }
}
