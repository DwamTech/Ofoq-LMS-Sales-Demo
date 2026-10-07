<?php

/**
 * إعادة محاولة توليد الشهادات الفاشلة
 * Retry Failed Certificate Generation
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🔄 إعادة محاولة الشهادات الفاشلة / Retry Failed Certificates\n";
echo str_repeat("=", 80) . "\n\n";

// البحث عن شهادات الكورسات الفاشلة
echo "📜 شهادات الكورسات الفاشلة:\n";
echo str_repeat("-", 80) . "\n";

$failedCourseCerts = \App\Models\CourseCertificate::where('status', 'failed')->get();

if ($failedCourseCerts->isEmpty()) {
    echo "✓ لا توجد شهادات كورسات فاشلة\n";
} else {
    echo "وجدت " . $failedCourseCerts->count() . " شهادة فاشلة\n\n";
    
    foreach ($failedCourseCerts as $cert) {
        echo "  📄 الشهادة #" . $cert->id . "\n";
        echo "     المستخدم: " . $cert->user->name . " (ID: " . $cert->user_id . ")\n";
        echo "     الكورس: " . $cert->course->title . " (ID: " . $cert->course_id . ")\n";
        echo "     الرقم التسلسلي: " . $cert->serial_number . "\n";
        
        // إعادة تعيين الحالة إلى pending
        $cert->update([
            'status' => 'pending',
            'certificate_data' => null,
        ]);
        
        // إعادة إرسال المهمة
        \App\Jobs\GenerateCertificateJob::dispatch($cert);
        
        echo "     ✓ تم إعادة إرسال المهمة\n\n";
    }
}

// البحث عن شهادات الدبلومات الفاشلة
echo "\n🎓 شهادات الدبلومات الفاشلة:\n";
echo str_repeat("-", 80) . "\n";

$failedDiplomaCerts = \App\Models\DiplomaCertificate::where('status', 'failed')->get();

if ($failedDiplomaCerts->isEmpty()) {
    echo "✓ لا توجد شهادات دبلومات فاشلة\n";
} else {
    echo "وجدت " . $failedDiplomaCerts->count() . " شهادة فاشلة\n\n";
    
    foreach ($failedDiplomaCerts as $cert) {
        echo "  📄 الشهادة #" . $cert->id . "\n";
        echo "     المستخدم: " . $cert->user->name . " (ID: " . $cert->user_id . ")\n";
        echo "     الدبلومة: " . $cert->category->name . " (ID: " . $cert->category_id . ")\n";
        echo "     الرقم التسلسلي: " . $cert->serial_number . "\n";
        
        // إعادة تعيين الحالة إلى pending
        $cert->update([
            'status' => 'pending',
            'certificate_data' => null,
        ]);
        
        // إعادة إرسال المهمة
        \App\Jobs\GenerateDiplomaCertificateJob::dispatch($cert);
        
        echo "     ✓ تم إعادة إرسال المهمة\n\n";
    }
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "✅ تم إعادة إرسال جميع الشهادات الفاشلة\n";
echo "📝 الخطوة التالية: شغل queue worker لمعالجة المهام\n";
echo "   php artisan queue:work --once\n";
echo str_repeat("=", 80) . "\n";
