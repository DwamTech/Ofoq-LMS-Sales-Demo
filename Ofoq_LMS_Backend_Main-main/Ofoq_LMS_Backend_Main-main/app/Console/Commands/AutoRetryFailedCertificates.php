<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Jobs\GenerateCertificateJob;
use App\Jobs\GenerateDiplomaCertificateJob;
use Illuminate\Support\Facades\Log;

class AutoRetryFailedCertificates extends Command
{
    protected $signature = 'certificates:auto-retry';
    protected $description = 'Automatically retry failed certificates (for cron/scheduler)';

    public function handle()
    {
        Log::info('Auto-retry failed certificates started');

        $retried = 0;

        // Retry failed course certificates
        $failedCourse = CourseCertificate::where('status', 'failed')
            ->where('updated_at', '<', now()->subMinutes(5)) // Only retry if failed more than 5 minutes ago
            ->get();

        foreach ($failedCourse as $cert) {
            $cert->update(['status' => 'pending', 'certificate_data' => null]);
            GenerateCertificateJob::dispatch($cert);
            $retried++;
            Log::info('Auto-retried course certificate', ['id' => $cert->id]);
        }

        // Retry failed diploma certificates
        $failedDiploma = DiplomaCertificate::where('status', 'failed')
            ->where('updated_at', '<', now()->subMinutes(5))
            ->get();

        foreach ($failedDiploma as $cert) {
            $cert->update(['status' => 'pending', 'certificate_data' => null]);
            GenerateDiplomaCertificateJob::dispatch($cert);
            $retried++;
            Log::info('Auto-retried diploma certificate', ['id' => $cert->id]);
        }

        if ($retried > 0) {
            Log::info('Auto-retry completed', ['retried_count' => $retried]);
            $this->info("✓ Retried $retried failed certificates");
        } else {
            $this->info('✓ No failed certificates to retry');
        }

        return 0;
    }
}
