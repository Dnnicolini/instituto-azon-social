<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#2f210f">

        <link rel="icon" href="/azon-social-icon.png" type="image/png">
        <link rel="apple-touch-icon" href="/azon-social-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            @php($seo = $page['props']['seo'] ?? [])
            <title data-inertia="title">{{ $seo['title'] ?? config('app.name') }}</title>
            <meta data-inertia="description" name="description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta data-inertia="robots" name="robots" content="{{ $seo['robots'] ?? 'index, follow, max-image-preview:large' }}">
            <link data-inertia="canonical" rel="canonical" href="{{ $seo['canonical'] ?? config('app.url') }}">
            <meta data-inertia="og:title" property="og:title" content="{{ $seo['title'] ?? config('app.name') }}">
            <meta data-inertia="og:description" property="og:description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta data-inertia="og:type" property="og:type" content="{{ $seo['type'] ?? 'website' }}">
            <meta data-inertia="og:url" property="og:url" content="{{ $seo['canonical'] ?? config('app.url') }}">
            <meta data-inertia="og:site_name" property="og:site_name" content="{{ $seo['siteName'] ?? config('site.name') }}">
            <meta data-inertia="og:locale" property="og:locale" content="{{ $seo['locale'] ?? 'pt_BR' }}">
            <meta data-inertia="og:image" property="og:image" content="{{ $seo['image'] ?? url('/azon-social-logo.webp') }}">
            <meta data-inertia="og:image:alt" property="og:image:alt" content="{{ $seo['imageAlt'] ?? 'Logomarca do Instituto Azon Social' }}">
            <meta data-inertia="twitter:card" name="twitter:card" content="summary">
            <meta data-inertia="twitter:title" name="twitter:title" content="{{ $seo['title'] ?? config('app.name') }}">
            <meta data-inertia="twitter:description" name="twitter:description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta data-inertia="twitter:image" name="twitter:image" content="{{ $seo['image'] ?? url('/azon-social-logo.webp') }}">
            @foreach (($seo['schema'] ?? []) as $schema)
                <script data-inertia="structured-data-{{ $loop->index }}" type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
            @endforeach
        </x-inertia::head>
    </head>
    <body>
        <x-inertia::app />
        @unless (str_starts_with($page['component'], 'admin/') || str_starts_with($page['component'], 'auth/'))
            <script defer src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
        @endunless
    </body>
</html>
