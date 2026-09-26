<?php

namespace App\Http\Resources;

use App\Enums\ProjectRegistrationType;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectRegistrationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $project = $this->resource;
        $settings = $project->registrationSetting()->firstOrNew();
        $state = $project->registrationState();

        return [
            'enabled' => $project->registration_enabled,
            'type' => $project->registration_type?->value,
            'state' => $state,
            'can_apply' => $state === 'open' && ($project->registration_type === ProjectRegistrationType::Internal || ($project->registration_type === ProjectRegistrationType::External && $project->registration_url)),
            'url' => $project->registration_url,
            'start_at' => $project->registration_start_at?->toIso8601String(),
            'end_at' => $project->registration_end_at?->toIso8601String(),
            'instructions' => $project->registration_instructions ?? $settings->instructions,
            'button_label' => $project->registration_button_label ?: 'Inscreva-se',
            'title' => $settings->title,
            'description' => $settings->description,
            'max_applications' => $settings->max_applications,
            'allow_editing' => false,
            'edit_deadline' => null,
            'requires_auth' => false,
            'one_per_user' => $settings->one_per_user ?? true,
            'success_message' => $settings->success_message,
            'confirmation_message' => $settings->confirmation_message,
        ];
    }
}
