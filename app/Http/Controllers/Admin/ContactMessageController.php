<?php

namespace App\Http\Controllers\Admin;

use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessageController extends AdminController
{
    public function index(): Response
    {
        $this->authorizeAdministrator();
        $messages = ContactMessage::query()->latest()->paginate(20)->withQueryString()->through(fn (ContactMessage $message): array => $this->serialize($message));

        return Inertia::render('admin/messages', ['messages' => $messages]);
    }

    public function update(Request $request, ContactMessage $message): RedirectResponse
    {
        $this->authorizeAdministrator();
        $data = $request->validate(['status' => ['required', Rule::in(['new', 'read', 'responded', 'archived'])]]);
        $message->update([
            'status' => $data['status'],
            'read_at' => in_array($data['status'], ['read', 'responded', 'archived'], true) ? ($message->read_at ?? now()) : null,
            'responded_at' => $data['status'] === 'responded' ? ($message->responded_at ?? now()) : null,
        ]);
        $this->recordChange('message.updated', $message);

        return back()->with('success', 'Mensagem atualizada.');
    }

    public function destroy(Request $request, ContactMessage $message): RedirectResponse
    {
        $this->authorizeAdministrator();
        $this->recordChange('message.deleted', $message);
        $message->delete();

        return back()->with('success', 'Mensagem excluída.');
    }

    /** @return array<string, mixed> */
    private function serialize(ContactMessage $message): array
    {
        return ['id' => $message->id, 'name' => $message->name, 'email' => $message->email, 'phone' => $message->phone, 'subject' => $message->subject, 'message' => $message->message, 'body' => $message->message, 'status' => $message->status, 'created_at' => $message->created_at?->toIso8601String()];
    }

    private function authorizeAdministrator(): void
    {
        abort_unless(request()->user()?->hasRole('administrator'), 403);
    }
}
