<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\SettingsRequest;
use App\Models\AuditLog;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends AdminController
{
    public function edit(): Response
    {
        abort_unless(request()->user()?->hasPermission('settings.manage'), 403);

        return Inertia::render('admin/settings', [
            'settings' => SiteSetting::query()->orderBy('group')->orderBy('key')->get()->mapWithKeys(fn (SiteSetting $setting): array => [$setting->key => $setting->value]),
        ]);
    }

    public function update(SettingsRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $allowed = SiteSetting::query()->pluck('key')->all();
            foreach ($request->validated('settings') as $key => $value) {
                abort_unless(in_array($key, $allowed, true), 422, 'Configuração inválida.');
                SiteSetting::query()->where('key', $key)->update(['value' => $value]);
            }
            AuditLog::query()->create(['user_id' => $request->user()->id, 'action' => 'settings.updated', 'metadata' => ['keys' => array_keys($request->validated('settings'))], 'ip_hash' => $this->ipHash()]);
        });

        return back()->with('success', 'Configurações atualizadas.');
    }
}
