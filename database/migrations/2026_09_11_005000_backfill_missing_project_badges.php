<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('projects')
            ->whereNull('badge_label')
            ->orWhere('badge_label', '')
            ->update(['badge_label' => 'Ação comunitária']);
    }

    public function down(): void
    {
        // O rollback não apaga badges para preservar dados editoriais.
    }
};
