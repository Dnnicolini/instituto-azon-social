<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_integrations', function (Blueprint $table): void {
            $table->dropUnique(['provider']);
            $table->string('display_name')->nullable()->after('provider');
            $table->string('expected_username')->nullable()->after('username');
            $table->text('description')->nullable()->after('expected_username');
            $table->string('group_key')->nullable()->index()->after('description');
            $table->unsignedInteger('sort_order')->default(0)->index()->after('group_key');
            $table->boolean('public_enabled')->default(false)->index()->after('enabled');
            $table->boolean('auto_publish')->default(false)->after('public_enabled');
            $table->json('display_locations')->nullable()->after('auto_publish');
            $table->timestamp('paused_at')->nullable()->after('display_locations');
            $table->timestamp('last_successful_sync_at')->nullable()->after('last_synced_at');
            $table->unsignedBigInteger('imported_posts_count')->default(0)->after('last_error');
            $table->unique(['provider', 'expected_username'], 'social_integrations_provider_expected_unique');
        });

        DB::table('social_integrations')
            ->where('provider', 'instagram')
            ->whereNull('expected_username')
            ->update([
                'display_name' => 'Instituto Azon Social',
                'expected_username' => DB::raw("COALESCE(username, 'azon.social')"),
                'group_key' => 'instituto-azon-social',
                'display_locations' => json_encode(['home', 'social_feed']),
            ]);

        Schema::table('pages', function (Blueprint $table): void {
            $table->foreignId('social_integration_id')
                ->nullable()
                ->after('slug')
                ->unique()
                ->constrained('social_integrations')
                ->nullOnDelete();
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->foreignId('social_integration_id')->nullable()->after('provider')->constrained('social_integrations')->nullOnDelete();
            $table->string('source_type', 20)->nullable()->index()->after('provider_media_type');
            $table->longText('original_caption')->nullable()->after('source_type');
            $table->text('editorial_summary')->nullable()->after('original_caption');
            $table->boolean('source_available')->default(true)->index()->after('editorial_summary');
            $table->timestamp('source_checked_at')->nullable()->after('source_available');
            $table->timestamp('source_published_at')->nullable()->after('source_checked_at');
            $table->index(['social_integration_id', 'published_at']);
        });

        $existingInstagramIntegration = DB::table('social_integrations')
            ->where('provider', 'instagram')
            ->orderBy('id')
            ->value('id');
        if ($existingInstagramIntegration) {
            DB::table('posts')
                ->where('provider', 'instagram')
                ->whereNotNull('provider_media_id')
                ->update([
                    'social_integration_id' => $existingInstagramIntegration,
                    'source_type' => 'automatic',
                    'original_caption' => DB::raw('body'),
                    'source_published_at' => DB::raw('published_at'),
                ]);
        }
        DB::table('posts')
            ->where('type', 'social')
            ->whereNull('source_type')
            ->update(['source_type' => 'manual']);

        Schema::create('instagram_media_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('provider_media_id')->nullable();
            $table->string('media_type', 40);
            $table->text('media_url')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->unique(['post_id', 'position']);
            $table->unique(['post_id', 'provider_media_id']);
        });

        Schema::create('instagram_sync_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('social_integration_id')->constrained('social_integrations')->cascadeOnDelete();
            $table->string('trigger', 20)->default('scheduled');
            $table->string('status', 20)->default('running')->index();
            $table->unsignedInteger('processed_count')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['social_integration_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instagram_sync_runs');
        Schema::dropIfExists('instagram_media_items');

        Schema::table('pages', function (Blueprint $table): void {
            $table->dropUnique(['social_integration_id']);
            $table->dropConstrainedForeignId('social_integration_id');
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->dropIndex(['social_integration_id', 'published_at']);
            $table->dropIndex(['source_type']);
            $table->dropIndex(['source_available']);
            $table->dropConstrainedForeignId('social_integration_id');
            $table->dropColumn(['source_type', 'original_caption', 'editorial_summary', 'source_available', 'source_checked_at', 'source_published_at']);
        });

        Schema::table('social_integrations', function (Blueprint $table): void {
            $table->dropUnique('social_integrations_provider_expected_unique');
            $table->dropIndex(['group_key']);
            $table->dropIndex(['sort_order']);
            $table->dropIndex(['public_enabled']);
            $table->dropColumn([
                'display_name', 'expected_username', 'description', 'group_key', 'sort_order', 'public_enabled',
                'auto_publish', 'display_locations', 'paused_at', 'last_successful_sync_at', 'imported_posts_count',
            ]);
        });
    }
};
