<?php

namespace App\Models\Concerns;

use App\Models\GalleryImage;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasImageGallery
{
    /** @return MorphMany<GalleryImage, $this> */
    public function galleryImages(): MorphMany
    {
        return $this->morphMany(GalleryImage::class, 'imageable')->orderBy('sort_order')->orderBy('id');
    }
}
