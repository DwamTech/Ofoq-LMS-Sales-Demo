# إصلاح مشكلة توليد الشهادات (Certificate Generation Fix)

## المشكلة الأصلية
كان الـ Job الخاص بتوليد شهادات الدبلومة (`GenerateDiplomaCertificateJob`) يسبب:
- **Memory Exhaustion** - استنزاف الذاكرة
- **Queue Worker Crash** - توقف عامل الطابور
- **Log File Bloat** - ملف laravel.log يصل لجيجابايتات في ثواني

### السبب
كان الكود بيعمل Log لمصفوفة `$certificateData` كاملة، والمصفوفة دي بتحتوي على:
- `qrCodeBase64` - صورة QR بصيغة Base64 (آلاف الحروف)
- `backgroundImageBase64` - صورة الخلفية بصيغة Base64 (ملايين الحروف)
- `fontRegularBase64` و `fontBoldBase64` - ملفات الخطوط بصيغة Base64

لارافيل كان بياخد النصوص دي كلها ويكتبها في اللوج مع كل محاولة، مما يسبب امتلاء الذاكرة وتوقف السيرفر.

## الحلول المطبقة

### 1. تنظيف اللوج (Log Cleanup)
✅ تم تصفية البيانات المسجلة في اللوج لتشمل فقط:
- اسم الطالب
- اسم الدبلومة/الكورس
- الرقم التسلسلي (Serial Number)
- رمز التحقق (Verification Token)
- عدد المقررات/الساعات

**الكود القديم:**
```php
Log::info('Certificate data prepared', $certificateData);
```

**الكود الجديد:**
```php
$logData = [
    'student_name' => $certificateData['student_name'],
    'diploma_name' => $certificateData['diploma_name'],
    'serial_number' => $certificateData['serial_number'],
    'verification_token' => $certificateData['verification_token'],
    'total_courses' => $certificateData['total_courses'],
];
Log::info('Certificate data prepared', $logData);
```

### 2. توضيح الأخطاء (Error Logging Enhancement)
✅ تم تحسين الـ catch block لتسجيل تفاصيل الأخطاء:
```php
catch (\Exception $e) {
    $this->diplomaCertificate->update(['status' => 'failed']);
    
    Log::error('Diploma Certificate Generation Failed: ' . $e->getMessage(), [
        'diploma_certificate_id' => $this->diplomaCertificate->id,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ]);
}
```

### 3. إصلاح مسارات Browsershot (Chrome/Chromium Path Detection)
✅ تم إضافة نظام auto-detection للمسارات الشائعة:
```php
$possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
];

foreach ($possiblePaths as $path) {
    if (file_exists($path) && is_executable($path)) {
        $chromePath = $path;
        Log::info('Auto-detected Chrome path', ['path' => $chromePath]);
        break;
    }
}
```

### 4. إضافة متغيرات البيئة (Environment Variables)
✅ تم إضافة المتغيرات التالية في `.env`:
```env
# Browsershot Configuration for Linux Production Server
BROWSERSHOT_NODE_PATH_LINUX=/usr/bin/node
BROWSERSHOT_CHROME_PATH_LINUX=/usr/bin/google-chrome-stable
BROWSERSHOT_NO_SANDBOX=true

# Browsershot Configuration for Windows Development
BROWSERSHOT_NODE_PATH_WINDOWS=C:\Program Files\nodejs\node.exe
BROWSERSHOT_CHROME_PATH_WINDOWS=C:\Program Files\Google\Chrome\Application\chrome.exe
```

## الملفات المعدلة
1. `app/Jobs/GenerateDiplomaCertificateJob.php`
2. `app/Jobs/GenerateCertificateJob.php`
3. `.env`

## التحقق من الإصلاح
بعد تطبيق التعديلات:
1. ✅ اللوج نظيف ومش فيه Base64
2. ✅ الأخطاء بتظهر بوضوح مع التفاصيل الكاملة
3. ✅ الكود بيكتشف مسار Chrome/Chromium تلقائياً
4. ✅ الشهادات بتتحفظ في `storage/app/public/certificates/`

## خطوات ما بعد التطبيق
1. إعادة تشغيل Queue Worker:
   ```bash
   php artisan queue:restart
   ```

2. مراقبة اللوج للتأكد من نجاح التوليد:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. التحقق من وجود Chrome/Chromium على السيرفر:
   ```bash
   which google-chrome-stable
   which chromium-browser
   ```

## ملاحظات مهمة
- إذا استمرت مشكلة Chromium، تأكد من تثبيت الحزم المطلوبة:
  ```bash
  sudo apt-get install -y chromium-browser xdg-utils
  ```
- تأكد من صلاحيات المجلدات:
  ```bash
  chmod -R 775 storage/app/public/certificates
  ```
