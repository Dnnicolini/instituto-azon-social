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
 * @property string|null $description
 * @property string|null $category
 * @property ContentStatus $status
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 */
class Document extends Model
{
    use HasPublicationStatus, SoftDeletes;

    protected $fillable = ['media_asset_id', 'title', 'slug', 'description', 'category', 'status', 'published_at'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'published_at' => 'datetime'];
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_asset_id');
    }
}
