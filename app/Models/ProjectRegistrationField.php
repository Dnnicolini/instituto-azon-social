<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $form_id
 * @property string $type
 * @property string $label
 * @property string $identifier
 * @property string|null $description
 * @property string|null $placeholder
 * @property bool $required
 * @property bool $is_active
 * @property int $sort_order
 * @property array<int, string>|null $options
 * @property array<string, mixed>|null $validations
 * @property int|null $max_length
 * @property array<int, string>|null $allowed_mime_types
 * @property int|null $max_file_size_kb
 * @property string|null $min_value
 * @property string|null $max_value
 */
class ProjectRegistrationField extends Model
{
    public const TYPES = [
        'short_text', 'long_text', 'email', 'phone', 'cpf', 'cnpj', 'date', 'number', 'select', 'radio',
        'checkbox', 'multiple_choice', 'file', 'image', 'url', 'acceptance', 'heading', 'paragraph',
    ];

    protected $fillable = [
        'type', 'label', 'identifier', 'description', 'placeholder', 'required', 'is_active', 'sort_order', 'options',
        'validations', 'max_length', 'allowed_mime_types', 'max_file_size_kb', 'min_value', 'max_value',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean', 'is_active' => 'boolean', 'sort_order' => 'integer', 'options' => 'array', 'validations' => 'array',
            'allowed_mime_types' => 'array', 'max_file_size_kb' => 'integer', 'min_value' => 'decimal:4', 'max_value' => 'decimal:4',
        ];
    }

    /** @return BelongsTo<ProjectRegistrationForm, $this> */
    public function form(): BelongsTo
    {
        return $this->belongsTo(ProjectRegistrationForm::class, 'form_id');
    }

    public function isUpload(): bool
    {
        return in_array($this->type, ['file', 'image'], true);
    }

    public function isDisplayOnly(): bool
    {
        return in_array($this->type, ['heading', 'paragraph'], true);
    }

    /** @return HasMany<ProjectApplicationAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(ProjectApplicationAnswer::class, 'field_id');
    }

    /** @return HasMany<ProjectApplicationFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ProjectApplicationFile::class, 'field_id');
    }
}
