<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentCertificateDownloadController extends Controller
{
    public function __invoke(Request $request, string $type, int $certificate)
    {
        abort_unless($request->user()?->role === 'student', 403);
        $model = match ($type) {
            'course' => CourseCertificate::class,
            'legacy-course' => Certificate::class,
            'diploma' => DiplomaCertificate::class,
            default => abort(404),
        };
        $record = $model::where('user_id', $request->user()->id)->findOrFail($certificate);
        $issued = match ($type) {
            // Existing generator marks successfully produced course PDFs completed.
            'course' => in_array($record->status, ['completed', 'issued'], true),
            'diploma' => $record->status === 'completed',
            default => $record->issued_at !== null,
        };
        abort_unless($issued && $record->file_path, 404);
        $root = realpath(Storage::disk('public')->path(''));
        $file = realpath(Storage::disk('public')->path($record->file_path));
        abort_unless($root && $file && str_starts_with($file, $root.DIRECTORY_SEPARATOR) && is_file($file) && is_readable($file), 404);
        $stream = fopen($file, 'rb');
        $signature = $stream ? fread($stream, 5) : '';
        if ($stream) {
            fclose($stream);
        }
        abort_unless($signature === '%PDF-', 404);

        return response()->stream(function () use ($file) {
            $stream = fopen($file, 'rb');
            if ($stream) {
                fpassthru($stream);
                fclose($stream);
            }
        }, 200, ['Content-Type' => 'application/pdf', 'Cache-Control' => 'no-store, private', 'X-Content-Type-Options' => 'nosniff']);
    }
}
