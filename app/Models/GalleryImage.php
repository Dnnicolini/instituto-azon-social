<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GalleryImage extends Model
{
    protected $fillable = ['media_asset_id', 'sort_order'];

    /** @return MorphTo<Model, $this> */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<MediaAsset, $this> */
    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_asset_id');
    }

    /** @return array{id: int, url: string, alt: string|null, mime_type: string, media_type: string, width: int|null, height: int|null} */
    public function toMediaPayload(): array
    {
        $mimeType = (string) $this->media->mime_type;

        return [
            'id' => $this->id,
            'url' => $this->media->url,
            'alt' => $this->media->alt_text,
            'mime_type' => $mimeType,
            'media_type' => str_starts_with($mimeType, 'video/') ? 'video' : 'image',
            'width' => $this->media->width,
            'height' => $this->media->height,
        ];
    }
}
