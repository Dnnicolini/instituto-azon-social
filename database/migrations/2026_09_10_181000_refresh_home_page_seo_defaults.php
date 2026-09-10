<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const NEW_DESCRIPTION = 'Instituto social em Sepetiba com projetos de saúde preventiva e mental, cultura, ancestralidade, educação, meio ambiente e apoio comunitário no Rio de Janeiro.';

    private const NEW_TITLE = 'Instituto Azon Social | Projetos sociais em Sepetiba, RJ';

    private const OLD_DESCRIPTION = 'Ações sociais, culturais e ambientais que fortalecem pessoas, preservam saberes ancestrais e transformam territórios em Sepetiba, Rio de Janeiro.';

    private const OLD_TITLE = 'Instituto Azon Social | Ancestralidade, cuidado e transformação';

    public function up(): void
    {
        DB::table('pages')
            ->where('slug', 'inicio')
            ->where('seo_title', self::OLD_TITLE)
            ->update(['seo_title' => self::NEW_TITLE]);

        DB::table('pages')
            ->where('slug', 'inicio')
            ->where('seo_description', self::OLD_DESCRIPTION)
            ->update(['seo_description' => self::NEW_DESCRIPTION]);
    }

    public function down(): void
    {
        DB::table('pages')
            ->where('slug', 'inicio')
            ->where('seo_title', self::NEW_TITLE)
            ->update(['seo_title' => self::OLD_TITLE]);

        DB::table('pages')
            ->where('slug', 'inicio')
            ->where('seo_description', self::NEW_DESCRIPTION)
            ->update(['seo_description' => self::OLD_DESCRIPTION]);
    }
};
