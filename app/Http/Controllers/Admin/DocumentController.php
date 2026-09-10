<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\DocumentRequest;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', Document::class);
        $items = Document::query()->with('media')->latest('updated_at')->paginate(15)->withQueryString()->through(fn (Document $document): array => $this->serialize($document));

        return Inertia::render('admin/content/index', ['resource' => 'documents', 'items' => $items]);
    }

    public function create(): Response
    {
        $this->authorize('create', Document::class);

        return Inertia::render('admin/content/form', ['resource' => 'documents', 'item' => null]);
    }

    public function store(DocumentRequest $request): RedirectResponse
    {
        $document = DB::transaction(function () use ($request): Document {
            $data = $this->normalizePublication(Arr::except($request->validated(), 'file'));
            $data['media_asset_id'] = $this->createAsset($request->file('file'), 'cms/documents')->id;
            $document = Document::query()->create($data);
            $this->recordChange('document.created', $document);

            return $document;
        });

        return redirect()->route('admin.documents.edit', $document)->with('success', 'Documento criado.');
    }

    public function edit(Document $document): Response
    {
        $this->authorize('update', $document);

        return Inertia::render('admin/content/form', ['resource' => 'documents', 'item' => $this->serialize($document->load('media'))]);
    }

    public function update(DocumentRequest $request, Document $document): RedirectResponse
    {
        DB::transaction(function () use ($request, $document): void {
            $before = $document->attributesToArray();
            $data = $this->normalizePublication(Arr::except($request->validated(), 'file'));
            if ($request->hasFile('file')) {
                $data['media_asset_id'] = $this->createAsset($request->file('file'), 'cms/documents')->id;
            }
            $document->update($data);
            $this->recordChange('document.updated', $document, $before);
        });

        return back()->with('success', 'Documento atualizado.');
    }

    public function destroy(Document $document): RedirectResponse
    {
        $this->authorize('delete', $document);
        DB::transaction(function () use ($document): void {
            $this->recordChange('document.deleted', $document, $document->attributesToArray());
            $document->delete();
        });

        return redirect()->route('admin.documents.index')->with('success', 'Documento excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(Document $document): array
    {
        return ['id' => $document->id, 'title' => $document->title, 'slug' => $document->slug, 'description' => $document->description, 'category' => $document->category, 'status' => $document->status->value, 'file_url' => $document->media?->url, 'published_at' => $document->published_at?->toIso8601String(), 'updated_at' => $document->updated_at?->toIso8601String()];
    }
}
