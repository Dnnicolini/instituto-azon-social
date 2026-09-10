<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Models\Concerns\HasPublicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $body
 * @property array<int, array<string, string|null>>|null $sections
 * @property ContentStatus $status
 * @property Carbon|null $published_at
 * @property Carbon|null $updated_at
 * @property string|null $seo_title
 * @property string|null $seo_description
 */
class Page extends Model
{
    use HasPublicationStatus, SoftDeletes;

    protected $fillable = ['title', 'slug', 'body', 'sections', 'status', 'published_at', 'seo_title', 'seo_description'];

    protected function casts(): array
    {
        return ['sections' => 'array', 'status' => ContentStatus::class, 'published_at' => 'datetime'];
    }
}
