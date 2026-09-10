<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MediaAsset extends Model
{
    protected $fillable = ['uploaded_by', 'disk', 'path', 'original_name', 'mime_type', 'size', 'alt_text', 'width', 'height'];

    protected $appends = ['url'];

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        if ($this->disk === 'site') {
            return '/'.ltrim($this->path, '/');
        }

        return Storage::disk($this->disk)->url($this->path);
    }
}
