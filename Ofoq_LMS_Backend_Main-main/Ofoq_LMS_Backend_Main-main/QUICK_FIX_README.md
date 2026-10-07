# حل سريع لمشكلة 404 Not Found

## 🚀 الطرق المتاحة للحل

### 1️⃣ الطريقة الأسرع: SQL مباشر (دقيقة واحدة)

**على phpMyAdmin:**
```sql
UPDATE courses SET is_published = true WHERE is_published = false OR is_published IS NULL;
```

---

### 2️⃣ الطريقة الآمنة: Laravel Migration (دقيقتان)

```bash
cd /path/to/Ofoq_Backend
php artisan migrate
```

---

### 3️⃣ الطريقة التفاعلية: PHP Script (3 دقائق)

```bash
cd /path/to/Ofoq_Backend
php publish_all_courses.php
```

سيعرض لك قائمة بالكورسات ويطلب تأكيد قبل التحديث.

---

### 4️⃣ الطريقة المتقدمة: Artisan Command (3 دقائق)

```bash
# معاينة فقط
php artisan courses:publish-all --dry-run

# تنفيذ مع تأكيد
php artisan courses:publish-all

# تنفيذ بدون تأكيد
php artisan courses:publish-all --force
```

---

## ✅ التحقق من الحل

```bash
# اختبر route معين
curl -X GET "https://api.ofuq.academy/api/courses/1/final-exam/meta" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

يجب أن ترجع بيانات بدلاً من 404.

---

## 📁 الملفات المُنشأة

| الملف | الوصف | الاستخدام |
|------|-------|----------|
| `fix_unpublished_courses.sql` | SQL queries | نسخ ولصق في phpMyAdmin |
| `publish_all_courses.php` | PHP script | `php publish_all_courses.php` |
| `database/migrations/2026_03_04_000000_publish_all_existing_courses.php` | Migration | `php artisan migrate` |
| `app/Console/Commands/PublishAllCourses.php` | Artisan command | `php artisan courses:publish-all` |
| `COURSE_404_FIX_GUIDE.md` | دليل شامل | للقراءة والفهم |

---

## 🎯 التوصية

**للسيرفر البروداكشن:** استخدم الطريقة 1 (SQL مباشر) أو الطريقة 2 (Migration)

**للتطوير المحلي:** استخدم أي طريقة تفضلها

---

## 💡 ملاحظة مهمة

بعد تطبيق الحل، قد تحتاج إلى:
```bash
php artisan cache:clear
php artisan route:clear
php artisan config:clear
```
