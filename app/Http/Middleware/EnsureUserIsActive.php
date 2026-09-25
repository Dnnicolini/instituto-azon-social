<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        if ($request->user()?->disabled_at === null) {
            return $next($request);
        }

        auth()->guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('error', 'Não foi possível acessar o painel com essas credenciais.');
    }
}
