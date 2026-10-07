# إعداد نظام شهادات الدبلومات للإدارة

## نظرة عامة
تم إعداد نظام إدارة شهادات الدبلومات للإدارة ليعمل مع الباك ايند الخارجي Laravel الموجود في `http://localhost:8000/api`.

## ما تم إنجازه

### 1. حذف ملفات API الداخلية
- ✅ تم حذف جميع ملفات API الداخلية التي تم إنشاؤها سابقًا
- ✅ تم التأكد من أن جميع الطلبات تذهب إلى الباك ايند الخارجي

### 2. تحديث خدمة شهادات الدبلومات
- ✅ تم تحديث `adminDiplomaCertificatesService.ts` للعمل مع الباك ايند الخارجي
- ✅ تم تحديث جميع نقاط النهاية:
  - `GET /admin/diplomas/{id}/eligible-students`
  - `GET /admin/diplomas/{id}/certificates`
  - `POST /admin/diplomas/{id}/issue-certificates`

### 3. تحديث صفحة الإدارة
- ✅ تم تحديث `page.tsx` في `/admin/diplomas/[id]/certificates`
- ✅ تم إضافة معالجة للمصادقة
- ✅ تم تحسين عرض الأخطاء
- ✅ تم إضافة روابط لصفحات الاختبار

### 4. إعدادات المصادقة
- ✅ تم إنشاء صفحة `/test-auth` لإدارة توكن المصادقة للتطوير
- ✅ تم إنشاء صفحة `/test-connection` لاختبار الاتصال بالباك ايند
- ✅ تم إنشاء صفحة `/test-login` لاختبار تسجيل الدخول

## نقاط النهاية المتوقعة من الباك ايند

### 1. جلب الطلاب المستحقين
```
GET /api/admin/diplomas/{diplomaId}/eligible-students
Headers:
  Authorization: Bearer {token}
  Accept: application/json

Response:
{
  "data": [
    {
      "id": 1,
      "name": "اسم الطالب",
      "email": "student@example.com",
      "progress_percentage": 100,
      "final_exam_score": 85,
      "completed_courses": 5,
      "total_courses": 5,
      "enrolled_at": "2024-01-15"
    }
  ]
}
```

### 2. جلب الشهادات الصادرة
```
GET /api/admin/diplomas/{diplomaId}/certificates
Headers:
  Authorization: Bearer {token}
  Accept: application/json

Response:
{
  "data": [
    {
      "id": 1,
      "uuid": "cert-uuid-123",
      "student_name": "اسم الطالب",
      "student_email": "student@example.com",
      "serial_number": "CERT-2024-001",
      "issued_at": "2024-02-01",
      "file_url": "/certificates/cert-uuid-123.pdf",
      "diploma_name": "اسم الدبلوم"
    }
  ]
}
```

### 3. إصدار شهادة جديدة
```
POST /api/admin/diplomas/{diplomaId}/issue-certificates
Headers:
  Authorization: Bearer {token}
  Accept: application/json
  Content-Type: application/json

Body:
{
  "user_id": 1
}

Response:
{
  "success": true,
  "message": "تم إصدار الشهادة بنجاح",
  "certificate": {
    "id": 1,
    "uuid": "cert-uuid-123",
    "student_name": "اسم الطالب",
    "serial_number": "CERT-2024-001",
    "issued_at": "2024-02-01",
    "file_path": "/certificates/cert-uuid-123.pdf",
    "diploma_name": "اسم الدبلوم"
  }
}
```

## خطوات الاختبار

### 1. اختبار المصادقة
1. انتقل إلى `http://localhost:3000/test-auth`
2. أدخل توكن المصادقة الخاص بك من Laravel
3. اضغط على "حفظ التوكن"
4. اضغط على "اختبار الاتصال" للتأكد من أن الباك ايند يستجيب

### 2. اختبار صفحة الشهادات
1. انتقل إلى `http://localhost:3000/admin/diplomas/2/certificates`
2. يجب أن ترى قائمة الطلاب المستحقين والشهادات الصادرة
3. يمكنك إصدار شهادات جديدة للطلاب المستحقين

## ملاحظات مهمة

### معالجة الأخطاء
- ✅ تم إضافة معالجة للأخطاء غير المتوقعة
- ✅ تم إضافة رسائل خطأ واضحة للمستخدم
- ✅ تم إضافة زر لإعادة المحاولة في حالة الفشل

### المصادقة
- ✅ يتم التحقق من وجود توكن المصادقة قبل إرسال الطلبات
- ✅ يتم إضافة رأس Authorization تلقائيًا إلى جميع الطلبات
- ✅ تم إضافة صفحة خاصة لإدارة التوكن للتطوير

## المشكلات المحتملة والحلول

### 1. خطأ "Unauthenticated"
**السبب**: التوكن غير صالح أو منتهي الصلاحية
**الحل**: استخدم صفحة `/test-auth` لتحديث التوكن

### 2. خطأ في الاتصال بالباك ايند
**السبب**: الباك ايند لا يستجيب أو عنوان URL غير صحيح
**الحل**: تأكد من أن `NEXT_PUBLIC_API_URL` في ملف `.env.local` يشير إلى العنوان الصحيح

### 3. خطأ في بنية البيانات
**السبب**: الباك ايند يرسل بيانات بصيغة مختلفة عن المتوقع
**الحل**: تحقق من صيغة الاستجابة في وحدة التحكم وحدث الكود حسب الحاجة

## الخطوات التالية

1. **تأكد من أن الباك ايند Laravel يحتوي على جميع نقاط النهاية المطلوبة**
2. **اختبر المصادقة مع بيانات تسجيل الدخول الحقيقية**
3. **تحقق من أن جميع نقاط النهاية تعمل بشكل صحيح**
4. **حدث واجهة المستخدم حسب الحاجة بناءً على الاختبارات**