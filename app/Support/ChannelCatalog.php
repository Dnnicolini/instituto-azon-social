<?php

namespace App\Support;

final class ChannelCatalog
{
    /**
     * @return array<string, array{title:string, username:string, description:string, group_key:string, display_location:string, sort_order:int}>
     */
    public static function all(): array
    {
        return [
            'azon-news' => [
                'title' => 'Azon News',
                'username' => 'azon.news',
                'description' => 'Notícias e comunicação do Instituto Azon Social.',
                'group_key' => 'azon-news',
                'display_location' => 'azon_news',
                'sort_order' => 10,
            ],
            'azon-podcast' => [
                'title' => 'Azon Cast',
                'username' => 'azon.cast',
                'description' => 'Conversas, entrevistas e episódios do Instituto Azon Social.',
                'group_key' => 'azon-cast',
                'display_location' => 'azon_cast',
                'sort_order' => 20,
            ],
            'hunkpame-azon-legidan' => [
                'title' => 'Hunkpame Azon Legidan',
                'username' => 'azonlegidan',
                'description' => 'Conteúdos do Hunkpame Azon Legidan.',
                'group_key' => 'hunkpame',
                'display_location' => 'hunkpame',
                'sort_order' => 30,
            ],
            'presente-de-iemanja-sepetiba' => [
                'title' => 'Presente Sepetiba',
                'username' => 'presente.sepetiba',
                'description' => 'Conteúdos do Presente a Yemonjá em Sepetiba.',
                'group_key' => 'presente',
                'display_location' => 'presente',
                'sort_order' => 40,
            ],
        ];
    }

    public static function contains(string $slug): bool
    {
        return array_key_exists($slug, self::all());
    }

    /** @return list<string> */
    public static function slugs(): array
    {
        return array_keys(self::all());
    }
}
