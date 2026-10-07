# دليل إعداد نظام الشهادات - منصة أفق
## Certificate System Setup Guide - Ofuq Platform

---

## 📋 المحتويات

1. [مراجعة ملف .env الحالي](#مراجعة-ملف-env-الحالي)
2. [الإعدادات المطلوبة](#الإعدادات-المطلوبة)
3. [خطوات التثبيت](#خطوات-التثبيت)
4. [الاختبار](#الاختبار)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## ✅ مراجعة ملف .env الحالي

### الإعدادات الموجودة والصحيحة:

```env
# ✓ إعدادات Browsershot الأساسية
BROWSERSHOT_NODE_PATH=/usr/bin/node
BROWSERSHOT_CHROME_PATH=/usr/bin/google-chrome
BROWSERSHOT_NO_SANDBOX=true

# ✓ إعدادات قاعدة البيانات
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=ofuq_db
DB_USERNAME=ofuq_user
DB_PASSWORD=wZtf8bCs524WpF3r

# ✓ إعدادات Queue
QUEUE_CONNECTION=database

# ✓ إعدادات التطبيق
APP_NAME="Ofoq LMS"
APP_ENV=production
APP_URL=https://back.ofuq.academy
FRONTEND_URL=https://ofuq.academy
```

---

## ⚠️ الإعدادات المطلوبة (يجب إضافتها)

### 1. إعدادات Browsershot المحددة لنظام Linux

أضف هذه الأسطر إلى ملف `.env`:

```env
# إعدادات Browsershot المحددة لـ Linux (أفضل من الإعدادات العامة)
BROWSERSHOT_NODE_PATH_LINUX=/usr/bin/node
BROWSERSHOT_CHROME_PATH_LINUX=/usr/bin/google-chrome

# إعدادات إضافية للأداء
BROWSERSHOT_TIMEOUT=60
BROWSERSHOT_DELAY=0
```

### 2. إعدادات البريد الإلكتروني (مطلوبة لإرسال الشهادات)

**مهم جداً**: يجب تكوين البريد الإلكتروني لإرسال الشهادات للطلاب

#### خيار 1: استخدام Gmail

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@ofuq.academy
MAIL_FROM_NAME="${APP_NAME}"
```

**ملاحظة**: لاستخدام Gmail، يجب:
1. تفعيل "التحقق بخطوتين" في حساب Gmail
2. إنشاء "كلمة مرور التطبيق" (App Password)
3. استخدام كلمة مرور التطبيق في `MAIL_PASSWORD`

#### خيار 2: استخدام خدمة بريد أخرى

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@ofuq.academy
MAIL_FROM_NAME="${APP_NAME}"
```

### 3. إعدادات التخزين

```env
FILESYSTEM_DISK=public
```

---

## 🔧 خطوات التثبيت

### الخطوة 1: تحديث ملف .env

```bash
cd /www/wwwroot/ofuq/back
nano .env
```

أضف الإعدادات المطلوبة أعلاه، ثم احفظ الملف (Ctrl+O ثم Enter ثم Ctrl+X).

### الخطوة 2: التحقق من تثبيت المتطلبات

```bash
# التحقق من Node.js
node --version

# التحقق من Chrome
google-chrome --version

# إذا لم يكن Chrome مثبتاً، قم بتثبيته:
# sudo apt update
# sudo apt install google-chrome-stable
```

### الخطوة 3: إنشاء المجلدات المطلوبة

```bash
# إنشاء مجلد الشهادات
mkdir -p storage/app/public/certificates

# تعيين الصلاحيات
chmod -R 775 storage
chown -R www-data:www-data storage

# إنشاء الرابط الرمزي
php artisan storage:link
```

### الخطوة 4: تشغيل الترحيلات (Migrations)

```bash
# التأكد من وجود جداول الشهادات
php artisan migrate
```

### الخطوة 5: مسح الكاش

```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

---

## 🧪 الاختبار

### اختبار شامل للنظام

```bash
cd /www/wwwroot/ofuq/back
php test_certificate_system.php
```

هذا السكريبت سيفحص:
- ✓ متطلبات PHP
- ✓ إعدادات .env
- ✓ Node.js و Chrome
- ✓ المجلدات والصلاحيات
- ✓ قاعدة البيانات
- ✓ Queue Worker
- ✓ Browsershot (اختبار إنشاء PDF)

### اختبار توليد شهادة واحدة

```bash
# معالجة مهمة واحدة من قائمة الانتظار
php artisan queue:work --once
```

### تشغيل Queue Worker بشكل دائم

```bash
# في نافذة terminal منفصلة
php artisan queue:work

# أو استخدام supervisor (موصى به للإنتاج)
```

### مراقبة السجلات

```bash
# مراقبة سجلات Laravel
tail -f storage/logs/laravel.log

# البحث عن سجلات الشهادات
grep -i "certificate" storage/logs/laravel.log | tail -20
```

---

## 🔍 استكشاف الأخطاء

### المشكلة 1: "Chrome not found"

**الحل**:
```bash
# البحث عن Chrome في النظام
which google-chrome
which chromium-browser

# إذا وجدت المسار، أضفه إلى .env:
# BROWSERSHOT_CHROME_PATH=/path/to/chrome
```

### المشكلة 2: "Permission denied"

**الحل**:
```bash
# تعيين الصلاحيات الصحيحة
chmod -R 775 storage
chown -R www-data:www-data storage
```

### المشكلة 3: "Failed to generate PDF"

**الحل**:
```bash
# تحقق من السجلات
tail -50 storage/logs/laravel.log

# تحقق من إعدادات Browsershot
php artisan tinker
>>> env('BROWSERSHOT_NODE_PATH')
>>> env('BROWSERSHOT_CHROME_PATH')
>>> env('BROWSERSHOT_NO_SANDBOX')
```

### المشكلة 4: "Queue jobs not processing"

**الحل**:
```bash
# تحقق من جدول المهام
php artisan tinker
>>> DB::table('jobs')->count()

# تشغيل queue worker
php artisan queue:work

# إعادة محاولة المهام الفاشلة
php artisan queue:retry all
```

### المشكلة 5: "Mail not sending"

**الحل**:
```bash
# اختبار إعدادات البريد
php artisan tinker
>>> Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); })

# تحقق من السجلات
grep -i "mail" storage/logs/laravel.log | tail -20
```

---

## 📝 أوامر مفيدة

### عرض المهام المعلقة

```bash
php artisan queue:work --once --verbose
```

### عرض المهام الفاشلة

```bash
php artisan queue:failed
```

### إعادة محاولة مهمة فاشلة

```bash
php artisan queue:retry <job-id>
```

### حذف جميع المهام الفاشلة

```bash
php artisan queue:flush
```

### إنشاء شهادة يدوياً (للاختبار)

```bash
php artisan tinker

# للكورس
>>> $user = App\Models\User::find(1);
>>> $course = App\Models\Course::find(1);
>>> $userCourse = App\Models\UserCourse::where('user_id', $user->id)->where('course_id', $course->id)->first();
>>> $cert = App\Models\CourseCertificate::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'pending', 'verification_token' => Str::uuid(), 'serial_number' => 'TEST-'.Str::random(6)]);
>>> App\Jobs\GenerateCertificateJob::dispatch($cert);

# للدبلومة
>>> $category = App\Models\Category::find(1);
>>> $enrollment = App\Models\UserCategoryEnrollment::where('user_id', $user->id)->where('category_id', $category->id)->first();
>>> $cert = App\Models\DiplomaCertificate::create(['user_id' => $user->id, 'category_id' => $category->id, 'status' => 'pending', 'verification_token' => Str::uuid(), 'serial_number' => 'DIP-'.Str::random(6)]);
>>> App\Jobs\GenerateDiplomaCertificateJob::dispatch($cert);
```

---

## ✅ قائمة التحقق النهائية

قبل تشغيل النظام في الإنتاج، تأكد من:

- [ ] تم تحديث ملف .env بجميع الإعدادات المطلوبة
- [ ] Node.js مثبت ويعمل
- [ ] Chrome/Chromium مثبت ويعمل
- [ ] المجلدات المطلوبة موجودة وقابلة للكتابة
- [ ] الرابط الرمزي storage تم إنشاؤه
- [ ] إعدادات البريد الإلكتروني صحيحة ومختبرة
- [ ] Queue Worker يعمل
- [ ] اختبار Browsershot نجح
- [ ] تم اختبار توليد شهادة واحدة بنجاح

---

## 🎉 جاهز للتشغيل!

بعد إكمال جميع الخطوات أعلاه، النظام جاهز لتوليد الشهادات تلقائياً عند:
1. إكمال الطالب لكورس بنجاح
2. إكمال الطالب لدبلومة بنجاح

الشهادات سيتم:
- ✓ توليدها تلقائياً في الخلفية
- ✓ حفظها في `storage/app/public/certificates`
- ✓ إرسالها بالبريد الإلكتروني للطالب
- ✓ إتاحتها للتحميل من لوحة التحكم

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع السجلات: `storage/logs/laravel.log`
2. شغل سكريبت الاختبار: `php test_certificate_system.php`
3. تحقق من المهام الفاشلة: `php artisan queue:failed`

---

**آخر تحديث**: 2026-03-06
**الإصدار**: 1.0
