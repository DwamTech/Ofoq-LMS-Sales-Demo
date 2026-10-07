<?php

/**
 * اختبار شامل لنظام توليد الشهادات
 * Certificate System Comprehensive Test
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🎓 اختبار نظام توليد الشهادات / Certificate System Test\n";
echo str_repeat("=", 80) . "\n\n";

$errors = [];
$warnings = [];
$success = [];

// ===================================
// 1. فحص متطلبات PHP
// ===================================
echo "📋 الخطوة 1: فحص متطلبات PHP\n";
echo str_repeat("-", 80) . "\n";

$requiredExtensions = ['gd', 'mbstring', 'pdo', 'pdo_mysql'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✓ PHP Extension: $ext\n";
        $success[] = "PHP Extension $ext loaded";
    } else {
        echo "❌ PHP Extension: $ext (مفقود / missing)\n";
        $errors[] = "PHP Extension $ext is missing";
    }
}

$requiredFunctions = ['exec', 'shell_exec', 'proc_open'];
foreach ($requiredFunctions as $func) {
    if (function_exists($func)) {
        echo "✓ PHP Function: $func\n";
        $success[] = "PHP Function $func available";
    } else {
        echo "❌ PHP Function: $func (معطل / disabled)\n";
        $errors[] = "PHP Function $func is disabled";
    }
}

echo "\n";

// ===================================
// 2. فحص إعدادات .env
// ===================================
echo "⚙️ الخطوة 2: فحص إعدادات .env\n";
echo str_repeat("-", 80) . "\n";

$envChecks = [
    'BROWSERSHOT_NODE_PATH' => env('BROWSERSHOT_NODE_PATH'),
    'BROWSERSHOT_CHROME_PATH' => env('BROWSERSHOT_CHROME_PATH'),
    'BROWSERSHOT_NO_SANDBOX' => env('BROWSERSHOT_NO_SANDBOX'),
    'QUEUE_CONNECTION' => env('QUEUE_CONNECTION'),
    'MAIL_MAILER' => env('MAIL_MAILER'),
    'MAIL_HOST' => env('MAIL_HOST'),
    'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS'),
];

foreach ($envChecks as $key => $value) {
    if (!empty($value)) {
        echo "✓ $key = $value\n";
        $success[] = "$key is configured";
    } else {
        echo "⚠️  $key = (غير محدد / not set)\n";
        $warnings[] = "$key is not configured";
    }
}

echo "\n";

// ===================================
// 3. فحص Node.js و Chrome
// ===================================
echo "🔧 الخطوة 3: فحص Node.js و Chrome\n";
echo str_repeat("-", 80) . "\n";

$nodePath = env('BROWSERSHOT_NODE_PATH', '/usr/bin/node');
if (file_exists($nodePath) && is_executable($nodePath)) {
    echo "✓ Node.js موجود في: $nodePath\n";
    $nodeVersion = shell_exec("$nodePath --version 2>&1");
    echo "  الإصدار: " . trim($nodeVersion) . "\n";
    $success[] = "Node.js is available";
} else {
    echo "❌ Node.js غير موجود في: $nodePath\n";
    $errors[] = "Node.js not found at $nodePath";
}

$chromePath = env('BROWSERSHOT_CHROME_PATH', '/usr/bin/google-chrome');
if (file_exists($chromePath) && is_executable($chromePath)) {
    echo "✓ Chrome موجود في: $chromePath\n";
    $chromeVersion = shell_exec("$chromePath --version 2>&1");
    echo "  الإصدار: " . trim($chromeVersion) . "\n";
    $success[] = "Chrome is available";
} else {
    echo "❌ Chrome غير موجود في: $chromePath\n";
    
    // محاولة البحث عن Chrome في مسارات أخرى
    echo "  🔍 البحث عن Chrome في مسارات أخرى...\n";
    $possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
    ];
    
    $found = false;
    foreach ($possiblePaths as $path) {
        if (file_exists($path) && is_executable($path)) {
            echo "  ✓ وجدت Chrome في: $path\n";
            echo "  💡 أضف هذا السطر إلى .env:\n";
            echo "     BROWSERSHOT_CHROME_PATH=$path\n";
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        $errors[] = "Chrome not found. Install with: sudo apt install google-chrome-stable";
    }
}

echo "\n";

// ===================================
// 4. فحص المجلدات والصلاحيات
// ===================================
echo "📁 الخطوة 4: فحص المجلدات والصلاحيات\n";
echo str_repeat("-", 80) . "\n";

$directories = [
    'storage/app/public/certificates' => 'مجلد الشهادات',
    'storage/logs' => 'مجلد السجلات',
    'storage/framework/cache' => 'مجلد الكاش',
];

foreach ($directories as $dir => $description) {
    $fullPath = base_path($dir);
    if (is_dir($fullPath)) {
        if (is_writable($fullPath)) {
            echo "✓ $description: $dir (قابل للكتابة)\n";
            $success[] = "$description is writable";
        } else {
            echo "⚠️  $description: $dir (غير قابل للكتابة / not writable)\n";
            $warnings[] = "$description is not writable. Run: chmod -R 775 $fullPath";
        }
    } else {
        echo "❌ $description: $dir (غير موجود / not found)\n";
        $errors[] = "$description not found. Run: mkdir -p $fullPath && chmod 775 $fullPath";
    }
}

// فحص الرابط الرمزي
$publicLink = public_path('storage');
if (is_link($publicLink)) {
    echo "✓ الرابط الرمزي: public/storage موجود\n";
    $success[] = "Storage link exists";
} else {
    echo "⚠️  الرابط الرمزي: public/storage غير موجود\n";
    echo "  💡 قم بتشغيل: php artisan storage:link\n";
    $warnings[] = "Storage link missing. Run: php artisan storage:link";
}

echo "\n";

// ===================================
// 5. فحص قاعدة البيانات والجداول
// ===================================
echo "🗄️ الخطوة 5: فحص قاعدة البيانات\n";
echo str_repeat("-", 80) . "\n";

try {
    $dbConnection = DB::connection()->getPdo();
    echo "✓ الاتصال بقاعدة البيانات ناجح\n";
    $success[] = "Database connection successful";
    
    // فحص الجداول المطلوبة
    $tables = ['course_certificates', 'diploma_certificates', 'jobs'];
    foreach ($tables as $table) {
        $exists = DB::select("SHOW TABLES LIKE '$table'");
        if (!empty($exists)) {
            echo "✓ الجدول: $table موجود\n";
            $success[] = "Table $table exists";
        } else {
            echo "❌ الجدول: $table غير موجود\n";
            $errors[] = "Table $table is missing. Run migrations.";
        }
    }
} catch (Exception $e) {
    echo "❌ فشل الاتصال بقاعدة البيانات: " . $e->getMessage() . "\n";
    $errors[] = "Database connection failed: " . $e->getMessage();
}

echo "\n";

// ===================================
// 6. فحص Queue Worker
// ===================================
echo "⚡ الخطوة 6: فحص Queue Worker\n";
echo str_repeat("-", 80) . "\n";

$queueConnection = env('QUEUE_CONNECTION');
echo "Queue Connection: $queueConnection\n";

if ($queueConnection === 'database') {
    try {
        $pendingJobs = DB::table('jobs')->count();
        echo "✓ عدد المهام المعلقة: $pendingJobs\n";
        
        if ($pendingJobs > 0) {
            echo "⚠️  يوجد مهام معلقة. تأكد من تشغيل queue worker:\n";
            echo "  php artisan queue:work\n";
            $warnings[] = "$pendingJobs pending jobs. Run queue worker.";
        } else {
            $success[] = "No pending jobs";
        }
    } catch (Exception $e) {
        echo "❌ فشل فحص جدول المهام: " . $e->getMessage() . "\n";
        $errors[] = "Jobs table check failed";
    }
} else {
    echo "⚠️  Queue connection is not 'database'. Current: $queueConnection\n";
    $warnings[] = "Queue connection is $queueConnection (expected: database)";
}

echo "\n";

// ===================================
// 7. اختبار Browsershot
// ===================================
echo "🧪 الخطوة 7: اختبار Browsershot\n";
echo str_repeat("-", 80) . "\n";

try {
    $testHtml = '<html><body><h1 style="font-family: Arial;">Test Certificate</h1></body></html>';
    $testPath = storage_path('app/test_certificate.pdf');
    
    echo "محاولة إنشاء PDF تجريبي...\n";
    
    $browsershot = \Spatie\Browsershot\Browsershot::html($testHtml)
        ->showBackground()
        ->format('A4');
    
    // تطبيق الإعدادات من .env
    $nodePath = env('BROWSERSHOT_NODE_PATH');
    $chromePath = env('BROWSERSHOT_CHROME_PATH');
    $noSandbox = env('BROWSERSHOT_NO_SANDBOX', true);
    
    if ($nodePath && file_exists($nodePath)) {
        $browsershot->setNodeBinary($nodePath);
    }
    if ($chromePath && file_exists($chromePath)) {
        $browsershot->setChromePath($chromePath);
    }
    if ($noSandbox) {
        $browsershot->noSandbox();
    }
    
    $browsershot->save($testPath);
    
    if (file_exists($testPath)) {
        $fileSize = filesize($testPath);
        echo "✓ تم إنشاء PDF تجريبي بنجاح!\n";
        echo "  المسار: $testPath\n";
        echo "  الحجم: " . number_format($fileSize / 1024, 2) . " KB\n";
        $success[] = "Browsershot test successful";
        
        // حذف الملف التجريبي
        unlink($testPath);
        echo "  تم حذف الملف التجريبي\n";
    } else {
        echo "❌ فشل إنشاء PDF\n";
        $errors[] = "Browsershot failed to create PDF";
    }
} catch (Exception $e) {
    echo "❌ خطأ في اختبار Browsershot: " . $e->getMessage() . "\n";
    $errors[] = "Browsershot test failed: " . $e->getMessage();
}

echo "\n";

// ===================================
// النتيجة النهائية
// ===================================
echo str_repeat("=", 80) . "\n";
echo "📊 النتيجة النهائية / Final Results\n";
echo str_repeat("=", 80) . "\n\n";

echo "✅ نجح: " . count($success) . " فحص\n";
echo "⚠️  تحذيرات: " . count($warnings) . " تحذير\n";
echo "❌ أخطاء: " . count($errors) . " خطأ\n\n";

if (count($errors) > 0) {
    echo "🔴 الأخطاء التي يجب إصلاحها:\n";
    foreach ($errors as $i => $error) {
        echo "  " . ($i + 1) . ". $error\n";
    }
    echo "\n";
}

if (count($warnings) > 0) {
    echo "🟡 التحذيرات (اختيارية ولكن موصى بها):\n";
    foreach ($warnings as $i => $warning) {
        echo "  " . ($i + 1) . ". $warning\n";
    }
    echo "\n";
}

if (count($errors) === 0) {
    echo "🎉 النظام جاهز لتوليد الشهادات!\n";
    echo "   System is ready to generate certificates!\n\n";
    echo "📝 الخطوات التالية:\n";
    echo "   1. تشغيل queue worker: php artisan queue:work\n";
    echo "   2. اختبار توليد شهادة: php artisan queue:work --once\n";
    echo "   3. مراقبة السجلات: tail -f storage/logs/laravel.log\n";
} else {
    echo "⚠️  يرجى إصلاح الأخطاء أعلاه قبل تشغيل نظام الشهادات\n";
    echo "   Please fix the errors above before running the certificate system\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
