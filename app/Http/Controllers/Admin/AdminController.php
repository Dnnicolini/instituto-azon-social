<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContentRevision;
use App\Models\MediaAsset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

abstract class AdminController extends Controller
{
    protected function createAsset(UploadedFile $file, string $folder, ?string $altText = null): MediaAsset
    {
        abort_unless(request()->user()->hasPermission('media.manage'), 403);

        $path = $file->store($folder, 'public');
        abort_unless(is_string($path), 500, 'Não foi possível armazenar o arquivo.');

        $width = null;
        $height = null;
        if (str_starts_with((string) $file->getMimeType(), 'image/')) {
            $dimensions = @getimagesize($file->getRealPath());
            [$width, $height] = is_array($dimensions) ? [$dimensions[0], $dimensions[1]] : [null, null];
        }

        return MediaAsset::query()->create([
            'uploaded_by' => request()->user()?->id,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => (string) $file->getMimeType(),
            'size' => $file->getSize(),
            'alt_text' => $altText,
            'width' => $width,
            'height' => $height,
        ]);
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function normalizePublication(array $data): array
    {
        if ($data['status'] === ContentStatus::Published->value && empty($data['published_at'])) {
            $data['published_at'] = now();
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
