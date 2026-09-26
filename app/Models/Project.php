<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\ProjectApplicationStatus;
use App\Enums\ProjectRegistrationType;
use App\Models\Concerns\HasImageGallery;
use App\Models\Concerns\HasPublicationStatus;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $summary
 * @property string|null $badge_label
 * @property string|null $body
 * @property ContentStatus $status
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 * @property int $sort_order
 * @property ProjectRegistrationSetting|null $registrationSetting
 * @property ProjectRegistrationForm|null $registrationForm
 * @property bool $registration_enabled
 * @property ProjectRegistrationType|null $registration_type
 * @property string|null $registration_url
 * @property Carbon|null $registration_start_at
 * @property Carbon|null $registration_end_at
 * @property string|null $registration_instructions
 * @property string $registration_button_label
 * @property ProjectRegistrationSetting|null $registrationSetting
 * @property ProjectRegistrationForm|null $registrationForm
 * @property Collection<int, ProjectApplication> $applications
 */
class Project extends Model
{
    use HasImageGallery, HasPublicationStatus, SoftDeletes;

    protected $fillable = [
        'cover_media_id', 'title', 'slug', 'summary', 'badge_label', 'body', 'status', 'published_at', 'sort_order',
        'registration_enabled', 'registration_type', 'registration_url', 'registration_start_at',
        'registration_end_at', 'registration_instructions', 'registration_button_label',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContentStatus::class, 'published_at' => 'datetime', 'registration_enabled' => 'boolean',
            'registration_type' => ProjectRegistrationType::class, 'registration_start_at' => 'datetime',
            'registration_end_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }

    /** @return HasOne<ProjectRegistrationSetting, $this> */
    public function registrationSetting(): HasOne
    {
        return $this->hasOne(ProjectRegistrationSetting::class);
    }

    /** @return HasOne<ProjectRegistrationForm, $this> */
    public function registrationForm(): HasOne
    {
        return $this->hasOne(ProjectRegistrationForm::class);
    }

    /** @return HasMany<ProjectApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class);
    }

    public function registrationState(): string
    {
        if (! $this->registration_enabled) {
            return 'disabled';
        }
        if ($this->registration_start_at?->isFuture()) {
            return 'not_started';
        }
        if ($this->registration_end_at?->isPast()) {
            return 'closed';
        }

        $limit = $this->registrationSetting?->max_applications;
        if ($limit !== null && $this->applications()->whereNotIn('status', [ProjectApplicationStatus::Draft->value, ProjectApplicationStatus::Cancelled->value])->count() >= $limit) {
            return 'limit_reached';
        }

        return 'open';
    }

    /** @return MorphToMany<Post, $this> */
    public function relatedPosts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'linkable', 'project_content_links')->withTimestamps();
    }

    /** @return MorphToMany<Event, $this> */
    public function relatedEvents(): MorphToMany
    {
        return $this->morphedByMany(Event::class, 'linkable', 'project_content_links')->withTimestamps();
    }
}
