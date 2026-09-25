<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContentRevision;
use App\Models\Event;
use App\Models\MediaAsset;
use App\Models\Post;
use App\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;

abstract class AdminController extends Controller
{
    protected function createAsset(UploadedFile $file, string $folder, ?string $altText = null, ?string $disk = null): MediaAsset
    {
        abort_unless(request()->user()->hasPermission('media.manage'), 403);

        $disk ??= (string) config('filesystems.media_disk', 'public');
        $path = $file->store($folder, $disk);
        abort_unless(is_string($path), 500, 'Não foi possível armazenar o arquivo.');

        $width = null;
        $height = null;
        if (str_starts_with((string) $file->getMimeType(), 'image/')) {
            $dimensions = @getimagesize($file->getRealPath());
            [$width, $height] = is_array($dimensions) ? [$dimensions[0], $dimensions[1]] : [null, null];
        }

        return MediaAsset::query()->create([
            'uploaded_by' => request()->user()?->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => (string) $file->getMimeType(),
            'size' => $file->getSize(),
            'alt_text' => $altText,
            'width' => $width,
            'height' => $height,
        ]);
    }

    protected function updateAssetAlt(MediaAsset $asset, ?string $altText): void
    {
        if ($asset->alt_text === $altText) {
            return;
        }

        abort_unless(request()->user()?->hasPermission('media.manage'), 403);
        $asset->update(['alt_text' => $altText]);
    }

    protected function updateGallery(FormRequest $request, Post|Project|Event $model, string $title): void
    {
        $files = (array) $request->file('gallery', []);
        $removeIds = array_map('intval', (array) $request->validated('remove_gallery_ids', []));
        if ($files === [] && $removeIds === []) {
            return;
        }

        abort_unless($request->user()?->hasPermission('media.manage'), 403);

        if ($removeIds !== []) {
            $model->galleryImages()->whereKey($removeIds)->delete();
        }

        $nextOrder = (int) $model->galleryImages()->max('sort_order') + 1;
        foreach ($files as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }
            $asset = $this->createAsset($file, 'cms/images', 'Foto da galeria de '.$title);
            $model->galleryImages()->create([
                'media_asset_id' => $asset->id,
                'sort_order' => $nextOrder++,
            ]);
        }
    }

    /** @return array<int, array{value: string, label: string}> */
    protected function projectOptions(): array
    {
        return Project::query()
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (Project $project): array => ['value' => (string) $project->id, 'label' => $project->title])
            ->all();
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function normalizePublication(array $data): array
    {
        if ($data['status'] === ContentStatus::Published->value) {
            $publishedAt = $data['published_at'] ?? null;
            if (empty($publishedAt) || Carbon::parse($publishedAt)->isFuture()) {
                $data['published_at'] = now();
            }
        } elseif (! in_array($data['status'], [ContentStatus::Published->value, ContentStatus::Scheduled->value], true)) {
            $data['published_at'] = null;
        }

        return $data;
    }

    /** @param array<string, mixed>|null $before */
    protected function recordChange(string $action, Model $model, ?array $before = null): void
    {
        if ($before !== null) {
            ContentRevision::query()->create([
                'user_id' => request()->user()?->id,
                'revisionable_type' => $model::class,
                'revisionable_id' => $model->getKey(),
                'before' => $before,
                'after' => $model->fresh()?->attributesToArray(),
            ]);
        }

        AuditLog::query()->create([
            'user_id' => request()->user()?->id,
            'action' => $action,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'ip_hash' => $this->ipHash(),
        ]);
    }

    protected function ipHash(): ?string
    {
        $ip = request()->ip();

        return $ip ? hash_hmac('sha256', $ip, (string) config('app.key')) : null;
    }
}
