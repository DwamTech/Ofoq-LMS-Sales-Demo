# 🎓 نظام توليد الشهادات - دليل الاستخدام الكامل

---

## 📋 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [التثبيت والإعداد](#التثبيت-والإعداد)
3. [التشغيل اليومي](#التشغيل-اليومي)
4. [المراقبة والصيانة](#المراقبة-والصيانة)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)
6. [الأوامر المتاحة](#الأوامر-المتاحة)

---

## 🎯 نظرة عامة

نظام توليد الشهادات يعمل تلقائياً عند:
- ✅ إكمال الطالب لكورس بنجاح (اجتياز الامتحان النهائي)
- ✅ إكمال الطالب لدبلومة بنجاح (إكمال جميع الكورسات)

**الميزات**:
- توليد تلقائي في الخلفية (لا يؤثر على أداء الموقع)
- إعادة محاولة تلقائية للشهادات الفاشلة
- مراقبة مستمرة كل 30 دقيقة
- تسجيل مفصل لجميع العمليات
- دعم كامل للغة العربية

---

## 🚀 التثبيت والإعداد

### المتطلبات
- ✅ PHP 8.0+ مع extensions: gd, mbstring, pdo
- ✅ Node.js (أي إصدار حديث)
- ✅ Google Chrome أو Chromium
- ✅ Supervisor (للتشغيل الدائم)

### خطوات التثبيت

#### 1. التحقق من المتطلبات
```bash
cd /www/wwwroot/ofuq/back
php test_certificate_system.php
```

#### 2. إعداد Supervisor (تشغيل دائم)
```bash
chmod +x setup_supervisor.sh
./setup_supervisor.sh
```

#### 3. إعداد Cron (للمراقبة التلقائية)
```bash
crontab -e
# أضف هذا السطر:
* * * * * cd /www/wwwroot/ofuq/back && php artisan schedule:run >> /dev/null 2>&1
```

#### 4. التحقق من التشغيل
```bash
# التحقق من Supervisor
sudo supervisorctl status ofuq-queue-worker:*

# التحقق من المهام
php artisan certificates:monitor
```

---

## 💼 التشغيل اليومي

### توليد تلقائي

النظام يعمل تلقائياً! لا تحتاج فعل أي شيء.

عند إكمال طالب لكورس:
1. النظام ينشئ سجل شهادة بحالة `pending`
2. Queue Worker يلتقط المهمة
3. يتم توليد PDF تلقائياً
4. يتم حفظ الشهادة في `storage/app/public/certificates/`
5. تتحول الحالة إلى `completed`

### توليد يدوي (للاختبار)

```bash
# توليد شهادة لطالب معين
php artisan tinker

>>> $user = App\Models\User::find(1);
>>> $course = App\Models\Course::find(1);
>>> $cert = App\Models\CourseCertificate::create([
    'user_id' => $user->id,
    'course_id' => $course->id,
    'status' => 'pending',
    'verification_token' => Str::uuid(),
    'serial_number' => 'TEST-' . Str::random(6)
]);
>>> App\Jobs\GenerateCertificateJob::dispatch($cert);
>>> exit

# معالجة المهمة
php artisan queue:work --once
```

---

## 🔍 المراقبة والصيانة

### المراقبة اليومية

```bash
# عرض حالة الشهادات
php artisan certificates:monitor

# عرض حالة Queue Workers
sudo supervisorctl status ofuq-queue-worker:*

# عرض المهام المعلقة
php artisan tinker --execute="echo 'Pending jobs: ' . DB::table('jobs')->count();"
```

### الصيانة الأسبوعية

```bash
# 1. التحقق من السجلات
tail -100 storage/logs/laravel.log | grep -i certificate

# 2. التحقق من مساحة التخزين
du -sh storage/app/public/certificates/

# 3. التحقق من الشهادات الفاشلة
php artisan certificates:monitor

# 4. إعادة تشغيل Queue Workers (إذا لزم الأمر)
sudo supervisorctl restart ofuq-queue-worker:*
```

### الصيانة الشهرية

```bash
# 1. تنظيف السجلات القديمة
find storage/logs/ -name "*.log" -mtime +30 -delete

# 2. التحقق من تحديثات النظام
php test_certificate_system.php

# 3. نسخ احتياطي للشهادات
tar -czf certificates_backup_$(date +%Y%m%d).tar.gz storage/app/public/certificates/
```

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: الشهادات لا تتولد

**التشخيص**:
```bash
# تحقق من Queue Workers
sudo supervisorctl status ofuq-queue-worker:*

# تحقق من المهام المعلقة
php artisan tinker --execute="echo DB::table('jobs')->count();"

# تحقق من السجلات
tail -50 storage/logs/laravel.log
```

**الحل**:
```bash
# إعادة تشغيل Queue Workers
sudo supervisorctl restart ofuq-queue-worker:*

# أو تشغيل يدوي
php artisan queue:work --stop-when-empty
```

### المشكلة 2: شهادات فاشلة

**التشخيص**:
```bash
php artisan certificates:monitor
```

**الحل**:
```bash
# إعادة محاولة تلقائية
php artisan certificates:monitor --retry

# أو يدوياً
php retry_failed_certificates.php
php artisan queue:work --stop-when-empty
```

### المشكلة 3: Chrome يفشل

**التشخيص**:
```bash
# اختبار Chrome يدوياً
/usr/bin/google-chrome --version
/usr/bin/google-chrome --headless --disable-gpu --print-to-pdf=/tmp/test.pdf --no-sandbox https://google.com

# اختبار Browsershot
php test_single_certificate.php
```

**الحل**:
```bash
# تحديث Chrome
sudo apt update
sudo apt upgrade google-chrome-stable

# إعادة اختبار
php test_certificate_system.php
```

### المشكلة 4: نقص الذاكرة

**التشخيص**:
```bash
# تحقق من استخدام الذاكرة
free -h

# تحقق من عمليات Chrome
ps aux | grep chrome
```

**الحل**:
```bash
# تقليل عدد Workers في ofuq-queue-worker.conf
# غير numprocs من 2 إلى 1
sudo nano /etc/supervisor/conf.d/ofuq-queue-worker.conf
# numprocs=1

# إعادة تحميل Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart ofuq-queue-worker:*
```

---

## 📚 الأوامر المتاحة

### أوامر Artisan

```bash
# مراقبة الشهادات
php artisan certificates:monitor

# إعادة محاولة الشهادات الفاشلة
php artisan certificates:monitor --retry

# إعادة محاولة تلقائية (يعمل من Cron)
php artisan certificates:auto-retry

# معالجة مهمة واحدة
php artisan queue:work --once

# معالجة جميع المهام
php artisan queue:work --stop-when-empty

# تشغيل دائم
php artisan queue:work

# عرض المهام الفاشلة
php artisan queue:failed

# إعادة محاولة مهمة فاشلة
php artisan queue:retry <job-id>

# إعادة محاولة جميع المهام الفاشلة
php artisan queue:retry all
```

### سكريبتات PHP

```bash
# اختبار شامل للنظام
php test_certificate_system.php

# اختبار توليد شهادة واحدة
php test_single_certificate.php

# إعادة محاولة الشهادات الفاشلة
php retry_failed_certificates.php
```

### أوامر Supervisor

```bash
# عرض الحالة
sudo supervisorctl status ofuq-queue-worker:*

# تشغيل
sudo supervisorctl start ofuq-queue-worker:*

# إيقاف
sudo supervisorctl stop ofuq-queue-worker:*

# إعادة تشغيل
sudo supervisorctl restart ofuq-queue-worker:*

# عرض السجلات
sudo supervisorctl tail ofuq-queue-worker:*

# عرض السجلات المباشرة
sudo supervisorctl tail -f ofuq-queue-worker:*
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. **راجع السجلات**:
   ```bash
   tail -100 storage/logs/laravel.log | grep -i certificate
   ```

2. **شغل الاختبار الشامل**:
   ```bash
   php test_certificate_system.php
   ```

3. **تحقق من حالة النظام**:
   ```bash
   php artisan certificates:monitor
   ```

4. **راجع ملف الحل النهائي**:
   ```bash
   cat CERTIFICATE_FINAL_SOLUTION.md
   ```

---

## 🎉 ملخص سريع

```bash
# للتشغيل الأول
./setup_supervisor.sh

# للمراقبة اليومية
php artisan certificates:monitor

# لإعادة محاولة الفاشلة
php artisan certificates:monitor --retry

# لعرض السجلات
tail -f storage/logs/laravel.log | grep -i certificate
```

---

**تم الإعداد بواسطة**: Kiro AI Assistant  
**التاريخ**: 2026-03-07  
**الحالة**: ✅ جاهز للإنتاج
