<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing('roles.permissions');
        $roles = $user?->roles->pluck('slug')->values()->all() ?? [];
        $permissions = $user?->roles->flatMap->permissions->pluck('slug')->unique()->values()->all() ?? [];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'roles' => $roles,
                    'permissions' => $permissions,
                ] : null,
            ],
            'flash' => [
                'success' => fn (): mixed => $request->session()->get('success'),
                'status' => fn (): mixed => $request->session()->get('status'),
            ],
            ...($request->is('admin/*') || $request->is('admin') ? [
                'seo' => [
                    'title' => 'Área administrativa | Instituto Azon Social',
                    'description' => 'Área restrita de gestão de conteúdo.',
                    'canonical' => $request->url(),
                    'robots' => 'noindex, nofollow',
                    'image' => url('/azon-social-share.png'),
                    'imageAlt' => 'Logomarca do Instituto Azon Social',
                    'imageWidth' => 1200,
                    'imageHeight' => 630,
                    'imageType' => 'image/png',
                    'keywords' => '',
                    'type' => 'website',
                    'locale' => 'pt_BR',
                    'siteName' => config('site.name'),
                    'schema' => [],
                ],
            ] : []),
        ];
    }
}
