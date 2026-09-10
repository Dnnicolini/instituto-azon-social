<?php

namespace App\Http\Controllers\Admin;

use App\Models\AuditLog;
use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Illuminate\Http\Client\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class InstagramIntegrationController extends AdminController
{
    public function connect(Request $request): RedirectResponse
    {
        $this->authorizeAdministrator($request);
        abort_unless($this->hasAppCredentials(), 503, 'Configure o ID e o segredo do aplicativo da Meta no servidor.');

        $state = Str::random(64);
        $request->session()->put('instagram_oauth_state', $state);

        return redirect()->away('https://www.instagram.com/oauth/authorize?'.http_build_query([
            'client_id' => config('services.instagram.client_id'),
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => 'instagram_business_basic',
            'enable_fb_login' => 0,
            'force_authentication' => 1,
            'state' => $state,
        ]));
    }

    public function callback(Request $request, InstagramFeedSynchronizer $synchronizer): RedirectResponse
    {
        $this->authorizeAdministrator($request);
        $request->validate([
            'code' => ['required', 'string', 'max:2048'],
            'state' => ['required', 'string', 'size:64'],
        ]);

        $expectedState = (string) $request->session()->pull('instagram_oauth_state');
        abort_unless($expectedState !== '' && hash_equals($expectedState, (string) $request->query('state')), 419, 'A autorização do Instagram expirou. Tente novamente.');

        try {
            $shortLived = Http::asForm()->acceptJson()->timeout(20)->post('https://api.instagram.com/oauth/access_token', [
                'client_id' => config('services.instagram.client_id'),
                'client_secret' => config('services.instagram.client_secret'),
                'grant_type' => 'authorization_code',
                'redirect_uri' => $this->redirectUri(),
                'code' => rtrim((string) $request->query('code'), '#_'),
            ]);
            $this->ensureSuccessful($shortLived, 'concluir a autorização');

            $shortToken = $shortLived->json('access_token');
            abort_unless(is_string($shortToken) && $shortToken !== '', 502, 'A Meta não devolveu uma autorização válida.');

            $longLived = Http::acceptJson()->timeout(20)->get(rtrim((string) config('services.instagram.graph_url'), '/').'/access_token', [
                'grant_type' => 'ig_exchange_token',
                'client_secret' => config('services.instagram.client_secret'),
                'access_token' => $shortToken,
            ]);
            $this->ensureSuccessful($longLived, 'criar a autorização de longa duração');

            $token = $longLived->json('access_token');
            $accountId = $shortLived->json('user_id');
            abort_unless(is_string($token) && $token !== '' && (is_string($accountId) || is_int($accountId)), 502, 'A Meta devolveu dados incompletos da conta.');

            $profile = Http::acceptJson()->timeout(20)->get(rtrim((string) config('services.instagram.graph_url'), '/').'/'.$accountId, [
                'fields' => 'user_id,username',
                'access_token' => $token,
            ]);
            $username = $profile->successful() && is_string($profile->json('username'))
                ? $profile->json('username')
                : (string) config('services.instagram.username', 'azon.social');
            $expiresIn = filter_var($longLived->json('expires_in'), FILTER_VALIDATE_INT);

            SocialIntegration::query()->updateOrCreate(['provider' => 'instagram'], [
                'account_id' => (string) $accountId,
                'username' => $username,
                'access_token' => $token,
                'enabled' => true,
                'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
                'last_error' => null,
            ]);
            AuditLog::query()->create([
                'user_id' => $request->user()?->id,
                'action' => 'instagram.connected',
                'metadata' => ['username' => $username],
                'ip_hash' => $this->ipHash(),
            ]);

        } catch (Throwable $exception) {
            report(new RuntimeException('Falha segura no fluxo OAuth do Instagram: '.class_basename($exception)));

            return redirect()->route('admin.settings.edit')->withErrors([
                'instagram' => 'Não foi possível conectar o Instagram. Nenhuma credencial foi exibida ou registrada em log.',
            ]);
        }

        try {
            $synchronizer->sync();
        } catch (Throwable $exception) {
            report(new RuntimeException('Falha segura na primeira sincronização do Instagram: '.class_basename($exception)));

            return redirect()->route('admin.settings.edit')->with('success', 'Instagram conectado. A primeira sincronização será repetida automaticamente.');
        }

        return redirect()->route('admin.settings.edit')->with('success', 'Instagram conectado e publicações sincronizadas.');
    }

    public function sync(Request $request, InstagramFeedSynchronizer $synchronizer): RedirectResponse
    {
        $this->authorizeAdministrator($request);

        try {
            $result = $synchronizer->sync();
        } catch (Throwable $exception) {
            report(new RuntimeException('Falha segura na sincronização manual do Instagram: '.class_basename($exception)));

            return back()->withErrors(['instagram' => 'A sincronização falhou. A última versão salva continuará no site.']);
        }

        return back()->with('success', "Instagram sincronizado: {$result['created']} nova(s) e {$result['updated']} atualizada(s).");
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $this->authorizeAdministrator($request);
        SocialIntegration::query()->where('provider', 'instagram')->update([
            'enabled' => false,
            'access_token' => null,
            'token_expires_at' => null,
            'last_error' => null,
        ]);
        AuditLog::query()->create([
            'user_id' => $request->user()?->id,
            'action' => 'instagram.disconnected',
            'ip_hash' => $this->ipHash(),
        ]);

        return back()->with('success', 'Integração do Instagram desconectada. As publicações já salvas foram preservadas.');
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

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless($request->user()?->hasRole('administrator'), 403);
    }
}
