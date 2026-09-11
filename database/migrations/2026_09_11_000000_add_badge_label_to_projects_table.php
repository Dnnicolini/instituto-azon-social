<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('badge_label', 80)->nullable()->after('summary');
        });

        foreach ([
            'lewa-ori' => 'Saúde mental',
            'ayidonun' => 'Soberania alimentar',
            'aman' => 'Agroecologia & saberes',
            'emi-syo' => 'Juventude & direitos',
            'hunto' => 'Mestres dos saberes',
            'ayi-gbe' => 'Corpo & saúde integral',
        ] as $slug => $badgeLabel) {
            DB::table('projects')->where('slug', $slug)->update([
                'badge_label' => $badgeLabel,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn('badge_label');
        });
    }
};
