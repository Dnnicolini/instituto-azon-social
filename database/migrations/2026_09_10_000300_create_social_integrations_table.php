<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_integrations', function (Blueprint $table): void {
            $table->id();
            $table->string('provider', 40)->unique();
            $table->string('account_id')->nullable();
            $table->string('username')->nullable();
            $table->text('access_token')->nullable();
            $table->boolean('enabled')->default(false);
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->string('provider_media_id')->nullable()->after('provider');
            $table->string('provider_media_type', 40)->nullable()->after('provider_media_id');
            $table->unique(['provider', 'provider_media_id']);
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->dropUnique(['provider', 'provider_media_id']);
            $table->dropColumn(['provider_media_id', 'provider_media_type']);
        });

        Schema::dropIfExists('social_integrations');
    }
};
