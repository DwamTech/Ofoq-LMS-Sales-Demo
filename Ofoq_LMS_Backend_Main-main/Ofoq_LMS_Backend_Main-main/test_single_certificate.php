<?php

/**
 * اختبار توليد شهادة واحدة مباشرة
 * Test Single Certificate Generation
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Browsershot\Browsershot;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

echo "🧪 اختبار توليد شهادة واحدة / Test Single Certificate\n";
echo str_repeat("=", 80) . "\n\n";

// استخدام بيانات تجريبية كاملة
$certificateData = [
    'student_name' => 'اختبار الطالب',
    'course_title' => 'اختبار الكورس',
    'course_name' => 'اختبار الكورس',
    'instructor_name' => 'اختبار المدرب',
    'completion_date' => now()->format('j F Y'),
    'serial_number' => 'TEST-' . time(),
    'verification_token' => \Illuminate\Support\Str::uuid(),
    'issued_date' => now()->format('F d, Y'),
    'course_hours' => '10 ساعات تدريبية',
    'lectures_count' => 15,
    'diploma_name' => 'دبلومة الإدارة الإعلامية',
    'h1_text' => 'شهادة إتمام الدورة التدريبية',
    'p1_text' => 'قد حضر المقرر الدراسي',
    'p2_line1_text' => 'ضمن دبلومة الإدارة الإعلامية',
    'p2_line2_text' => 'وقد اجتاز الاختبار بنجاح',
    'p2_line3_text' => 'وهذه شهادة منا بذلك سائلين المولي عز وجل له دوام التوفيق والسداد',
    'footer_text' => 'أكمل بتاريخ',
    'title_text' => 'شهادة',
    'qrCodeBase64' => '',
    'backgroundImageBase64' => '',
];

echo "📝 بيانات الشهادة:\n";
echo "   الطالب: " . $certificateData['student_name'] . "\n";
echo "   الكورس: " . $certificateData['course_name'] . "\n";
echo "   الرقم التسلسلي: " . $certificateData['serial_number'] . "\n\n";

// إضافة QR Code وصورة الخلفية
echo "🖼️ إعداد الصور...\n";

// QR Code
$verificationUrl = 'https://www.ofuq.academy/verify-certificate?s=' . $certificateData['serial_number'];
try {
    $qrResponse = \Illuminate\Support\Facades\Http::timeout(10)->get("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verificationUrl));
    if ($qrResponse->successful()) {
        $certificateData['qrCodeBase64'] = 'data:image/png;base64,' . base64_encode($qrResponse->body());
        echo "✓ تم توليد QR Code\n";
    }
} catch (Exception $e) {
    echo "⚠️  فشل توليد QR Code (سيتم المتابعة بدونه)\n";
}

// Background Image
$imagePath = public_path('storage/certifecate_cover.jpg');
if (file_exists($imagePath) && is_readable($imagePath)) {
    $imageData = base64_encode(file_get_contents($imagePath));
    $certificateData['backgroundImageBase64'] = 'data:image/jpeg;base64,' . $imageData;
    echo "✓ تم تحميل صورة الخلفية\n";
} else {
    echo "⚠️  صورة الخلفية غير موجودة في: $imagePath\n";
}
echo "\n";

try {
    echo "🔧 إعداد Browsershot...\n";
    
    $fileName = 'certificates/courses/test_' . time() . '.pdf';
    $fullPath = storage_path('app/public/' . $fileName);
    
    // تأكيد وجود المجلد
    if (!Storage::disk('public')->exists('certificates/courses')) {
        Storage::disk('public')->makeDirectory('certificates/courses');
        echo "✓ تم إنشاء مجلد الشهادات\n";
    }
    
    $browsershot = Browsershot::html(view('certificates.course_certificate_simple', $certificateData)->render())
        ->showBackground()
        ->landscape()
        ->format('A4')
        ->waitUntilNetworkIdle()
        ->setEnvironmentOptions([
            'SNAP_NAME' => 'chromium',
            'SNAP_INSTANCE_NAME' => 'chromium',
        ]);

    // Configure from environment
    $nodePath = env('BROWSERSHOT_NODE_PATH_LINUX', env('BROWSERSHOT_NODE_PATH'));
    $chromePath = env('BROWSERSHOT_CHROME_PATH_LINUX', env('BROWSERSHOT_CHROME_PATH'));
    $noSandbox = env('BROWSERSHOT_NO_SANDBOX', true);

    echo "✓ Node Path: $nodePath\n";
    echo "✓ Chrome Path: $chromePath\n";
    echo "✓ No Sandbox: " . ($noSandbox ? 'true' : 'false') . "\n\n";

    if (!empty($nodePath) && file_exists($nodePath)) {
        $browsershot->setNodeBinary($nodePath);
        echo "✓ تم تعيين Node binary\n";
    }
    
    if (!empty($chromePath) && file_exists($chromePath)) {
        $browsershot->setChromePath($chromePath);
        echo "✓ تم تعيين Chrome path\n";
    }
    
    if ($noSandbox) {
        $browsershot->noSandbox();
        $browsershot->addChromiumArguments([
            'disable-setuid-sandbox',
            'disable-dev-shm-usage',
            'disable-gpu',
            'disable-software-rasterizer',
            'disable-extensions',
            'no-first-run',
            'disable-dbus',
            'disable-background-networking',
        ]);
        echo "✓ تم تعيين Chrome arguments\n";
    }
    
    $browsershot->timeout(120)->setDelay(1000);
    echo "✓ تم تعيين timeout و delay\n\n";

    echo "🎨 توليد PDF...\n";
    $browsershot->save($fullPath);
    
    if (file_exists($fullPath)) {
        $fileSize = filesize($fullPath);
        echo "\n✅ نجح! تم إنشاء الشهادة\n";
        echo "   المسار: $fullPath\n";
        echo "   الحجم: " . number_format($fileSize / 1024, 2) . " KB\n";
        echo "   URL: " . Storage::disk('public')->url($fileName) . "\n";
    } else {
        echo "\n❌ فشل! الملف غير موجود\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ خطأ: " . $e->getMessage() . "\n\n";
    echo "Stack Trace:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
