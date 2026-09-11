<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>{{ config('site.name') }} — Podcasts</title>
    <link>{{ url('/midia?type=podcast') }}</link>
    <description>Conversas e saberes do Instituto Azon Social.</description>
    <language>pt-BR</language>
    <atom:link href="{{ url('/podcast.xml') }}" rel="self" type="application/rss+xml" />
@foreach ($episodes as $episode)
    <item>
        <guid isPermaLink="true">{{ url('/midia/'.$episode->slug) }}</guid>
        <title>{{ $episode->title }}</title>
        <link>{{ url('/midia/'.$episode->slug) }}</link>
        <description>{{ $episode->excerpt }}</description>
        <pubDate>{{ $episode->published_at?->toRfc2822String() }}</pubDate>
    </item>
@endforeach
</channel>
</rss>
