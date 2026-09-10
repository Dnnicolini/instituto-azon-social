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
 * @property ContentStatus $status
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 * @property int $sort_order
 */
class Project extends Model
{
    use HasPublicationStatus, SoftDeletes;

    protected $fillable = ['cover_media_id', 'title', 'slug', 'summary', 'body', 'status', 'published_at', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'published_at' => 'datetime'];
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }
}
