# Course Routes Testing Scripts

هذه الـ scripts تختبر جميع الـ routes المتعلقة بالكورسات للتأكد من أن مشكلة 404 Not Found تم حلها.

## الملفات المتاحة:

1. **test_course_routes.sh** - Bash script (للينكس/ماك)
2. **test_course_routes.php** - PHP script (يعمل على أي نظام)

---

## طريقة الاستخدام:

### الطريقة 1: استخدام PHP Script (موصى به)

```bash
cd /www/wwwroot/ofuq/back
php test_course_routes.php
```

### الطريقة 2: استخدام Bash Script

```bash
cd /www/wwwroot/ofuq/back
chmod +x test_course_routes.sh
./test_course_routes.sh
```

---

## ما يقوم به الـ Script:

### 1. Authentication (المصادقة)
- يسجل دخول باستخدام:
  - Email: `admin@ofuq.academy`
  - Password: `admin123`
- يحصل على الـ authentication token

### 2. Public Course Routes (Routes العامة)
- ✅ `GET /api/course/{id}` - عرض كورس واحد
- ✅ `GET /api/allCourses` - عرض جميع الكورسات
- ✅ `GET /api/courses/featured` - عرض الكورسات المميزة
- ✅ `GET /api/courses/{id}/reviews` - عرض تقييمات الكورس

### 3. Authenticated Course Routes (Routes تحتاج تسجيل دخول)
- ✅ `GET /api/courseEnroll/{id}` - عرض الكورس للتسجيل
- ✅ `POST /api/courses/{id}/enroll` - التسجيل في الكورس
- ✅ `GET /api/courses/{id}/progress` - عرض تقدم الطالب
- ✅ `GET /api/my-enrollments` - عرض تسجيلاتي

### 4. Final Exam Routes (routes الامتحان النهائي)
- ✅ `GET /api/courses/{id}/final-exam/meta` - معلومات الامتحان
- ✅ `GET /api/courses/{id}/final-exam/attempt/active` - المحاولة النشطة
- ✅ `GET /api/my-tests` - امتحاناتي

### 5. Certificate Routes (routes الشهادات)
- ✅ `GET /api/courses/{id}/certificate-status` - حالة الشهادة
- ✅ `GET /api/courses/{id}/certificate/data` - بيانات الشهادة
- ✅ `GET /api/my-certificates` - شهاداتي

### 6. Review Routes (routes التقييمات)
- ✅ `POST /api/courses/{id}/reviews` - إضافة تقييم

### 7. Admin Course Routes (routes الإدارة)
- ✅ `GET /api/admin/courses` - جميع الكورسات (admin)
- ✅ `GET /api/admin/course/{id}` - كورس واحد (admin)
- ✅ `GET /api/admin/courses/{id}` - تفاصيل الكورس (admin)
- ✅ `GET /api/admin/courses-details` - تفاصيل الكورسات (admin)
- ✅ `GET /api/admin/courses-not-published` - الكورسات غير المنشورة

### 8. Admin Chapter Routes (routes الفصول)
- ✅ `POST /api/admin/courses/{id}/chapters` - إضافة فصل جديد

---

## قراءة النتائج:

### ✅ نجاح (Success)
```
✅ Status: 200 - Success
```
يعني الـ route يعمل بشكل صحيح

### ❌ فشل (Not Found)
```
❌ Status: 404 - Not Found
```
يعني الـ route لا يعمل - **المشكلة الأصلية لم تُحل**

### ⚠️ تحذير (Warning)
```
⚠️ Status: 422 - Validation Error
```
يعني الـ route يعمل لكن البيانات المرسلة غير صحيحة (هذا طبيعي في الاختبار)

---

## ملاحظات مهمة:

1. **بعض الـ routes قد تفشل بسبب منطق العمل:**
   - مثلاً: "already enrolled" إذا كان المستخدم مسجل بالفعل
   - أو: "no certificate available" إذا لم يكمل الكورس

2. **404 Not Found على course routes يعني:**
   - المشكلة الأصلية لم تُحل
   - الكورسات غير منشورة
   - أو مشكلة في الـ Route Model Binding

3. **الـ Script يستخدم Course ID = 3:**
   - يمكنك تغييره في بداية الملف إذا أردت

---

## تخصيص الإعدادات:

### في PHP Script:
```php
// في بداية الملف test_course_routes.php
$baseUrl = 'https://back.ofuq.academy';  // غير الـ URL
$adminEmail = 'admin@ofuq.academy';      // غير الإيميل
$adminPassword = 'admin123';              // غير الباسورد
$courseId = 3;                            // غير الـ Course ID
```

### في Bash Script:
```bash
# في بداية الملف test_course_routes.sh
BASE_URL="https://back.ofuq.academy"
ADMIN_EMAIL="admin@ofuq.academy"
ADMIN_PASSWORD="admin123"
COURSE_ID=3
```

---

## حفظ النتائج في ملف:

### PHP:
```bash
php test_course_routes.php > test_results.txt 2>&1
```

### Bash:
```bash
./test_course_routes.sh > test_results.txt 2>&1
```

ثم اعرض النتائج:
```bash
cat test_results.txt
```

---

## استكشاف الأخطاء:

### إذا فشل Login:
- تأكد من صحة الإيميل والباسورد
- تأكد من أن المستخدم موجود في قاعدة البيانات
- تأكد من أن الـ role = admin

### إذا ظهرت أخطاء SSL:
- الـ scripts تتجاهل أخطاء SSL للاختبار
- في البروداكشن، تأكد من صحة الـ SSL certificate

### إذا ظهرت 404 على جميع الـ routes:
- تأكد من صحة الـ BASE_URL
- تأكد من أن الـ Laravel application يعمل
- تأكد من إعدادات nginx

---

## مثال على النتيجة المتوقعة:

```
============================================================
Course Routes Testing Script
============================================================
Base URL: https://back.ofuq.academy
Admin Email: admin@ofuq.academy
Test Course ID: 3

============================================================
Step 1: Authentication
============================================================
ℹ️  Logging in as admin...
✅ Login successful!
✅ Token obtained: eyJ0eXAiOiJKV1QiLCJ...

============================================================
Step 2: Testing Public Course Routes
============================================================

ℹ️  Testing: Get single course (public)
Route: GET /api/course/3
✅ Status: 200 - Success
Response preview: {"success":true,"message":"Course retrieved...

ℹ️  Testing: Get all courses (public)
Route: GET /api/allCourses
✅ Status: 200 - Success
Response preview: {"data":[{"id":3,"title":"التخطيط...

...
```

---

## الخلاصة:

إذا رأيت ✅ على معظم الـ routes، فالمشكلة محلولة! 🎉

إذا رأيت ❌ 404 على course routes، فالمشكلة ما زالت موجودة.
