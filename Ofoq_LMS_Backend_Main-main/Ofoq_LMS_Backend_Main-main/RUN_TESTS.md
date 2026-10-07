# تشغيل اختبارات الـ Routes 🧪

## الخطوات السريعة:

### 1️⃣ سحب التحديثات
```bash
cd /www/wwwroot/ofuq/back
git pull origin main
```

### 2️⃣ تشغيل الاختبار
```bash
php test_course_routes.php
```

---

## النتيجة المتوقعة:

إذا كانت المشكلة **محلولة**، ستشاهد:
```
✅ Status: 200 - Success
✅ Status: 200 - Success
✅ Status: 200 - Success
...
```

إذا كانت المشكلة **ما زالت موجودة**، ستشاهد:
```
❌ Status: 404 - Not Found
❌ Status: 404 - Not Found
...
```

---

## حفظ النتائج:

```bash
php test_course_routes.php > test_results.txt 2>&1
cat test_results.txt
```

---

## ملاحظة:

الـ script يختبر **جميع** الـ routes المتعلقة بالكورسات:
- Public routes
- Authenticated routes  
- Admin routes
- Final exam routes
- Certificate routes
- Review routes

إذا نجحت معظم الاختبارات، فالمشكلة محلولة! 🎉
