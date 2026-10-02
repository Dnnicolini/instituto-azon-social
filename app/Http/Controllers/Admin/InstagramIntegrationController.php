<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\InstagramAccountRequest;
use App\Jobs\SyncInstagramAccount;
use App\Models\AuditLog;
use App\Models\SocialIntegration;
use Illuminate\Http\Client\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use RuntimeException;
use Throwable;

class InstagramIntegrationController extends AdminController
{
    public function index(Request $request): InertiaResponse
    {
        $this->authorizeAnyPermission($request, ['instagram.manage', 'instagram.sync', 'instagram.curate']);
        $accounts = SocialIntegration::query()->where('provider', 'instagram')->withCount('posts')
            ->with('pages:id,title,slug,social_integration_id')
            ->orderBy('sort_order')->orderBy('display_name')->get()->map(fn (SocialIntegration $item): array => $this->serialize($item));

        return Inertia::render('admin/integrations/instagram/index', [
            'accounts' => $accounts,
        ]);
    }

    public function store(InstagramAccountRequest $request): RedirectResponse
    {
        $this->authorizeAutoPublish($request);
        $integration = SocialIntegration::query()->create(['provider' => 'instagram', ...$request->validated()]);
        $this->audit($request, 'instagram.account.created', $integration);

        return back()->with('success', 'Conta do Instagram cadastrada.');
    }

    public function update(InstagramAccountRequest $request, SocialIntegration $integration): RedirectResponse
    {
        $this->ensureInstagram($integration);
        $this->authorizeAutoPublish($request);
        $data = $request->validated();
        if (Arr::has($data, 'enabled')) {
            $data['paused_at'] = $data['enabled'] ? null : now();
        }
        $integration->update($data);
        $this->audit($request, 'instagram.account.updated', $integration);

        return back()->with('success', 'Configuração da conta atualizada.');
    }

    public function connect(Request $request, SocialIntegration $integration): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.manage');
        $this->ensureInstagram($integration);
        abort_unless($this->hasAppCredentials(), 503, 'Configure o ID e o segredo do aplicativo da Meta no servidor.');
        $state = Str::random(64);
        $request->session()->put('instagram_oauth_state', ['token' => $state, 'integration_id' => $integration->id]);

        return redirect()->away('https://www.instagram.com/oauth/authorize?'.http_build_query([
            'client_id' => config('services.instagram.client_id'), 'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code', 'scope' => 'instagram_business_basic', 'enable_fb_login' => 0,
            'force_authentication' => 1, 'state' => $state,
        ]));
    }

    public function callback(Request $request): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.manage');
        $request->validate(['code' => ['required', 'string', 'max:2048'], 'state' => ['required', 'string', 'size:64']]);
        $oauth = $request->session()->pull('instagram_oauth_state');
        abort_unless(is_array($oauth) && is_string($oauth['token'] ?? null) && hash_equals($oauth['token'], (string) $request->query('state')), 419, 'A autorização do Instagram expirou. Tente novamente.');
        $integration = SocialIntegration::query()->where('provider', 'instagram')->findOrFail((int) ($oauth['integration_id'] ?? 0));

        try {
            $short = Http::asForm()->acceptJson()->timeout(20)->post('https://api.instagram.com/oauth/access_token', [
                'client_id' => config('services.instagram.client_id'), 'client_secret' => config('services.instagram.client_secret'),
                'grant_type' => 'authorization_code', 'redirect_uri' => $this->redirectUri(), 'code' => rtrim((string) $request->query('code'), '#_'),
            ]);
            $this->ensureSuccessful($short, 'concluir a autorização');
            $shortToken = $short->json('access_token');
            $accountId = $short->json('user_id');
            abort_unless(is_string($shortToken) && $shortToken !== '' && (is_string($accountId) || is_int($accountId)), 502, 'A Meta devolveu dados incompletos da conta.');
            $long = Http::acceptJson()->timeout(20)->get(rtrim((string) config('services.instagram.graph_url'), '/').'/access_token', [
                'grant_type' => 'ig_exchange_token', 'client_secret' => config('services.instagram.client_secret'), 'access_token' => $shortToken,
            ]);
            $this->ensureSuccessful($long, 'criar a autorização de longa duração');
            $token = $long->json('access_token');
            abort_unless(is_string($token) && $token !== '', 502, 'A Meta não devolveu uma autorização válida.');
            $profile = Http::acceptJson()->timeout(20)->get(rtrim((string) config('services.instagram.graph_url'), '/').'/'.$accountId, ['fields' => 'user_id,username', 'access_token' => $token]);
            $this->ensureSuccessful($profile, 'validar a identidade da conta');
            $username = strtolower((string) $profile->json('username'));
            if (! hash_equals(strtolower((string) $integration->expected_username), $username)) {
                throw new RuntimeException("A conta autorizada @{$username} não corresponde ao perfil esperado.");
            }
            $expiresIn = filter_var($long->json('expires_in'), FILTER_VALIDATE_INT);
            $integration->update([
                'account_id' => (string) $accountId, 'username' => $username, 'access_token' => $token, 'enabled' => true,
                'paused_at' => null, 'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null, 'last_error' => null,
            ]);
            $this->audit($request, 'instagram.connected', $integration);
            SyncInstagramAccount::dispatch($integration->id, 'oauth');
        } catch (Throwable $exception) {
            report(new RuntimeException('Falha segura no OAuth do Instagram: '.class_basename($exception)));

            return redirect()->route('admin.instagram.index')->withErrors(['instagram' => $exception instanceof RuntimeException && str_contains($exception->getMessage(), 'perfil esperado') ? $exception->getMessage() : 'Não foi possível conectar o Instagram.']);
        }

        return redirect()->route('admin.instagram.index')->with('success', 'Instagram conectado; a primeira sincronização foi enfileirada.');
    }

    public function sync(Request $request, SocialIntegration $integration): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.sync');
        $this->ensureInstagram($integration);
        abort_unless($integration->enabled && filled($integration->access_token), 422, 'Conecte a conta antes de sincronizar.');
        SyncInstagramAccount::dispatch($integration->id, 'manual');
        $this->audit($request, 'instagram.sync.queued', $integration);

        return back()->with('success', 'Sincronização enfileirada.');
    }

    public function status(Request $request, SocialIntegration $integration): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.manage');
        $this->ensureInstagram($integration);
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        $integration->update(['enabled' => $data['enabled'], 'paused_at' => $data['enabled'] ? null : now()]);
        $this->audit($request, 'instagram.status.updated', $integration);

        return back()->with('success', $data['enabled'] ? 'Sincronização ativada.' : 'Sincronização pausada.');
    }

    public function visibility(Request $request, SocialIntegration $integration): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.manage');
        $this->ensureInstagram($integration);
        $data = $request->validate(['public_enabled' => ['required', 'boolean']]);
        $integration->update($data);
        $this->audit($request, 'instagram.visibility.updated', $integration);

        return back()->with('success', 'Visibilidade pública atualizada.');
    }

    public function destroy(Request $request, SocialIntegration $integration): RedirectResponse
    {
        $this->authorizePermission($request, 'instagram.manage');
        $this->ensureInstagram($integration);
        $integration->update([
            'account_id' => null,
            'username' => null,
            'access_token' => null,
            'enabled' => false,
            'public_enabled' => false,
            'paused_at' => now(),
            'token_expires_at' => null,
            'last_error' => null,
        ]);
        $this->audit($request, 'instagram.disconnected', $integration);

        return back()->with('success', 'Credencial removida deste sistema. A configuração e as publicações foram preservadas; confirme a revogação também na Meta.');
    }

    /** @return array<string, mixed> */
    private function serialize(SocialIntegration $item): array
    {
        return [
            'id' => $item->id, 'slug' => $item->expected_username, 'display_name' => $item->display_name, 'expected_username' => $item->expected_username,
            'username' => $item->username, 'description' => $item->description, 'group_key' => $item->group_key,
            'sort_order' => $item->sort_order,
            'status' => filled($item->access_token) ? ($item->enabled ? 'connected' : 'paused') : 'disconnected',
            'connected' => filled($item->access_token), 'can_connect' => $this->hasAppCredentials(),
            'enabled' => $item->enabled, 'public_enabled' => $item->public_enabled, 'auto_publish' => $item->auto_publish,
            'display_locations' => $item->display_locations ?? [], 'last_success_at' => $item->last_successful_sync_at?->toIso8601String(),
            'last_error' => $item->last_error, 'imported_count' => $item->imported_posts_count,
            'pages' => $item->pages->map(fn ($page): array => ['id' => $page->id, 'title' => $page->title, 'slug' => $page->slug])->values(),
        ];
    }

    private function ensureInstagram(SocialIntegration $integration): void
    {
        abort_unless($integration->provider === 'instagram', 404);
    }

    private function authorizePermission(Request $request, string $permission): void
    {
        abort_unless($request->user()?->hasPermission($permission), 403);
    }

    private function authorizeAutoPublish(Request $request): void
    {
        if ($request->boolean('auto_publish')) {
            $this->authorizePermission($request, 'content.publish');
        }
    }

    /** @param list<string> $permissions */
    private function authorizeAnyPermission(Request $request, array $permissions): void
    {
        abort_unless(collect($permissions)->contains(
            fn (string $permission): bool => $request->user()?->hasPermission($permission) === true,
        ), 403);
    }

    private function redirectUri(): string
    {
        return (string) (config('services.instagram.redirect_uri') ?: route('admin.instagram.callback'));
    }

    private function hasAppCredentials(): bool
    {
        return filled(config('services.instagram.client_id')) && filled(config('services.instagram.client_secret'));
    }

    private function ensureSuccessful(Response $response, string $operation): void
    {
        if (! $response->successful()) {
            throw new RuntimeException("Não foi possível {$operation} no Instagram (HTTP {$response->status()}).");
        }
    }

    private function audit(Request $request, string $action, SocialIntegration $integration): void
    {
        AuditLog::query()->create(['user_id' => $request->user()?->id, 'action' => $action, 'auditable_type' => SocialIntegration::class, 'auditable_id' => $integration->id, 'metadata' => ['username' => $integration->expected_username], 'ip_hash' => $this->ipHash()]);
    }
}
