# إصلاح مشكلة Chromium Snap (Chromium Snap Permission Fix)

## المشكلة
عند محاولة توليد الشهادات، Chromium بيفشل مع الأخطاء التالية:
```
xdg-settings: command not found
cannot start document portal: dial unix /run/user/0/bus: connect: permission denied
/user.slice/user-0.slice/session-19448.scope is not a snap cgroup for tag snap.chromium.chromium
```

## السبب
Chromium مثبت كـ snap package على السيرفر، والـ snap بيحتاج:
1. صلاحيات خاصة للوصول للـ D-Bus
2. متغيرات بيئة محددة
3. arguments إضافية لتجاوز قيود الـ sandbox

## الحل المطبق

### 1. إضافة Chromium Arguments
تم إضافة arguments إضافية لتجاوز مشاكل الـ snap:

```php
$browsershot->addChromiumArguments([
    'disable-setuid-sandbox',      // تعطيل setuid sandbox
    'disable-dev-shm-usage',       // استخدام /tmp بدل /dev/shm
    'disable-gpu',                 // تعطيل GPU acceleration
    'disable-software-rasterizer', // تعطيل software rasterizer
    'disable-extensions',          // تعطيل الإضافات
    'disable-web-security',        // تعطيل web security (آمن للـ PDF)
    'no-first-run',               // تخطي first run setup
    'no-zygote',                  // تعطيل zygote process
    'single-process',             // استخدام process واحد فقط
]);
```

### 2. إضافة Environment Variables
تم إضافة متغيرات بيئة للـ snap:

```php
$browsershot->setEnvironmentOptions([
    'SNAP_NAME' => 'chromium',
    'SNAP_INSTANCE_NAME' => 'chromium',
]);
```

### 3. تحديث .env
```env
# Chromium Snap Environment Variables (to suppress warnings)
SNAP_NAME=chromium
SNAP_INSTANCE_NAME=chromium
```

## الملفات المعدلة
1. ✅ `app/Jobs/GenerateDiplomaCertificateJob.php`
2. ✅ `app/Jobs/GenerateCertificateJob.php`
3. ✅ `.env`

## الاختبار

### 1. تصفير الشهادة
```bash
cd Ofoq_Backend
php reset_certificate.php
```

### 2. تشغيل Queue
```bash
php artisan queue:work --once
```

### 3. مراقبة اللوج
```bash
tail -f storage/logs/laravel.log
```

## ما تتوقعه

### عند النجاح:
```
[INFO] Starting diploma certificate generation
[INFO] Browsershot configuration {"chrome_path":"/usr/bin/chromium-browser"}
[INFO] PDF generated successfully
[INFO] Database update result {"update_success":true}
[INFO] Diploma Certificate generated successfully {"verified_status":"completed"}
```

### الملف المتولد:
```bash
ls -lh storage/app/public/certificates/diplomas/
# يجب أن يظهر ملف PDF بحجم > 100KB
```

## حلول بديلة (إذا استمرت المشكلة)

### الحل 1: تثبيت xdg-utils
```bash
sudo apt-get update
sudo apt-get install -y xdg-utils
```

### الحل 2: استخدام Google Chrome بدل Chromium
```bash
# تثبيت Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f

# تحديث .env
BROWSERSHOT_CHROME_PATH_LINUX=/usr/bin/google-chrome-stable
```

### الحل 3: تشغيل Queue Worker كـ non-root user
```bash
# إنشاء user جديد
sudo useradd -m -s /bin/bash chromium-user

# تغيير صلاحيات المجلدات
sudo chown -R chromium-user:chromium-user storage/
sudo chown -R chromium-user:chromium-user bootstrap/cache/

# تشغيل Queue كـ chromium-user
sudo -u chromium-user php artisan queue:work
```

## ملاحظات مهمة
- الـ `single-process` argument بيخلي Chromium يشتغل في process واحد، ده بيحل مشاكل الصلاحيات بس ممكن يبطئ الأداء شوية
- الـ `disable-web-security` آمن لأننا بنولد PDF من HTML محلي مش بنفتح مواقع خارجية
- لو السيرفر بيشتغل كـ root، ممكن تحتاج تضيف `--no-sandbox` في الـ command line مباشرة

## التحقق من التثبيت الصحيح
```bash
# فحص Chromium
which chromium-browser
chromium-browser --version

# فحص الصلاحيات
ls -l /usr/bin/chromium-browser

# اختبار Chromium يدوياً
chromium-browser --headless --disable-gpu --dump-dom https://www.google.com
```
