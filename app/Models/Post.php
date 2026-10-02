<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\Concerns\HasImageGallery;
use App\Models\Concerns\HasPublicationStatus;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
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
 * @property int|null $social_integration_id
 * @property string|null $provider_media_type
 * @property string|null $source_type
 * @property string|null $original_caption
 * @property string|null $editorial_summary
 * @property bool $source_available
 * @property Carbon|null $source_published_at
 * @property string|null $external_url
 * @property int|null $video_media_id
 * @property int|null $duration_seconds
 * @property bool $is_featured
 * @property int $sort_order
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 * @property SocialIntegration|null $socialIntegration
 * @property Collection<int, InstagramMediaItem> $instagramMediaItems
 */
class Post extends Model
{
    use HasImageGallery, HasPublicationStatus, SoftDeletes;

    protected $fillable = ['author_id', 'cover_media_id', 'video_media_id', 'type', 'title', 'slug', 'excerpt', 'body', 'provider', 'social_integration_id', 'provider_media_id', 'provider_media_type', 'source_type', 'original_caption', 'editorial_summary', 'source_available', 'source_checked_at', 'source_published_at', 'external_url', 'duration_seconds', 'is_featured', 'sort_order', 'status', 'published_at', 'seo_title', 'seo_description'];

    protected function casts(): array
    {
        return ['type' => PostType::class, 'status' => ContentStatus::class, 'published_at' => 'datetime', 'is_featured' => 'boolean', 'sort_order' => 'integer', 'source_available' => 'boolean', 'source_checked_at' => 'datetime', 'source_published_at' => 'datetime'];
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

    /** @return BelongsTo<MediaAsset, $this> */
    public function video(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'video_media_id');
    }

    /** @return BelongsTo<SocialIntegration, $this> */
    public function socialIntegration(): BelongsTo
    {
        return $this->belongsTo(SocialIntegration::class);
    }

    /** @return HasMany<InstagramMediaItem, $this> */
    public function instagramMediaItems(): HasMany
    {
        return $this->hasMany(InstagramMediaItem::class)->orderBy('position');
    }

    /** @return MorphToMany<Project, $this> */
    public function projects(): MorphToMany
    {
        return $this->morphToMany(Project::class, 'linkable', 'project_content_links')->withTimestamps();
    }

    public function publicPath(): string
    {
        return match ($this->type) {
            PostType::Article => '/noticias/'.$this->slug,
            PostType::Vlog, PostType::Video, PostType::Podcast => '/midia/'.$this->slug,
            PostType::Social => $this->external_url ?: '/',
        };
    }
}
