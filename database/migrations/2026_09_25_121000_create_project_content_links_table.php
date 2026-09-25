<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_content_links', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->morphs('linkable');
            $table->timestamps();
            $table->unique(['project_id', 'linkable_type', 'linkable_id'], 'project_content_link_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_content_links');
    }
};
