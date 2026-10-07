<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ClearAllCertificates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'certificates:clear {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all certificates from database and storage (use with caution!)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('⚠️  تحذير: هذا الأمر سيمسح جميع الشهادات نهائياً!');
        $this->line('');

        // Count existing certificates
        $certificatesCount = \App\Models\Certificate::count();
        $courseCertificatesCount = \App\Models\CourseCertificate::count();
        $diplomaCertificatesCount = \App\Models\DiplomaCertificate::count();

        $this->info("📊 الإحصائيات الحالية:");
        $this->line("   - جدول certificates: {$certificatesCount} سجل");
        $this->line("   - جدول course_certificates: {$courseCertificatesCount} سجل");
        $this->line("   - جدول diploma_certificates: {$diplomaCertificatesCount} سجل");
        $this->line('');

        $total = $certificatesCount + $courseCertificatesCount + $diplomaCertificatesCount;

        if ($total === 0) {
            $this->info('✅ لا توجد شهادات لمسحها. قاعدة البيانات نظيفة بالفعل.');
            return 0;
        }

        // Confirmation
        if (!$this->option('force')) {
            if (!$this->confirm("هل أنت متأكد من مسح {$total} شهادة؟ هذا الإجراء لا يمكن التراجع عنه!")) {
                $this->info('تم إلغاء العملية.');
                return 0;
            }
        }

        $this->line('');
        $this->info('🗑️  جاري المسح...');

        // Delete from database
        $deleted1 = \App\Models\Certificate::query()->delete();
        $this->line("   ✓ تم مسح {$deleted1} من جدول certificates");

        $deleted2 = \App\Models\CourseCertificate::query()->delete();
        $this->line("   ✓ تم مسح {$deleted2} من جدول course_certificates");

        $deleted3 = \App\Models\DiplomaCertificate::query()->delete();
        $this->line("   ✓ تم مسح {$deleted3} من جدول diploma_certificates");

        // Delete PDF files from storage
        $this->line('');
        $this->info('📁 جاري مسح ملفات PDF...');

        $deletedFiles = 0;

        // Delete course certificates folder
        if (Storage::disk('public')->exists('certificates/courses')) {
            $files = Storage::disk('public')->allFiles('certificates/courses');
            foreach ($files as $file) {
                Storage::disk('public')->delete($file);
                $deletedFiles++;
            }
            $this->line("   ✓ تم مسح {$deletedFiles} ملف من certificates/courses");
        }

        // Delete diploma certificates folder
        $diplomaFiles = 0;
        if (Storage::disk('public')->exists('certificates/diplomas')) {
            $files = Storage::disk('public')->allFiles('certificates/diplomas');
            foreach ($files as $file) {
                Storage::disk('public')->delete($file);
                $diplomaFiles++;
            }
            $this->line("   ✓ تم مسح {$diplomaFiles} ملف من certificates/diplomas");
        }

        $this->line('');
        $this->info('✅ تم مسح جميع الشهادات بنجاح!');
        $this->line("   - إجمالي السجلات المحذوفة: " . ($deleted1 + $deleted2 + $deleted3));
        $this->line("   - إجمالي الملفات المحذوفة: " . ($deletedFiles + $diplomaFiles));

        return 0;
    }
}
