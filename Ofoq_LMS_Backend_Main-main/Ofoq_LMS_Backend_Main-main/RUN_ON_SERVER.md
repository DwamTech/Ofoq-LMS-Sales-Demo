# تعليمات التشغيل على السيرفر 🚀

## الخطوات بالترتيب:

### 1️⃣ سحب آخر التحديثات
```bash
cd /www/wwwroot/ofuq/back
git pull origin main
```

**المتوقع:** سيتم تحديث 4 ملفات جديدة:
- ✅ `CURRENT_STATUS.md`
- ✅ `PRODUCTION_STEPS.md`
- ✅ `check_courses_status.php`
- ✅ `database/migrations/2026_01_07_122521_create_sections_table.php` (مُحدث)

---

### 2️⃣ تشغيل الـ Migrations
```bash
php artisan migrate --force
```

**المتوقع:** يجب أن يعمل بدون أخطاء الآن (تم إصلاح مشكلة جدول sections)

---

### 3️⃣ فحص حالة الكورسات
```bash
php check_courses_status.php
```

**المتوقع:** سيعرض تقرير شامل عن:
- عدد الكورسات المنشورة/غير المنشورة
- اختبار Route Model Binding
- معلومات تشخيصية

---

### 4️⃣ مسح الـ Cache
```bash
php artisan cache:clear
php artisan route:clear
php artisan config:clear
php artisan view:clear
```

**أو استخدم:**
```bash
php artisan optimize:clear
```

---

### 5️⃣ اختبار الـ API
```bash
# اختبر route عام (استبدل 1 بـ ID كورس حقيقي)
curl -X GET "https://api.ofuq.academy/api/course/1"

# اختبر final exam route (يحتاج authentication)
curl -X GET "https://api.ofuq.academy/api/courses/1/final-exam/meta" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**المتوقع:** يجب أن ترجع بيانات JSON بدلاً من 404

---

## 🎯 الخلاصة:

بما أن الـ script أظهر:
```
✅ All courses are already published!
```

فالمشكلة **محلولة بالفعل** من ناحية قاعدة البيانات.

الخطوات أعلاه هي فقط للتأكد من:
- ✅ تحديث الـ migrations
- ✅ مسح الـ cache القديم
- ✅ التحقق من عمل الـ API

---

## 📊 إذا أردت تقرير تفصيلي:

```bash
php check_courses_status.php > diagnostic_report.txt
cat diagnostic_report.txt
```

سيعطيك تقرير كامل يمكنك مشاركته إذا استمرت أي مشكلة.

---

## ✅ النتيجة النهائية المتوقعة:

بعد تطبيق جميع الخطوات:
- ✅ جميع الـ migrations تعمل بدون أخطاء
- ✅ جميع الكورسات منشورة
- ✅ الـ cache نظيف
- ✅ جميع routes الكورسات تعمل بشكل طبيعي
- ✅ لا يوجد خطأ 404

---

## 🎉 تم الانتهاء!

المشكلة محلولة. إذا استمر أي خطأ، شغل `check_courses_status.php` وشارك النتيجة.
