<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CandidateLoginRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CandidateAuthController extends Controller
{
    public function login(): Response
    {
        return Inertia::render('auth/candidate-login');
    }

    public function authenticate(CandidateLoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return $request->user()->hasVerifiedEmail()
            ? redirect()->intended(route('applications.index'))
            : redirect()->route('candidate.verification.notice');
    }

    public function register(): Response
    {
        return Inertia::render('auth/candidate-register');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(10)->mixedCase()->numbers()],
        ]);
        $user = User::query()->create(['name' => $data['name'], 'email' => mb_strtolower($data['email']), 'password' => Hash::make($data['password'])]);
        auth()->login($user);
        $request->session()->regenerate();
        try {
            event(new Registered($user));
        } catch (Throwable $exception) {
            report($exception);
        }

        return redirect()->route('candidate.verification.notice')->with('status', 'verification-link-sent');
    }

    public function verificationNotice(): Response|RedirectResponse
    {
        return request()->user()->hasVerifiedEmail()
            ? redirect()->route('applications.index')
            : Inertia::render('auth/candidate-verify-email', ['status' => session('status')]);
    }

    public function resendVerification(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('applications.index');
        }
        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            report($exception);
        }

        return back()->with('status', 'verification-link-sent');
    }

    public function logout(Request $request): RedirectResponse
    {
        auth()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('candidate.login');
    }
}
