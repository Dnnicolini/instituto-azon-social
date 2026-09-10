<?php

namespace App\Console\Commands;

use App\Enums\ContentStatus;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Event;
use App\Models\Page;
use App\Models\Post;
use App\Models\Project;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PublishScheduledContentCommand extends Command
{
    protected $signature = 'cms:publish-scheduled';

    protected $description = 'Publica conteúdos agendados vencidos de forma idempotente';

    public function handle(): int
    {
        $count = 0;
        foreach ([Post::class, Project::class, Event::class, Document::class, Page::class] as $modelClass) {
            $modelClass::query()
                ->where('status', ContentStatus::Scheduled)
                ->where('published_at', '<=', now())
                ->chunkById(100, function ($models) use (&$count): void {
                    foreach ($models as $model) {
                        $count += $this->publish($model);
                    }
                });
        }

        $this->info("{$count} conteúdo(s) publicado(s).");

        return self::SUCCESS;
    }

    private function publish(Model $model): int
    {
        return DB::transaction(function () use ($model): int {
            $updated = $model->newQuery()->whereKey($model->getKey())->where('status', ContentStatus::Scheduled)->where('published_at', '<=', now())->update(['status' => ContentStatus::Published, 'updated_at' => now()]);
            if ($updated === 1) {
                AuditLog::query()->create(['action' => 'content.scheduled_published', 'auditable_type' => $model::class, 'auditable_id' => $model->getKey(), 'metadata' => ['published_at' => $model->getAttribute('published_at')]]);
            }

            return $updated;
        });
    }
}
