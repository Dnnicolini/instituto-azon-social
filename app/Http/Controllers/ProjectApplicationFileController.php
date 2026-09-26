<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectApplication;
use App\Models\ProjectApplicationFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectApplicationFileController extends Controller
{
    public function show(Request $request, Project $project, ProjectApplication $application, ProjectApplicationFile $file): StreamedResponse
    {
        abort_unless($application->project_id === $project->id, 404);
        abort_unless($file->application_id === $application->id, 404);
        $this->authorize('view', $application);

        return response()->streamDownload(function () use ($file): void {
            $stream = Storage::disk($file->disk)->readStream($file->path);
            abort_unless(is_resource($stream), 404);
            fpassthru($stream);
            fclose($stream);
        }, $file->original_name, ['Content-Type' => $file->mime_type, 'X-Content-Type-Options' => 'nosniff']);
    }
}
