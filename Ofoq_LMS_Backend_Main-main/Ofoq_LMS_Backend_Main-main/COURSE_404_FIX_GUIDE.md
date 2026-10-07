# دليل حل مشكلة 404 Not Found للكورسات

## 📋 وصف المشكلة

جميع الـ routes التي تبدأ بـ `/courses/{course}` ترجع خطأ 404 Not Found رغم وجود الكورسات في قاعدة البيانات بنفس الـ IDs.

### Routes المتأثرة:
- `GET /api/courses/{course}/final-exam/meta`
- `GET /api/courses/{course}/final-exam/attempt/active`
- `POST /api/courses/{course}/final-exam/start`
- `GET /api/courses/{courseId}/certificate`
- `GET /api/courses/{courseId}/progress`
- وجميع الـ routes الأخرى التي تستخدم `{course}` parameter

## 🔍 السبب الجذري

### 1. Global Scope في Course Model
في ملف `app/Models/Course.php`، يوجد Global Scope يفلتر الكورسات تلقائياً:

```php
protected static function booted()
{
    static::addGlobalScope('published', function (Builder $builder) {
        $request = request();
        if ($request && !str_starts_with($request->path(), 'api/admin')) {
            $builder->where('is_published', true);
        }
    });
}
```

هذا الـ scope يضيف شرط `WHERE is_published = true` لكل الـ queries **ما عدا** routes الـ admin.

### 2. Route Model Binding
في `app/Providers/RouteServiceProvider.php`:

```php
Route::bind('course', function ($value) {
    if (request()->is('api/admin/*')) {
        return \App\Models\Course::withoutGlobalScopes()->findOrFail($value);
    }
    return \App\Models\Course::findOrFail($value);
});
```

الـ binding يستخدم `findOrFail()` الذي يطبق الـ Global Scope، فإذا كان `is_published = false`، لن يجد الكورس.

### 3. قيمة is_published الافتراضية
الـ migration يضيف الـ column بقيمة افتراضية `false`:

```php
$table->boolean('is_published')->default(false);
```

## ✅ الحل

### الخيار 1: تحديث قاعدة البيانات مباشرة (الأسرع)

#### باستخدام SQL:
```sql
-- تحديث جميع الكورسات لتكون منشورة
UPDATE courses 
SET is_published = true 
WHERE is_published = false OR is_published IS NULL;

-- التحقق من النتيجة
SELECT COUNT(*) as total, 
       SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published
FROM courses;
```

#### باستخدام phpMyAdmin:
1. افتح phpMyAdmin على سيرفر البروداكشن
2. اختر قاعدة البيانات `ofuq_db`
3. افتح جدول `courses`
4. اذهب إلى تبويب SQL
5. نفذ الـ query أعلاه

### الخيار 2: استخدام Laravel Migration (الأكثر أماناً)

```bash
# على سيرفر البروداكشن
cd /path/to/Ofoq_Backend
php artisan migrate
```

الـ migration الجديد `2026_03_04_000000_publish_all_existing_courses.php` سيقوم بتحديث جميع الكورسات تلقائياً.

### الخيار 3: استخدام Artisan Command (الأكثر تفاعلية)

```bash
# معاينة التغييرات بدون تطبيقها
php artisan courses:publish-all --dry-run

# تطبيق التغييرات مع تأكيد
php artisan courses:publish-all

# تطبيق التغييرات بدون تأكيد
php artisan courses:publish-all --force
```

## 🧪 التحقق من الحل

### 1. فحص قاعدة البيانات:
```sql
SELECT id, title, is_published 
FROM courses 
WHERE is_published = false OR is_published IS NULL;
```

يجب أن تكون النتيجة فارغة (0 rows).

### 2. اختبار الـ API:
```bash
# اختبر route معين (استبدل {course_id} بـ ID حقيقي)
curl -X GET "https://api.ofuq.academy/api/courses/1/final-exam/meta" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

يجب أن ترجع بيانات الامتحان النهائي بدلاً من 404.

### 3. اختبار من Frontend:
- جرب الدخول على صفحة كورس
- جرب الدخول على صفحة الامتحان النهائي
- تأكد من ظهور البيانات بشكل صحيح

## 📝 ملاحظات مهمة

### للمستقبل:
1. **عند إنشاء كورس جديد**: تأكد من تعيين `is_published = true` إذا كنت تريد أن يكون متاحاً للطلاب
2. **في Admin Panel**: أضف خيار لنشر/إلغاء نشر الكورسات
3. **في الـ Seeder**: تأكد من تعيين `is_published = true` للكورسات التجريبية

### الكورسات غير المنشورة:
- الكورسات التي `is_published = false` لن تظهر في:
  - قائمة الكورسات العامة
  - نتائج البحث
  - الصفحة الرئيسية
- لكن يمكن للـ Admin الوصول إليها من خلال routes الـ admin

## 🔧 الملفات المُنشأة

1. **fix_unpublished_courses.sql** - SQL queries للتنفيذ المباشر
2. **database/migrations/2026_03_04_000000_publish_all_existing_courses.php** - Laravel migration
3. **app/Console/Commands/PublishAllCourses.php** - Artisan command تفاعلي

## 📞 الدعم

إذا استمرت المشكلة بعد تطبيق الحل:
1. تحقق من الـ logs: `storage/logs/laravel.log`
2. تحقق من قيمة `is_published` في قاعدة البيانات
3. تحقق من الـ cache: `php artisan cache:clear`
4. تحقق من الـ route cache: `php artisan route:clear`

## ✨ الخلاصة

المشكلة كانت بسيطة: الكورسات غير منشورة (`is_published = false`)، والـ Global Scope يفلترها تلقائياً، مما يسبب 404 عند محاولة الوصول إليها.

الحل: تحديث جميع الكورسات لتكون `is_published = true`.
