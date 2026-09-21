<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentFileController extends Controller
{
    public function show(Document $document): BinaryFileResponse
    {
        abort_unless(Document::query()->published()->whereKey($document->getKey())->exists(), 404);

        return $this->file($document);
    }

    public function preview(Document $document): BinaryFileResponse
    {
        $this->authorize('view', $document);

        return $this->file($document);
    }

    private function file(Document $document): BinaryFileResponse
    {
        $asset = $document->media;
        abort_unless($asset?->disk === 'local' && Storage::disk('local')->exists($asset->path), 404);

        $response = response()->file(Storage::disk('local')->path($asset->path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="documento-'.$document->getKey().'.pdf"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store',
        ]);

        $response->setPrivate();

        return $response;
    }
}
