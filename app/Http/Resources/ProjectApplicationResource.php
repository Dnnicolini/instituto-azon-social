<?php

namespace App\Http\Resources;

use App\Models\ProjectApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProjectApplication */
class ProjectApplicationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user()?->hasPermission('applications.view') ?? false;
        $setting = $this->project->registrationSetting;
        $canEdit = $this->user_id === $request->user()?->id
            && ($this->submitted_at === null || ($setting?->allow_editing && ! $setting->edit_deadline?->isPast()))
            && ! $this->project->registration_start_at?->isFuture()
            && ! $this->project->registration_end_at?->isPast();

        return [
            'id' => $this->id,
            'protocol' => $this->protocol,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'applicant_name' => $this->applicant_name,
            'applicant_email' => $isAdmin ? $this->applicant_email : null,
            'applicant_cpf' => $isAdmin ? $this->applicant_cpf : null,
            'project' => ['id' => $this->project->id, 'title' => $this->project->title, 'slug' => $this->project->slug, 'registration_ends_at' => $this->project->registration_end_at?->toIso8601String()],
            'registration_ends_at' => $this->project->registration_end_at?->toIso8601String(),
            'show_url' => route('applications.show', $this->resource),
            'edit_url' => route('applications.update', $this->resource),
            'answers' => $this->whenLoaded('answers', fn () => $this->answers->mapWithKeys(fn ($answer): array => [$answer->field->identifier => [
                'field_id' => $answer->field_id, 'label' => $answer->field->label, 'type' => $answer->field->type, 'value' => $answer->value,
            ]])),
            'answer_values' => $this->whenLoaded('answers', fn () => $this->answers->mapWithKeys(fn ($answer): array => [$answer->field->identifier => $answer->value])),
            'files' => $this->whenLoaded('files', fn () => $this->files->map(fn ($file): array => [
                'id' => $file->id, 'field_id' => $file->field_id, 'identifier' => $file->field->identifier,
                'label' => $file->field->label, 'name' => $file->original_name, 'mime_type' => $file->mime_type,
                'size' => $file->size, 'url' => route('applications.files.show', [$this->resource, $file]),
            ])->values()),
            'history' => $this->whenLoaded('histories', fn () => $this->histories
                ->filter(fn ($history): bool => $isAdmin || ! $history->is_internal)
                ->map(fn ($history): array => [
                    'id' => $history->id, 'event' => $history->event, 'from_status' => $history->from_status,
                    'to_status' => $history->to_status, 'note' => $isAdmin ? $history->note : null,
                    'created_at' => $history->created_at?->toIso8601String(), 'user' => $isAdmin ? $history->user?->name : null,
                ])->values()),
            'can_edit' => $canEdit,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
