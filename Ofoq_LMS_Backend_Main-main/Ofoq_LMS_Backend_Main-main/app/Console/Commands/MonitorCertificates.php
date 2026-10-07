<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Jobs\GenerateCertificateJob;
use App\Jobs\GenerateDiplomaCertificateJob;
use Illuminate\Support\Facades\Log;

class MonitorCertificates extends Command
{
    protected $signature = 'certificates:monitor {--retry : Retry failed certificates automatically}';
    protected $description = 'Monitor certificate generation status and optionally retry failed ones';

    public function handle()
    {
        $this->info('🔍 Certificate System Monitor');
        $this->info(str_repeat('=', 60));
        $this->newLine();

        // Course Certificates
        $this->info('📜 Course Certificates:');
        $courseTotal = CourseCertificate::count();
        $courseCompleted = CourseCertificate::where('status', 'completed')->count();
        $courseFailed = CourseCertificate::where('status', 'failed')->count();
        $coursePending = CourseCertificate::where('status', 'pending')->count();

        $this->line("   Total: $courseTotal");
        $this->line("   ✓ Completed: $courseCompleted");
        $this->line("   ❌ Failed: $courseFailed");
        $this->line("   ⏳ Pending: $coursePending");
        $this->newLine();

        // Diploma Certificates
        $this->info('🎓 Diploma Certificates:');
        $diplomaTotal = DiplomaCertificate::count();
        $diplomaCompleted = DiplomaCertificate::where('status', 'completed')->count();
        $diplomaFailed = DiplomaCertificate::where('status', 'failed')->count();
        $diplomaPending = DiplomaCertificate::where('status', 'pending')->count();

        $this->line("   Total: $diplomaTotal");
        $this->line("   ✓ Completed: $diplomaCompleted");
        $this->line("   ❌ Failed: $diplomaFailed");
        $this->line("   ⏳ Pending: $diplomaPending");
        $this->newLine();

        // Retry failed if option is set
        if ($this->option('retry') && ($courseFailed > 0 || $diplomaFailed > 0)) {
            $this->info('🔄 Retrying failed certificates...');
            $this->newLine();

            if ($courseFailed > 0) {
                $failedCourse = CourseCertificate::where('status', 'failed')->get();
                foreach ($failedCourse as $cert) {
                    $cert->update(['status' => 'pending', 'certificate_data' => null]);
                    GenerateCertificateJob::dispatch($cert);
                    $this->line("   ✓ Retried course certificate #{$cert->id}");
                }
            }

            if ($diplomaFailed > 0) {
                $failedDiploma = DiplomaCertificate::where('status', 'failed')->get();
                foreach ($failedDiploma as $cert) {
                    $cert->update(['status' => 'pending', 'certificate_data' => null]);
                    GenerateDiplomaCertificateJob::dispatch($cert);
                    $this->line("   ✓ Retried diploma certificate #{$cert->id}");
                }
            }

            $this->newLine();
            $this->info('✅ Retry jobs dispatched. Run queue:work to process them.');
        } elseif ($courseFailed > 0 || $diplomaFailed > 0) {
            $this->newLine();
            $this->warn('⚠️  Failed certificates detected. Run with --retry to retry them:');
            $this->line('   php artisan certificates:monitor --retry');
        } else {
            $this->newLine();
            $this->info('✅ All certificates generated successfully!');
        }

        $this->newLine();
        $this->info(str_repeat('=', 60));

        return 0;
    }
}
