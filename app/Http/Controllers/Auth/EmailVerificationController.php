<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    public function notice(): Response|RedirectResponse
    {
        return request()->user()?->hasVerifiedEmail()
            ? redirect()->route('admin.dashboard')
            : Inertia::render('admin/verify-email', ['status' => session('status')]);
    }

    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::query()->findOrFail($id);
        abort_unless(hash_equals($hash, sha1($user->getEmailForVerification())), 403);
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect()->route('admin.login')->with('status', 'E-mail verificado. Você já pode acessar o painel.');
    }

    public function send(Request $request): RedirectResponse
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->route('admin.dashboard');
        }

        $request->user()?->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
