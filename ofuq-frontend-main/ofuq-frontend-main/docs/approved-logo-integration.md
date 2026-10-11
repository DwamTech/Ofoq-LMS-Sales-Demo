# منصتك التعليمية — تركيب الشعار المصوّر المعتمد

التاريخ: 2026-10-11. النطاق: اعتماد نسخة PNG v2، مواءمة ألوانها مع الثيم الحالي، وتركيبها في مكوّن الهوية المركزي. لا إعادة تصميم للصفحات ولا تعديلات Laravel أو بيانات أو قواعد دخول/شهادات.

## الأصل والألوان

- الأصل: `../../brand-concepts/raster-logo-review/mansatak-reference-extracted-v2.png`.
- النسخة المنشورة المطابقة بايتًا: `public/brand/mansatak-approved.png`، RGBA، 1958×803، حجم 631202 بايت.
- SHA-256 لكليهما: `523A2C70A1AFD4C00F28BB6350D4887AAB67C3DCCCEA21874373781EAE644C27`.
- الكتابة: الحبر البنفسجي `#29233B`؛ الثيم البنفسجي الهادئ `#635080`؛ السطح العاجي `#F6F4ED`؛ العلامة والأزرار الليمونية `#D8EF73`. احتفظ الرمز بتدرجاته البنفسجية المعتمدة على الفاتح؛ النسخة العكسية عاجية/ليمونية على الداكن.
- التباين المحسوب لألوان صلبة: حبر/عاجي **13.65:1**، بنفسجي/عاجي **6.38:1**، حبر/ليموني **11.81:1**. ليست هذه دعوى أن كل بكسل داخل التدرج يحقق تباين نص؛ الرمز زخرفي والكتابة مصمتة.
- لم تتغير خطوط واجهة الموقع. لا تعتمد حروف الشعار على خط الجهاز؛ هي من الصورة التي اعتمدها المستخدم. الملف مصوّر وليس SVG.

## تطبيق الهوية

`BrandLogo` يدعم primary / compact / icon وauto / light / dark / mono. أقنعة alpha تغيّر لون الكتابة والعلامة فقط، والنسخة الداكنة تعكس جسم الرمز إلى الأبيض. لا إعادة كتابة عربية ولا تتبع تلقائي ولا صورة مضمنة في SVG. نسب العرض ثابتة؛ القص الأفقي (78,64,1825,700)، وقص الرمز (1202,64,700,700). الصورة الأصلية واحدة، مخبأة في المتصفح، وتحمّل eagerly لحماية العرض الأول.

استُبدل الرمز القديم داخل المقدمة الحركية ورسم الإدارة الفرعي أيضًا. ظهور الشعار ينتقل تلقائيًا للهيدر والفوتر والدخول والشهادات واللوحات عبر المكوّن المركزي. لم يُضف شعار جديد لشريط الطالب المحمول الذي كان نصيًا أصلًا، وحُفظ تخطيطه. على الإدارة استُخدمت النسخة العكسية في السايدبار والرسم الداكن. أُزيلت بقايا التركواز من أزرار Brand Foundation وحالات التركيز فقط.

## الأصول الحالية

داخل `public/brand/`:

- `mansatak-approved.png` — أصل PNG المعتمد دون تغيير.
- `mansatak-approved-horizontal-{light,dark,mono}.png` — 1825×700، شفافة.
- `mansatak-approved-icon-{light,dark,mono}.png` — 700×700، شفافة.
- `mansatak-favicon-{16,24,32,48,64}.png` — رمز عكسي واضح على مربع الحبر.
- `mansatak-app-{192,512}.png`، `mansatak-maskable-512.png`، `mansatak-apple-touch.png`، `mansatak-social.png`، `mansatak-og.png`.

حدّثنا `public/favicon.png` و`public/favicon.ico` (إطارات PNG حقيقية 16/32/48). وحُفظت مسارات التوافق بصور الشعار الحالي: `public/logo.png`، `public/mahad_alofk2.png`، `public/images/ofuq-logo.png`، `assets/mahad_alofk2.png`، `assets/favicon.ico`، `assets/tab_icon.png`.

الأصول SVG السابقة ومصادر إعادة البناء محفوظة كأصول قديمة غير مستخدمة في المكوّن الحالي؛ لا تدّعي هذه المرحلة حذفها من القرص. لم تعد metadata تشير إلى favicon.svg ولا manifest إلى رمز SVG القديم. لا تشغّل مولد المتجهات القديم لتركيب هذه النسخة؛ استخدم `node scripts/export-approved-logo.mjs`.

## التحقق الفعلي

| الفحص | قبل | بعد |
|---|---:|---:|
| TypeScript كامل | 80 خطأ | 80 خطأ |
| ESLint كامل | 467 خطأ / 56 تحذير | 467 خطأ / 56 تحذير |
| Jest كامل | 98 PASS / 2 FAIL | 101 PASS / 2 FAIL |
| BrandLogo فقط | 6 PASS | 9 PASS |

ESLint للملفات العشرة المعنية بالشعار/التطبيق دون أخطاء أو تحذيرات. الفشل القديم لا يُعد نجاحًا كاملًا، ولم تُعدّل ميزات legacy لإخفائه.

بناء الإنتاج **PASS**. الإعداد السابق في `next.config.js` يستخدم `typescript.ignoreBuildErrors: true` و`eslint.ignoreDuringBuilds: true`؛ بقي كما هو. لذلك قورنت الفحوص المستقلة أعلاه بدل اعتبار نجاح البناء نجاحًا للفحصين.

- اختبار المسارات والأصول في الإنتاج: **22 PASS / 0 FAIL**؛ منها `/brand-lab` 404 بحماية السيرفر الموجودة، المسارات العامة وauth وتجربة الدخول، metadata وmanifest وأبعاد PNG وإطارات ICO.
- اختبار Chrome الفعلي في الإنتاج: **33 PASS / 0 FAIL**؛ 1440 / 768 / 390 / 360px، RTL، الأسماء البديلة، تحميل الأصل المعتمد، عدم overflow، القوائم، الدخول الحقيقي والانتقال بين الطالب والإدارة والخروج، وعدم أخطاء runtime/hydration. تقليل الحركة مفعّل في المعاينة.
- ملفات شهادتي الطالب السابقة تطابق SHA-256 للنسخ المرجعية وتُنزّل PDF؛ لم يُغيّر محتواها أو معرفاتها التاريخية.
- نتائج تدقيق 38 جدولًا تعليميًا قبل وبعد مطابقة. لم تُشغّل seeders أو migrations.
- تمت مراجعة المعاينة المصغّرة 16/24/32/48/64 من تصدير متصفح فعلي؛ لا صور مولّدة تدّعي أنها screenshots.

## المعاينات والأدلة

داخل `artifacts/mansatak-approved/`:

- `logo-theme-comparison.png` — مقارنة الفاتح/الداكن/الأحادي والمقاسات الصغيرة.
- `homepage-{1440,768,390,360}.png` — صفحات كاملة؛ ونسخ `-viewport.png` لقطة الشاشة الأولى.
- `header-logo-closeup.png`، `footer.png`، `mobile-navigation.png`.
- `experience-gateway.png`، `student-desktop.png`، `student-mobile.png`، `student-mobile-menu.png`، `student-certificates.png`.
- `admin-desktop.png`، `admin-mobile.png`، `login.png`، `login-mobile.png`.
- `baseline.json`، `final.json`، سجلات TypeScript/Jest/ESLint، `build-result.json`، `build.log`، `browser-results.json`، `smoke-results.json`، `domain-before-after.json`، `contrast.json`.

## الملفات المصدرية المعدّلة في هذه المهمة

```text
lib/brand.ts
components/brand/BrandLogo.tsx
components/brand/BrandLogo.module.css
components/brand/BrandLogo.test.tsx
components/brand/BrandMark.tsx
components/brand/BrandSystem.module.css
components/experience/HorizonIntro.tsx
components/experience/Experience.module.css
components/admin/showcase/AdminWorkspace.tsx
components/admin/showcase/AdminPrimitives.tsx
components/admin/showcase/AdminShowcase.module.css
app/layout.tsx
app/manifest.ts
app/brand-lab/page.tsx
scripts/approved-logo-checks.mjs
scripts/export-approved-logo.mjs
scripts/approved-logo-qa.mjs
scripts/approved-logo-production.mjs
docs/approved-logo-integration.md
../../brand-concepts/raster-logo-review/README.md
```

الأصول الثنائية والسجلات مذكورة في الأقسام السابقة. توجد تعديلات سابقة كثيرة في مساحة العمل؛ ليست جميعها نتيجة هذه المهمة.

## الحدود

هذه نسخة raster معتمدة، لا أصل متجهي صالح للتكبير غير المحدود. آثار دقيقة من المعالجة السابقة قد تظهر عند التكبير الشديد؛ لم نعد توليد الحروف. الأقنعة تتطلب متصفحًا حديثًا؛ Chrome المحلي تحقق منها، ولم ننفذ اختبار Safari/Firefox. الإصدار الداكن عكسي وليس إعادة تصميم لشعار جديد. سجلات وشهادات OFOQ التاريخية محفوظة للتوافق والتحقق.

التجربة المحلية: `http://127.0.0.1:3004/`؛ البوابة: `/experience`. تشغيل آمن: `node scripts/run-demo-gateway.mjs --database ofoq_demo` بعد البناء؛ مفتاح البوابة مؤقت في بيئة العملية فقط. لا نشر خارجي.
