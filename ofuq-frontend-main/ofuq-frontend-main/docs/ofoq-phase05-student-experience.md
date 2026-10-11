# أُفُق — المرحلة 05: تجربة الطالب المتصلة

## A. الملخص التنفيذي

الحالة النهائية: جاهزة للمراجعة البشرية للمرحلة 05، مع القيود المعلنة في Q. المتصفح: 87 PASS /0 FAIL، بما يشمل الرحلات A–H وحفظ PDF الفعلي. هذه ليست موافقة على جاهزية الإنتاج الكامل أو جودة محتوى الأسئلة النهائي.

نُفذت مساحة الطالب العربية بهوية أُفُق المعتمدة، متصلة بجلسة Sanctum الحقيقية وبالتسجيلات والتقدم والأسئلة والشهادات الموجودة. لم تُشغّل migrations أو seeders، ولم تُنشأ دورات أو محاولات أو شهادات. لا إعادة تصميم للإدارة أو الدفع أو الموقع التسويقي.

رابط الاختبار المحلي: http://127.0.0.1:3004/experience — اختيار الطالب ثم `/user`. الباك المحلي: http://127.0.0.1:8000. الإطلاق الآمن: `node scripts/run-demo-gateway.mjs --database ofoq_demo` من مجلد الفرونت؛ يفحص العزل قبل تشغيل جلسات العرض، ويحفظ توقيع الدخول في ذاكرة العمليات فقط. لا تُنشر هذه البوابة خارج الجهاز بهذه الإعدادات.

## B. اتجاه تجربة الطالب والهوية

عاجي دافئ، بنفسجي عميق، ليموني محدود، هندسة أصلية للبرامج، وإيقاع تحريري. الصفحة مساحة عمل تعليمية وليست لوحة إحصاءات إدارية. الخطوة التالية والتقييم المستقل والإنجاز الموثق أوضح من الأرقام المجردة. الخطوط محصورة داخل BrandScope للطالب؛ لا تغيير عالمي لخطوط الإدارة.

## C. تنظيم المعلومات

المساحة → الرحلة الحالية → متابعة التعلم → التقييم القادم → الدبلومات → المقررات → الإنجازات. التنقل يحفظ `/user/my_courses`، ويضيف منظور المقررات `?view=courses`، ويحفظ `/user/my_exams` و`/user/final-exam/[courseId]` و`/user/my-certificates` و`/watch` والإعدادات والمفضلة. سياق خاص للدبلومة `/user/diplomas/[slug]` وللمقرر `/user/courses/[courseId]`. روابط عامة منفصلة للبرنامج والمقرر والتحقق. قائمة هاتف مختصرة قابلة للفتح والإغلاق بـ Escape مع إعادة التركيز.

## D. البيانات الفعلية

الشخصية الاصطناعية: ليان أحمد الكيلاني، تُسترجع من `/profile` وتُؤكد بدور الطالب على الخادم، لا اعتماد على اسم/دور localStorage. دبلومتان، 8 تسجيلات مقررات، 78 سجل تقدم درس، 6 سجلات محاولات، شهادة مقرر واحدة وشهادة دبلومة واحدة. الهويات والعلاقات والمسارات تُشتق من API ولا توجد IDs ثابتة لسيناريو العرض في الواجهة.

## E. رحلة Python

الدبلومة العامة نفسها وعلاقاتها الأربعة. تقدم البرنامج من قواعد الباك 25%، وليس متوسط نسب الدروس. الأساسيات 6/12 درسًا =50%؛ المشاريع 0%؛ البرمجة الكائنية 100% واجتياز 83.33؛ قواعد البيانات 12/12 درسًا مع محاولة نهائية `in_progress` وبدون شهادة. عرض «اختبار قيد التقدم» لا «مقرر مُنجز» لقواعد البيانات.

## F. رحلة تطوير الويب

الدبلومة العامة نفسها، أربعة تسجيلات مقررات، تقدم برنامج 100% وفق خدمة الأهلية القائمة. شهادة الدبلومة الموجودة `OFOQ-D-0006` مرتبطة بالطالب والبرنامج. حالة التسجيل active مستقلة عن اكتمال متطلبات التعلم.

## G. التقدم والدروس

قراءة `/courseEnroll/{id}` و`/courses/{id}/progress` ثم `/lessons/{id}`. أُضيف `can_access` إلى LessonResource ليعرض قرار التفويض الموجود؛ `is_visible` وحده ليس قرار الوصول للطالب المسجل. الروابط متصلة بالفصل والمقرر الصحيحين. لا تجاوز لتفويض الفيديو. بيانات العرض الحالية لا تحتوي فيديو صالحًا؛ تُظهر صفحة التعلم محتوى الدرس ومساره وحالة غياب الفيديو بصدق.

اكتُشف أن GET القديم للتقدم يُعيد حساب الحالة ويحدّث timestamps، وأن GET للدرس ينشئ/يلمس سجلات تقدم. مُنع ذلك في DEMO_MODE فقط، مع إبقاء التدفق الطبيعي خارج العرض. عند غياب سجل مقرر مُعد مسبقًا تُعاد 409 واضحة بدل إنشاء سجل من GET.

شفافية مهمة: القراءة الاستكشافية الأولى وصلت إلى GET القديم قبل اكتشاف هذه الآثار؛ لذلك لا ندّعي أن المرحلة كلها خلت من آثار DB منذ البداية. لم نُصلح السجلات أو نُعد البذر لإخفاء ذلك. بعد الإصلاح، فُحصت بصمات جميع السجلات التعليمية للطالب قبل/بعد الرحلات وكانت متطابقة، بما فيها timestamps. تحديث رمز Sanctum/الكاش/السجلات التشغيلية مستثنى من بصمة التعلم، وهو متوقع عند الاستخدام.

## H. الامتحان النهائي

GET للمحاولة الموجودة فقط؛ ستة أسئلة وخياراتها الأصلية، ترقيم وروابط داخلية، خيارات غير قابلة للاختيار، إرسال معطل وشرح وضع القراءة. لا start/submit/update/score/issue. كان ActiveAttempt يعيد Question الخام متضمنًا `correct_answer`؛ استُبدل بمورد إيجابي لا يعيد سوى id/question/options، ويستبعد pivot والتفسيرات وأعلام الخيارات. QuestionResource العام يحافظ على مفاتيح الإجابة للإدارة المصرح لها فقط. منطق التصحيح والإصدار الطبيعي لم يُعد كتابته.

النصوص المخزنة للأسئلة عامة ومتكررة، وبعض الخيارات توحي لغويًا بالصواب؛ إخفاء المفاتيح التقنية لا يجعل المحتوى الحالي اختبارًا تربويًا غنيًا. لم نغيّر محتوى الأسئلة لأن تعديل بيانات العرض خارج النطاق.

## I. الشهادات الحقيقية

إحصاءات التنزيل المثبتة عبر HTTP ومحلل PDF:

| المستند | الاستجابة | النوع | البايتات | الصفحات |
| --- | --- | --- | --- | --- |
| البرمجة الكائنية — OFOQ-C-0006 | 200 | application/pdf | 42520 | 1 |
| تطوير الويب — OFOQ-D-0006 | 200 | application/pdf | 42979 | 1 |

الملفان موجودان؛ لا توليد عند النقر. حالة مولد المقرر الفعلية `completed` وليست فقط `issued`، لذا تُقبل الحالة القائمة الصحيحة مع فحص الملف. مسار GET الجديد `/api/student/certificates/{course|legacy-course|diploma}/{id}/download` مصادق، طالب فقط، ملكية السجل، حالة جاهزة، مسار داخل public disk بعد realpath، ملف مقروء وتوقيع PDF. أُضيف هذا المسار المحدد وحده إلى allowlist الطالب؛ ظل GET القديم الذي يولد شهادة ممنوعًا.

التحقق العام للرقمين عاد 200 وvalid=true وباسم ليان والبرنامج الصحيح؛ صفحة التحقق نفسها عُرضت في Chrome. نُزّلت النسخ عبر المتصفح أيضًا. لقطة بيانات الشهادة مُعنونة صراحة بأنها بيانات السجل، وليست معاينة PDF مزيفة. المعاينة الفعلية منفصلة في قارئ Chrome PDF.

ملاحظة تاريخية قائمة: API شهادة المقرر يسمي created_at «issued_at»، وهو أغسطس، بينما completion_date سبتمبر وPDF/التحقق يستعملان تاريخًا آخر من updated_at. الواجهة تُسميه «تاريخ إنشاء السجل»، ولا تختلق تاريخ إصدار موحدًا. يلزم توحيد العقد والبيانات بمهمة مستقلة مصرح بها. ملف PDF القديم ما زال بتصميم المرحلة 01 الأزرق، ولم يُعد توليده أو تزييف هويته في هذه المرحلة.

## J. الربط العام/الخاص

إصلاح تنزيل المتصفح: استجابة attachment التقليدية نجحت لدى عميل HTTP، لكن Chrome رفضها في fetch برسالة MissingAllowOriginHeader رغم نجاح preflight. أثبتت المقارنة أن إزالة Content-Disposition attachment من استجابة الباك وإرسال بايتات PDF نفسها بـ streamed response أعادت fetch200 وCORS الصحيح. اسم التنزيل attachment يتولاه رابط Blob في الواجهة. لا proxy جديد ولا تغيير في إعداد CORS أو صلاحياته. أُضيف فحص حفظ ملف PDF فعليًا في مجلد أدلة Chrome، وليس مجرد النقر أو نجاح HTTP مباشر. Cache-Control مثبت no-store, private؛ لا caching عام للمسار المصادق.

رابط دبلومة الطالب يستعمل slug نفسه؛ البرنامج العام يعرض «شاهد المقررات» بناءً على `/my-diplomas` المصادق، لا علم demo. المقرر العام المرتبط يعمل. بعد الخروج ظل البرنامج العام قابلًا للقراءة دون ادعاء التسجيل. لم يُغيّر التسعير أو checkout أو واجهات التسويق.

## K. المصادقة والتفويض

حُفظت SessionGuard وAuthGuard وقيود Phase04. StudentProvider يفحص `/profile` ودور الطالب قبل قراءة أي بيانات خاصة. تحقق إعادة تحميل الجلسة، الدخول المباشر دون رمز، الرمز غير الصالح، الخروج وإبطال الرمز، إعادة الدخول، رجوع المتصفح، والتحول إلى admin مع إبطال رمز الطالب وعدم تركيب مساحة الطالب. تزوير الدور المحلي لا يخول admin الدخول لمساحة الطالب. انتهاء الصلاحية مثبت باختبار Laravel المعزول؛ انتظار 30 دقيقة في المتصفح غير مُختبر.

## L. الملفات المتأثرة في هذه المرحلة

الجذور: الفرونت `ofuq-frontend-main/ofuq-frontend-main`؛ الباك `Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main`.

الفرونت:

- `components/student/StudentProvider.tsx`
- `components/student/StudentWorkspace.tsx`
- `components/student/LearningPrimitives.tsx`
- `components/student/StudentHome.tsx`
- `components/student/StudentCatalog.tsx`
- `components/student/StudentDiploma.tsx`
- `components/student/StudentCourse.tsx`
- `components/student/StudentLesson.tsx`
- `components/student/StudentExam.tsx`
- `components/student/StudentCertificates.tsx`
- `components/student/Student.module.css`
- `utils/studentJourney.ts` و`utils/studentJourney.test.ts`
- `app/user/layout.tsx` و`app/user/page.tsx`
- `app/user/my_courses/page.tsx`
- `app/user/my-certificates/page.tsx`
- `app/user/my_exams/page.tsx` و`LegacyMyExams.tsx` بالمسار نفسه
- `app/user/final-exam/[courseId]/page.tsx` و`LegacyFinalExam.tsx` بالمسار نفسه
- `app/user/diplomas/[slug]/page.tsx`
- `app/user/courses/[courseId]/page.tsx`
- `app/watch/page.tsx` — تركيب عرض demo فقط؛ المشغل والتتبع الطبيعي محفوظان
- `scripts/student-inspect.mjs` و`student-checks.mjs` و`student-qa.mjs`
- هذا التقرير و`artifacts/phase05/*` أدلة الاختبار

الباك:

- `app/Http/Controllers/UserLessonController.php`
- `app/Http/Controllers/FinalExamController.php`
- `app/Http/Controllers/CertificateController.php` — إضافة مصدر/حالة/اسم في DTO القراءة
- `app/Http/Controllers/StudentCertificateDownloadController.php`
- `app/Http/Resources/ExamQuestionResource.php`
- `app/Http/Resources/QuestionResource.php`
- `app/Http/Resources/LessonResource.php`
- `app/Http/Middleware/RestrictDemoGatewayToken.php`
- `routes/api.php`
- `app/Console/Commands/AuditStudentReadOnly.php`
- `tests/Feature/StudentLearningReadOnlyTest.php`

التغييرات السابقة الموجودة في worktree حُفظت؛ ليست كل نتائج git status تغييرات هذه المرحلة. لا تعديل .env أو seeders في المرحلة 05.

## M. أدلة المتصفح

كل الصور حقيقية من Chrome CDP، دون صور مولدة. داخل `artifacts/phase05/`:

- `dashboard-{1920,1440,1280,768,390,360}.png`
- `my-diplomas.png`، `python-diploma-progress.png`، `completed-web-diploma.png`
- `my-courses.png`، `continue-learning-course.png`، `continue-learning-lesson.png`
- `my-exams.png`، `final-exam-six-questions.png`
- `certificate-list.png`، `certificate-record-preview.png`
- `course-certificate-download.png` و`diploma-certificate-download.png`
- `course-certificate-http.pdf` و`diploma-certificate-http.pdf`، والملفات المُنزلة بأسمائها المرجعية
- `course-certificate-pdf-browser-preview.png` و`diploma-certificate-pdf-browser-preview.png`
- `course-certificate-verification.png` و`diploma-certificate-verification.png`
- `public-diploma-enrolled.png`، `associated-public-course.png`
- `mobile-navigation.png`، `reduced-motion-mobile.png`، `student-keyboard-focus.png`
- نسخ الصفحات الداخلية عند 768/390/360 في `{diplomas,courses,diploma,course,lesson,final-exam,certificates}-{width}.png`
- `browser-results.json` و`technical-results.json` و`legacy-watch-lint.json`
- `read-only-before.json` و`read-only-after.json` — بصمات لا تُسجل كلمات مرور/رموز وصول

## N. النتائج البصرية وإتاحة الوصول

الصفحة الرئيسية فُحصت بالمقاسات الستة؛ الصفحات التعليمية الداخلية عند 768/390/360. لا overflow أفقي مُقاس. الترتيب RTL ومزج Python مع العربية سليم بصريًا. الخط الفعلي أثبتته Chrome PlatformFonts: Alexandria-Medium للعناوين وIBMPlexSansArabic-Regular للنص، مع fallback Arial لبعض المحارف. ليست مجرد أسماء CSS.

عنوان رئيسي واحد، منطقة main، رابط تخطي، aria-valuenow/label لمؤشرات التقدم، أزرار وروابط تنقل بارتفاع 44px، outline تركيز، وإغلاق قائمة الهاتف بـ Escape. reduced-motion يبقي الحالة مفهومة دون الحركة. أدوات تعطيل الطفرات القديمة أُبقيت لحماية إعدادات الحساب داخل الغلاف الجديد؛ الحماية الأمنية تبقى على الخادم أيضًا. لم يُنفذ تدقيق قارئ شاشة بشري أو تدقيق WCAG شامل لكل مسارات المشروع.

## O. الاختبارات والديون السابقة

- ESLint للملفات الجديدة والمركزة: PASS، صفر أخطاء وصفر تحذيرات.
- ملف watch القديم: 25 خطأ و1 تحذير قبل/بعد، دلتا صفر؛ لم نعد كتابة ميزاته لإخفاء الدين القديم.
- TypeScript الكامل: FAIL قائم، 80 قبل و80 بعد، صفر تشخيص جديد للملفات الجديدة.
- Jest مركّز: 30 PASS /0 FAIL.
- Jest كامل: 78 PASS /2 FAIL قديمان؛ توقع completeLesson لاستدعاء post بمعامل واحد لا يتوافق مع الاستدعاء القائم ذي معامل undefined إضافي.
- Laravel مركّز مع اختبارات بوابة Phase04 والقراءة فقط: 25 PASS /0 FAIL، 135 assertions. fixtures داخل SQLite :memory: مع شرط رفض MySQL؛ لا fixtures على DB العرض.
- Pint: PASS للملفات الجديدة الأربعة؛ PHP syntax PASS للكنترولرات والموارد المعدلة.
- Production build: PASS، BUILD_ID `TZhGWTLdqR9jHg0ApxBsq`.
- smoke للإنتاج العام والبوابة: 20 PASS /0 FAIL؛ ملف Brand Lab يعود 404 server-side، والدخول غير المفعّل لا يمنح token.
- المتصفح: 87 PASS /0 FAIL. التفاصيل النهائية في `browser-results.json`، بما يشمل حفظ الملفين من أزرار المتصفح؛ يتوقف السكربت بـ exit غير صفري عند أي FAIL ولا يعامل shell كدليل جلسة مصادق عليها.

إعدادا `typescript.ignoreBuildErrors=true` و`eslint.ignoreDuringBuilds=true` موجودان مسبقًا في next.config.js ولم يتغيرا. لذا نجاح build ليس شهادة نجاح TypeScript، والفحوص المستقلة هي الدليل.

## P. الأمان والقراءة فقط

قاعدة محلية MySQL `ofoq_demo` تحقق منها DemoEntryGuard بما يشمل اتصال loopback وهوية SELECT DATABASE والحسابات الاصطناعية وأدوارها. لم نُضعف الحارس. طفرات start/submit/complete الفعلية عادت 403 مع DEMO_READ_ONLY. الطالب ممنوع من GET الإدارة، والإدارة ممنوعة من تنزيل الطالب الخاص. اختبارات ملكية شهادة مستخدم آخر، الملف الناقص/غير PDF/المسار الخارجي، pending وعدم المصادقة نجحت. أسئلة المحاولة الفعلية لم تحتو مفاتيح إجابات أو pivot أو explanation.

أمر البصمة: `php artisan demo:student-read-audit` مع `DEMO_ENTRY_DATABASE=ofoq_demo` صريح في بيئة العملية؛ read-only ويكشف غياب العزل بدل تخطيه. سجلات الطالب التعليمية ثابتة عبر الرحلات. لا seed/migration ولا توليد PDF عند النقر.

ملاحظة أمنية قديمة خارج الإصلاح المحدد: خدمة التحقق العامة الحالية تبحث عن السجل دون شرط حالته، وتتضمن fallback «ناجح» عندما لا توجد grade؛ نجاح التحقق لهذين السجلين الصحيحين لا يثبت أن كل pending/revoked مرفوض. الملفات نفسها على public disk، كمعمارية قائمة. لا يُدّعى أن المسار المصادق الجديد يجعل النسخ العامة سرية. يُنصح بتدقيق lifecycle العام وخصوصية التخزين بمهمة مستقلة قبل نشر بيانات حقيقية.

## Q. القيود والمخاطر

غياب الفيديو، عمومية الأسئلة، اختلاف تواريخ الشهادة، هوية PDF القديمة، الديون التقنية السابقة، وعدم اختبار Chrome على جهاز iOS/Android حقيقي. الصفحات القديمة للإعدادات/المفضلة محفوظة وظيفيًا وليست إعادة تصميم كاملة. فحص RTL وresponsive هو على Chrome desktop emulation. الإنتاج الطبيعي للتتبع والإرسال والدفع لم تُنفذ طفراته، حفاظًا على النطاق والبيانات. انتهاء جلسة 30 دقيقة مُغطى backend ولا يوجد انتظار متصفح كامل.

## R. قائمة المراجعة البشرية

1. ادخل `/experience` واختر الطالب، ثم راجع الهرمية والقراءة على 1440 و390.
2. راجع Python25% والأساسيات50% وقواعد البيانات «تقييم قيد التقدم» دون شهادة.
3. افتح البرنامج العام ثم المقرر، وتأكد من وضوح الحد بين صفحة عامة ومساحة التعلم.
4. افتح ستة الأسئلة، وراجع صدق وضع القراءة وجودة النص المخزن المطلوب تحسينه لاحقًا.
5. نزّل الشهادتين، وافتحهما، ثم تحقق من المرجع والهوية؛ راجع فرق التصميم/التواريخ قبل عرض مبيعات نهائي.
6. اختبر قائمة الهاتف والكيبورد وreduced-motion، ثم الخروج وإعادة الدخول وتبديل الدور.
7. لا تعتبر النجاح التقني موافقة بشرية نهائية على جودة المحتوى. توقفت الأعمال عند Phase05؛ لا Phase06 أو إعادة تصميم للإدارة.
