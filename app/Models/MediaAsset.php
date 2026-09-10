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

        if ($this->disk === 'r2' && ! filled(config('filesystems.disks.r2.url'))) {
            $minutes = max(5, (int) config('filesystems.temporary_url_minutes', 120));

            return Storage::disk($this->disk)->temporaryUrl(
                $this->path,
                now()->addMinutes($minutes),
            );
        }

        return Storage::disk($this->disk)->url($this->path);
    }
}
