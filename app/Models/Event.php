<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Models\Concerns\HasPublicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $summary
 * @property string|null $body
 * @property string|null $location
 * @property string|null $date_label
 * @property string|null $registration_url
 * @property ContentStatus $status
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 */
class Event extends Model
{
    use HasPublicationStatus, SoftDeletes;

    protected $fillable = ['cover_media_id', 'title', 'slug', 'summary', 'body', 'location', 'starts_at', 'ends_at', 'date_label', 'registration_url', 'status', 'published_at'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'status' => ContentStatus::class, 'published_at' => 'datetime'];
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }
}
