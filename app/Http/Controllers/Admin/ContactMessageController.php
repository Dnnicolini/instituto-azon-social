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
    public function index(Request $request): Response
    {
        $this->authorizeAdministrator();
        $filters = [
            'search' => mb_substr(trim((string) $request->query('search', '')), 0, 100),
            'status' => in_array($request->query('status'), ['new', 'read', 'responded', 'archived'], true)
                ? (string) $request->query('status')
                : null,
            'per_page' => $this->perPage($request),
        ];
        $messages = ContactMessage::query()
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $search = '%'.addcslashes($filters['search'], '%_\\').'%';
                $query->where(fn ($query) => $query
                    ->whereLike('name', $search, caseSensitive: false)
                    ->orWhereLike('email', $search, caseSensitive: false)
                    ->orWhereLike('subject', $search, caseSensitive: false)
                    ->orWhereLike('message', $search, caseSensitive: false));
            })
            ->when($filters['status'], fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (ContactMessage $message): array => $this->serialize($message));

        return Inertia::render('admin/messages', ['messages' => $messages, 'filters' => $filters]);
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

        return redirect()->route('admin.messages.index')->with('success', 'Mensagem atualizada.');
    }

    public function destroy(Request $request, ContactMessage $message): RedirectResponse
    {
        $this->authorizeAdministrator();
        $this->recordChange('message.deleted', $message);
        $message->delete();

        return redirect()->route('admin.messages.index')->with('success', 'Mensagem excluída.');
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
