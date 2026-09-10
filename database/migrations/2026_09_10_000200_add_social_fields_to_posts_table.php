<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->dropIndex(['is_featured']);
            $table->dropIndex(['sort_order']);
            $table->dropColumn(['is_featured', 'sort_order']);
        });
    }
};
