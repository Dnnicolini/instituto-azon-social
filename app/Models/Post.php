<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\Concerns\HasPublicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property PostType $type
 * @property ContentStatus $status
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property string|null $body
 * @property string|null $provider
 * @property string|null $external_url
 * @property int|null $duration_seconds
 * @property bool $is_featured
 * @property int $sort_order
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 */
class Post extends Model
{
    use HasPublicationStatus, SoftDeletes;

    protected $fillable = ['author_id', 'cover_media_id', 'type', 'title', 'slug', 'excerpt', 'body', 'provider', 'external_url', 'duration_seconds', 'is_featured', 'sort_order', 'status', 'published_at', 'seo_title', 'seo_description'];

    protected function casts(): array
    {
        return ['type' => PostType::class, 'status' => ContentStatus::class, 'published_at' => 'datetime', 'is_featured' => 'boolean', 'sort_order' => 'integer'];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }
}
