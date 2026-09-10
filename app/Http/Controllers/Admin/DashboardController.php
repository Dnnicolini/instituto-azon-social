<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ContentStatus;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Post;
use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends AdminController
{
    public function __invoke(): Response
    {
        $user = request()->user();
        $canViewContent = $user?->hasPermission('content.view') === true;
        $canViewMessages = $user?->hasPermission('messages.view') === true;

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'posts' => $canViewContent ? Post::query()->count() : 0,
                'projects' => $canViewContent ? Project::query()->count() : 0,
                'events' => $canViewContent ? Event::query()->count() : 0,
                'review_posts' => $canViewContent ? Post::query()->where('status', ContentStatus::Review)->count() : 0,
                'unreadMessages' => $canViewMessages ? ContactMessage::query()->where('status', 'new')->count() : 0,
            ],
            'recentPosts' => $canViewContent
                ? Post::query()->with('author:id,name')->latest()->limit(5)->get()->map(fn (Post $post): array => [
                    'id' => $post->id, 'title' => $post->title, 'type' => $post->type->value, 'status' => $post->status->value,
                    'author' => $post->author?->name, 'updated_at' => $post->updated_at?->toIso8601String(),
                ])
                : [],
            'scheduledPosts' => $canViewContent
                ? Post::query()->where('status', ContentStatus::Scheduled)->orderBy('published_at')->limit(5)->get()->map(fn (Post $post): array => [
                    'id' => $post->id, 'title' => $post->title, 'type' => $post->type->value, 'status' => $post->status->value,
                    'published_at' => $post->published_at?->toIso8601String(), 'updated_at' => $post->updated_at?->toIso8601String(),
                ])
                : [],
        ]);
    }
}
