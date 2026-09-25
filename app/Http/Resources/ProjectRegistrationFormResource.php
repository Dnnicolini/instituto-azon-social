<?php

namespace App\Http\Resources;

use App\Models\ProjectRegistrationForm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProjectRegistrationForm */
class ProjectRegistrationFormResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'version' => $this->version,
            'fields' => $this->fields->map(fn ($field): array => [
                'id' => $field->id, 'type' => $field->type, 'label' => $field->label,
                'identifier' => $field->identifier, 'description' => $field->description,
                'placeholder' => $field->placeholder, 'required' => $field->required,
                'sort_order' => $field->sort_order, 'options' => $field->options ?? [],
                'validation' => $field->validations ?? [], 'validations' => $field->validations ?? [],
                'max_length' => $field->max_length, 'allowed_mime_types' => $field->allowed_mime_types ?? [],
                'max_file_size_kb' => $field->max_file_size_kb, 'min_value' => $field->min_value,
                'max_value' => $field->max_value,
            ])->values(),
        ];
    }
}
