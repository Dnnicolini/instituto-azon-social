<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $policy = "frame-ancestors 'self'; base-uri 'self'; object-src 'none'";
        if (config('app.env') === 'production') {
            $scriptSources = $request->is('admin', 'admin/*')
                ? "'self'"
                : "'self' https://vlibras.gov.br https://cdn.jsdelivr.net";
            $policy .= "; script-src {$scriptSources}";
        }
        $response->headers->set('Content-Security-Policy', $policy);
        $response->headers->set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        if ($request->is('admin/redefinir-senha/*', 'admin/verificar-email/*')) {
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        return $response;
    }
}
