<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(ContactRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('website');
        $ip = $request->ip();
        $data['ip_hash'] = $ip ? hash_hmac('sha256', $ip, (string) config('app.key')) : null;
        ContactMessage::query()->create($data);

        return back()->with('success', 'Mensagem recebida. Entraremos em contato em breve.');
    }
}
