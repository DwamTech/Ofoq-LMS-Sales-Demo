# دليل تطبيق نظام النسخ الاحتياطي (Backup System Implementation Guide)

هذا الدليل يلخص خطوات بناء نظام النسخ الاحتياطي كما هو مطبق في مشروع Ofoq LMS، لسهولة نقله وتطبيقه في مشاريع أخرى.

## 1. الحزم المثبتة (Installed Packages)
تم تثبيت الحزم التالية في `composer.json`:

- `spatie/laravel-backup`: الحزمة الأساسية لإدارة النسخ الاحتياطي.
- `league/flysystem-aws-s3-v3`: لدعم التخزين السحابي على Amazon S3 (أو أي خدمة متوافقة مثل DigitalOcean Spaces).

```bash
composer require spatie/laravel-backup
composer require league/flysystem-aws-s3-v3 "^3.0"
```

## 2. إعدادات النسخ الاحتياطي (`config/backup.php`)
يحتوي هذا الملف على كافة إعدادات النسخ الاحتياطي:

### أ. المصدر (Source)
- **الملفات:** يقوم النظام بنسخ المشروع بالكامل (`base_path()`) ومجلد التخزين العام (`storage_path('app/public')`)، ويستثني المجلدات الكبيرة وغير الضرورية (`vendor`, `node_modules`, `storage`).
- **قواعد البيانات:** يقوم بنسخ قاعدة البيانات الافتراضية (`mysql`) تلقائيًا.

### ب. الوجهة (Destination)
- حالياً، تم ضبطه للتخزين على القرص المحلي (`local`) في المسار `storage/app/private/ofuq-platform`.
- لاستخدام S3، فقط أضف `'s3'` إلى مصفوفة `'disks'` في ملف `config/backup.php` وتأكد من تعبئة متغيرات `AWS_*` في ملف `.env`.

## 3. الجدولة التلقائية (`routes/console.php`)
النظام معد للعمل تلقائيًا يوميًا بالأوقات التالية:

- **01:00 صباحًا** (`backup:clean`): يقوم بحذف النسخ الاحتياطية القديمة للحفاظ على مساحة التخزين.
- **02:00 صباحًا** (`backup:run`): يقوم بإنشاء نسخة احتياطية جديدة (قاعدة البيانات + الملفات).
- **03:00 صباحًا** (`backup:monitor`): يتحقق من صحة النسخ الاحتياطي ويرسل تنبيهًا في حال وجود مشكلة.

```php
Schedule::command('backup:clean')->daily()->at('01:00');
Schedule::command('backup:run')->daily()->at('02:00');
Schedule::command('backup:monitor')->daily()->at('03:00');
```

## 4. إعدادات قاعدة البيانات (`config/database.php`)
لضمان عمل `mysqldump` بشكل صحيح في بيئة Windows/XAMPP:

```php
'mysql' => [
    // ...
    'dump' => [
        'dump_binary_path' => env('DB_DUMP_PATH', ''),
        'use_single_transaction' => true,
        'timeout' => 60 * 5,
    ],
],
```

## 5. اختبار النظام

### أ. الاختبار اليدوي
لتشغيل نسخة احتياطية فورية (للملفات فقط لتسريع العملية):
```bash
php artisan backup:run --only-files --disable-notifications
```

### ب. التحقق من الصور
تم التأكد من أن النظام يشمل مجلد `storage/app/public` (حيث تخزن صور المستخدمين) عن طريق إنشاء ملف اختبار `backup_verification_test.txt` والتحقق من وجوده داخل ملف النسخة الاحتياطية المضغوط (ZIP).
