<?php

namespace App\Services;

use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use RuntimeException;

/**
 * Generates deterministic, offline PDF artifacts for the local sales demo.
 *
 * This deliberately does not call an HTTP API or queue worker: demo setup must
 * finish with a real file before it marks a certificate ready for download.
 */
class DemoCertificatePdfService
{
    public function generateCourse(CourseCertificate $certificate): string
    {
        $certificate->loadMissing(['user', 'course.category']);

        if (! $certificate->user || ! $certificate->course) {
            throw new RuntimeException('Course certificate is missing its student or course relation.');
        }

        $path = 'certificates/demo/courses/'.$certificate->serial_number.'.pdf';
        $html = view('certificates.demo-course', [
            'studentName' => $certificate->user->name,
            'courseName' => $certificate->course->title,
            'diplomaName' => $certificate->course->category?->name,
            'serialNumber' => $certificate->serial_number,
            'verificationUrl' => url('/api/course-certificate/verify/'.$certificate->verification_token),
            'issuedAt' => optional($certificate->updated_at)->format('Y/m/d') ?? now()->format('Y/m/d'),
        ])->render();

        $this->writePdf($path, $html, 'شهادة إتمام مقرر');

        return $path;
    }

    public function generateDiploma(DiplomaCertificate $certificate): string
    {
        $certificate->loadMissing(['user', 'diploma']);

        if (! $certificate->user || ! $certificate->diploma) {
            throw new RuntimeException('Diploma certificate is missing its student or diploma relation.');
        }

        $path = 'certificates/demo/diplomas/'.$certificate->serial_number.'.pdf';
        $html = view('certificates.demo-diploma', [
            'studentName' => $certificate->user->name,
            'diplomaName' => $certificate->diploma->name,
            'serialNumber' => $certificate->serial_number,
            'verificationUrl' => url('/api/diploma-certificate/verify/'.$certificate->verification_token),
            'issuedAt' => optional($certificate->issued_at)->format('Y/m/d') ?? now()->format('Y/m/d'),
        ])->render();

        $this->writePdf($path, $html, 'شهادة إتمام دبلوم');

        return $path;
    }

    public function isReadablePdf(?string $path): bool
    {
        return is_string($path)
            && $path !== ''
            && Storage::disk('public')->exists($path)
            && str_starts_with((string) Storage::disk('public')->get($path), '%PDF-');
    }

    private function writePdf(string $path, string $html, string $title): void
    {
        $pdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'default_font' => 'dejavusans',
            'margin_left' => 12,
            'margin_right' => 12,
            'margin_top' => 12,
            'margin_bottom' => 12,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
        ]);

        $pdf->SetTitle($title);
        $pdf->SetDirectionality('rtl');
        $pdf->WriteHTML($html);
        $contents = $pdf->Output('', 'S');

        if (! is_string($contents) || ! str_starts_with($contents, '%PDF-')) {
            throw new RuntimeException('The PDF generator did not return a valid PDF document.');
        }

        Storage::disk('public')->put($path, $contents);

        if (! $this->isReadablePdf($path)) {
            throw new RuntimeException('The generated certificate PDF could not be read from public storage.');
        }
    }
}
