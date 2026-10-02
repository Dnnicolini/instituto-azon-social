<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $media_type
 * @property string|null $media_url
 * @property string|null $thumbnail_url
 */
class InstagramMediaItem extends Model
{
    protected $fillable = ['post_id', 'provider_media_id', 'media_type', 'media_url', 'thumbnail_url', 'position'];

    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
