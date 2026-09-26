<?php

namespace App\Services;

use App\Enums\ProjectApplicationStatus;
use App\Enums\ProjectRegistrationType;
use App\Mail\ProjectApplicationConfirmation;
use App\Models\Project;
use App\Models\ProjectApplication;
use App\Models\ProjectRegistrationField;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProjectApplicationService
{
    public function save(Project $project, Request $request, ?ProjectApplication $application = null): ProjectApplication
    {
        $project->loadMissing(['registrationSetting', 'registrationForm.fields']);
        $this->assertProcessAllows($project, $request, $application);

        $answers = (array) $request->input('answers', []);
        $submit = $request->boolean('submit', true);
        $this->validateAnswers($project, $request, $answers, $submit, $application);

        $storedPaths = [];
        try {
            $saved = DB::transaction(function () use ($project, $request, $application, $answers, $submit, &$storedPaths): ProjectApplication {
                $lockedProject = Project::query()->lockForUpdate()->findOrFail($project->id);
                $lockedProject->loadMissing(['registrationSetting', 'registrationForm.fields']);
                $this->assertProcessAllows($lockedProject, $request, $application);
                if ($submit) {
                    $this->assertCapacityAndUniqueness($lockedProject, $application, $answers);
                }

                $isNew = $application === null;
                $previouslySubmitted = $application?->submitted_at !== null;
                $application ??= new ProjectApplication(['project_id' => $lockedProject->id]);
                $application->fill([
                    'user_id' => $application->user_id,
                    'status' => $submit ? ProjectApplicationStatus::Submitted : ProjectApplicationStatus::Draft,
                    'submitted_at' => $submit ? ($application->submitted_at ?? now()) : null,
                    'applicant_name' => $this->identityValue($answers, ['nome_completo', 'name', 'nome']),
                    'applicant_email' => $this->identityValue($answers, ['email']),
                    'applicant_cpf' => $this->identityValue($answers, ['cpf']),
                    'ip_hash' => $application->ip_hash ?? $this->ipHash($request),
                ]);
                $application->save();
                if ($application->protocol === null) {
                    $application->update(['protocol' => sprintf('INS-%s-%06d', now()->format('Y'), $application->id)]);
                }

                $fields = $lockedProject->registrationForm()->with('fields')->firstOrNew()->fields;
                foreach ($fields as $field) {
                    if ($field->isDisplayOnly() || $field->isUpload()) {
                        continue;
                    }
                    $application->answers()->updateOrCreate(
                        ['field_id' => $field->id],
                        ['value' => Arr::exists($answers, $field->identifier) ? $answers[$field->identifier] : null],
                    );
                }

                foreach ($fields as $field) {
                    $file = $request->file('files.'.$field->identifier);
                    if (! $field->isUpload() || ! $file instanceof UploadedFile) {
                        continue;
                    }
                    $path = $file->store('project-applications/'.$lockedProject->id.'/'.$application->id, 'local');
                    throw_unless(is_string($path), ValidationException::withMessages(['files.'.$field->identifier => 'Não foi possível armazenar o arquivo.']));
                    $storedPaths[] = $path;
                    $old = $application->files()->where('field_id', $field->id)->first();
                    $application->files()->updateOrCreate(['field_id' => $field->id], [
                        'disk' => 'local', 'path' => $path, 'original_name' => $file->getClientOriginalName(),
                        'mime_type' => (string) $file->getMimeType(), 'size' => $file->getSize(),
                    ]);
                    if ($old !== null && $old->path !== $path) {
                        Storage::disk($old->disk)->delete($old->path);
                    }
                    $application->histories()->create(['user_id' => null, 'event' => 'document.updated']);
                }

                $event = $isNew ? 'application.created' : 'application.edited';
                $application->histories()->create(['user_id' => null, 'event' => $event]);
                if ($submit && ! $previouslySubmitted) {
                    $application->histories()->create(['user_id' => null, 'event' => 'application.submitted']);
                }

                return $application->fresh(['project', 'answers.field', 'files.field', 'histories.user']);
            }, 3);
            $message = $saved->project->registrationSetting?->confirmation_message
                ?: 'Recebemos sua inscrição. Guarde o protocolo como comprovante de envio.';
            if ($submit && $saved->applicant_email) {
                try {
                    Mail::to($saved->applicant_email)->queue(ProjectApplicationConfirmation::fromApplication($saved, $message));
                } catch (Throwable $exception) {
                    report($exception);
                }
            }

            return $saved;
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
    }

    private function assertProcessAllows(Project $project, Request $request, ?ProjectApplication $application): void
    {
        throw_unless($project->registration_enabled && $project->registration_type === ProjectRegistrationType::Internal, ValidationException::withMessages(['registration' => 'Este projeto não recebe inscrições pelo sistema.']));
        $settings = $project->registrationSetting;
        $state = $project->registrationState();
        throw_unless($state === 'open' || ($application !== null && $state === 'limit_reached'), ValidationException::withMessages(['registration' => match ($state) {
            'not_started' => 'As inscrições ainda não começaram.', 'limit_reached' => 'Limite de inscrições atingido.', default => 'As inscrições estão encerradas.',
        }]));

        if ($application !== null) {
            abort_unless($application->project_id === $project->id, 404);
            abort_unless($application->user_id !== null && $application->user_id === $request->user()?->id, 403);
            if ($application->submitted_at !== null) {
                throw_unless($settings?->allow_editing, ValidationException::withMessages(['application' => 'Esta inscrição não permite edição após o envio.']));
                throw_if($settings->edit_deadline?->isPast(), ValidationException::withMessages(['application' => 'O prazo para editar esta inscrição terminou.']));
            }
        }
    }

    /** @param array<string, mixed> $answers */
    private function assertCapacityAndUniqueness(Project $project, ?ProjectApplication $application, array $answers): void
    {
        $settings = $project->registrationSetting;
        if ($settings?->max_applications !== null) {
            $count = $project->applications()->whereNotIn('status', [ProjectApplicationStatus::Draft->value, ProjectApplicationStatus::Cancelled->value])
                ->when($application, fn ($query) => $query->whereKeyNot($application->id))->count();
            throw_if($count >= $settings->max_applications, ValidationException::withMessages(['registration' => 'Limite de inscrições atingido.']));
        }
        if (! $settings?->one_per_user) {
            return;
        }

        $duplicate = $project->applications()->whereNotIn('status', [ProjectApplicationStatus::Draft->value, ProjectApplicationStatus::Cancelled->value])
            ->when($application, fn ($query) => $query->whereKeyNot($application->id));
        $email = $this->identityValue($answers, ['email']);
        throw_if($email === null, ValidationException::withMessages(['answers.email' => 'Informe o e-mail para evitar inscrições duplicadas.']));
        $duplicate->where('applicant_email', mb_strtolower($email));
        throw_if($duplicate->exists(), ValidationException::withMessages(['registration' => 'Você já possui uma inscrição neste projeto.']));
    }

    /** @param array<string, mixed> $answers */
    private function validateAnswers(Project $project, Request $request, array $answers, bool $submit, ?ProjectApplication $application): void
    {
        $rules = [];
        $attributes = [];
        $known = [];
        $fields = $project->registrationForm()->with('fields')->firstOrNew()->fields;
        foreach ($fields as $field) {
            $known[] = $field->identifier;
            if ($field->isDisplayOnly()) {
                continue;
            }
            $key = ($field->isUpload() ? 'files.' : 'answers.').$field->identifier;
            $fieldRules = [$submit && $field->required && ! ($field->isUpload() && $application?->files()->where('field_id', $field->id)->exists()) ? 'required' : 'nullable'];
            if ($field->isUpload()) {
                $fieldRules[] = 'file';
                $fieldRules[] = 'max:'.($field->max_file_size_kb ?? 5120);
                if ($field->type === 'image') {
                    $fieldRules[] = 'image';
                }
                if ($field->allowed_mime_types !== null && $field->allowed_mime_types !== []) {
                    $fieldRules[] = 'mimetypes:'.implode(',', $field->allowed_mime_types);
                }
            } else {
                $fieldRules = array_merge($fieldRules, $this->answerRules($field));
            }
            $rules[$key] = $fieldRules;
            $attributes[$key] = $field->label;
        }
        foreach (array_keys($answers) as $identifier) {
            if (! in_array($identifier, $known, true)) {
                throw ValidationException::withMessages(['answers.'.$identifier => 'Campo de formulário desconhecido.']);
            }
        }
        Validator::make($request->all(), $rules, [], $attributes)->validate();
    }

    /** @return array<int, mixed> */
    private function answerRules(ProjectRegistrationField $field): array
    {
        $rules = match ($field->type) {
            'email' => ['string', 'email:rfc', 'max:255'],
            'phone' => ['string', 'regex:/^[0-9()+.\-\s]{8,30}$/'],
            'cpf' => ['string', 'regex:/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/'],
            'cnpj' => ['string', 'regex:/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/'],
            'date' => ['date'],
            'number' => ['numeric'],
            'url' => ['url:http,https', 'max:2048'],
            'acceptance' => ['accepted'],
            'checkbox', 'multiple_choice' => ['array', 'max:200'],
            default => ['string'],
        };
        if (in_array($field->type, ['select', 'radio'], true) && $field->options !== null) {
            $rules[] = 'in:'.implode(',', array_map(fn ($value): string => str_replace(',', '\\,', (string) $value), $field->options));
        }
        if (in_array($field->type, ['checkbox', 'multiple_choice'], true) && $field->options !== null) {
            $rules[] = function (string $attribute, mixed $value, callable $fail) use ($field): void {
                if (is_array($value) && array_diff($value, $field->options ?? []) !== []) {
                    $fail('Uma ou mais opções selecionadas são inválidas.');
                }
            };
        }
        if ($field->max_length !== null && in_array($field->type, ['short_text', 'long_text'], true)) {
            $rules[] = 'max:'.$field->max_length;
        }
        if ($field->type === 'number' && $field->min_value !== null) {
            $rules[] = 'min:'.$field->min_value;
        }
        if ($field->type === 'number' && $field->max_value !== null) {
            $rules[] = 'max:'.$field->max_value;
        }

        return $rules;
    }

    /** @param array<string, mixed> $answers
     * @param  array<int, string>  $identifiers
     */
    private function identityValue(array $answers, array $identifiers): ?string
    {
        foreach ($identifiers as $identifier) {
            $value = $answers[$identifier] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return $identifier === 'email' ? mb_strtolower(trim($value)) : trim($value);
            }
        }

        return null;
    }

    private function ipHash(Request $request): ?string
    {
        return $request->ip() ? hash_hmac('sha256', $request->ip(), (string) config('app.key')) : null;
    }
}
