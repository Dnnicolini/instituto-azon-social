<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#2f210f">

        <link rel="icon" href="/azon-social-logo.png" type="image/png">
        <link rel="apple-touch-icon" href="/azon-social-logo.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            @php($seo = $page['props']['seo'] ?? [])
            <title>{{ $seo['title'] ?? config('app.name') }}</title>
            <meta name="description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta name="robots" content="{{ $seo['robots'] ?? 'index, follow, max-image-preview:large' }}">
            <link rel="canonical" href="{{ $seo['canonical'] ?? config('app.url') }}">
            <meta property="og:title" content="{{ $seo['title'] ?? config('app.name') }}">
            <meta property="og:description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta property="og:type" content="{{ $seo['type'] ?? 'website' }}">
            <meta property="og:url" content="{{ $seo['canonical'] ?? config('app.url') }}">
            <meta property="og:site_name" content="{{ $seo['siteName'] ?? config('site.name') }}">
            <meta property="og:locale" content="{{ $seo['locale'] ?? 'pt_BR' }}">
            <meta property="og:image" content="{{ $seo['image'] ?? url('/azon-social-logo.png') }}">
            <meta property="og:image:alt" content="{{ $seo['imageAlt'] ?? 'Logomarca do Instituto Azon Social' }}">
            <meta name="twitter:card" content="summary">
            <meta name="twitter:title" content="{{ $seo['title'] ?? config('app.name') }}">
            <meta name="twitter:description" content="{{ $seo['description'] ?? config('site.description') }}">
            <meta name="twitter:image" content="{{ $seo['image'] ?? url('/azon-social-logo.png') }}">
            @foreach (($seo['schema'] ?? []) as $schema)
                <script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
            @endforeach
        </x-inertia::head>
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
