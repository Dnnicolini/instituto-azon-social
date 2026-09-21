@props(['url'])
<tr>
<td class="header" style="text-align: center;">
<a href="{{ $url }}" style="display: inline-block; color: #4a240b; text-decoration: none;">
<img src="{{ rtrim((string) config('app.url'), '/') }}/azon-social-share-v2.png" width="360" alt="Azon Social" style="display: block; width: 100%; max-width: 360px; height: auto; margin: 0 auto 12px; border: 0;">
<span style="font-size: 18px; font-weight: 700;">{{ $slot }}</span>
</a>
</td>
</tr>
