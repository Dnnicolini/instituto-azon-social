<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property int $field_id
 * @property string $disk
 * @property string $path
 * @property string $original_name
 * @property string $mime_type
 * @property int $size
 * @property ProjectRegistrationField $field
 */
class ProjectApplicationFile extends Model
{
    protected $fillable = ['application_id', 'field_id', 'disk', 'path', 'original_name', 'mime_type', 'size'];

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
