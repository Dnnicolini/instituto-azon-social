<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property int $field_id
 * @property mixed $value
 * @property ProjectRegistrationField $field
 */
class ProjectApplicationAnswer extends Model
{
    protected $fillable = ['application_id', 'field_id', 'value'];

    protected function casts(): array
    {
        return ['value' => 'json'];
    }

    /** @return BelongsTo<ProjectApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ProjectApplication::class, 'application_id');
    }

    /** @return BelongsTo<ProjectRegistrationField, $this> */
    public function field(): BelongsTo
    {
        return $this->belongsTo(ProjectRegistrationField::class, 'field_id');
    }
}
