<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactController extends Controller
{
    public function store(ContactRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('website');
        $ip = $request->ip();
        $data['ip_hash'] = $ip ? hash_hmac('sha256', $ip, (string) config('app.key')) : null;
        $message = ContactMessage::query()->create($data);

        try {
            Mail::to(config('mail.contact_recipients', []))->queue(new ContactMessageReceived($message));
        } catch (Throwable $exception) {
            report($exception);
        }

        return back()->with('success', 'Mensagem recebida. Entraremos em contato em breve.');
    }
}
