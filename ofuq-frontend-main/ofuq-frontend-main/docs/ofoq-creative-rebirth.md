# أُفُق — تقرير Creative Rebirth

تاريخ التحقق: 10 أكتوبر 2026. نسخة الإنتاج المحلية: http://127.0.0.1:3004

## A — الخلاصة التنفيذية

نُفذت هوية عامة جديدة وصفحة رئيسية عربية B2B، موجهة للأكاديميات وجهات التدريب، وليست واجهة أكاديمية لبيع المقررات فقط. يتصل عرض المنتج بالكتالوج الفعلي، مع قصة تمرير بخمس مراحل وتجربة استكشاف منظور الطالب والإدارة. لم تتغير لوحات التحكم أو نظام المصادقة أو منطق التسجيل والاختبارات والشهادات، ولم تُشغّل عمليات إعداد بيانات أو migrations.

النتيجة: جاهزة للمراجعة البصرية البشرية، وليست إعلانًا بأن جميع معايير القبول الفنية والإبداعية حُسمت. توجد أعطال legacy ومشكلة فيديو خارجي موثقة أدناه.

## B/C — المفهوم والفرق عن السابق

«المعرفة تتّسع»: الأفق ليس منظرًا زخرفيًا، بل بنية تربط البرنامج والتعلم والتقييم والإنجاز والإدارة. رمز SVG أصلي: قوس وخط أفق ونقطة، بدل أيقونات القبعات والكتب المعتادة. يمكن استبداله من `BrandMark` دون إعادة بناء رؤوس الصفحات. لم تُحذف ملفات الشعار الأصلي.

بدل navy/teal والبطاقات المتكررة: أرضية عاجية، حبر بنفسجي، إشارة ليمونية، ومساحات تحريرية متنوعة. Hero غير متماثل، نافذة منتج مائلة، ملاحظة إنجاز متراكبة، قصة مثبتة، معرض منظورين، capabilities كصفوف كشف، أغلفة برامج هندسية، ثم مشهد تقارير داكن وختام ليموني. ليست الصفحة نسخة من Apple أو Stripe أو Linear، ولا توجد أصول منسوخة منها.

استُخدمت إرشادات Sites لتكوين المشاهد والتحقق المحلي فقط؛ لا نشر خارجي أو ربط خدمة استضافة.

## D — اللون والطباعة

| الاستخدام | اللون |
| --- | --- |
| أرضية الأفق | `#F6F4ED` |
| حبر المعرفة | `#29233B` |
| دعم بنفسجي | `#635080` |
| إشارة اكتشاف | `#D8EF73` |
| بيئة القصة | `#E9E5EF` |
| أغلفة برامج | lavender / sage / clay |

الخطوط محلية عبر `next/font/local`، داخل `BrandScope`: Alexandria Arabic variable للعناوين، IBM Plex Sans Arabic للأجسام وواجهة الاستخدام بأوزان 400/600/700. fallback إلى Tahoma/Arial. `display:swap` وpreload. لا اعتماد على Google Fonts وقت التشغيل. أربعة ملفات WOFF2 مجموعها 164,164 bytes، نحو 160.3 KiB.

**PASS — خط فعلي، وليس مجرد CSS**: Chrome CDP أظهر Alexandria-SemiBold يرسم 34 glyphs داخل Hero، وIBMPlexSansArabic-Regular يرسم 92 glyphs داخل النص. Arial يُستخدم لبعض علامات الترقيم غير المشمولة بالملفات العربية. عولج وراثة خط UI داخل `em` ليبقى عنوان Hero بالكامل بخط العرض.

المصادقة والطالب والإدارة لا تحصل على `BrandScope`، ولا تتغير طباعتها. أسماء tokens القديمة retained كواجهات توافق؛ قيمها الآن تنتمي للهوية الجديدة.

## E — الأصول ومصادرها

- `BrandMark`: SVG أصلي مرسوم في الكود، قابل للاستبدال.
- أغلفة البرامج: SVG/CSS أصلي، بألوان ثابتة من هوية البرنامج، لا إنشاء لسجلات جديدة. الصورة الحقيقية الصالحة تظل مستخدمة؛ الصور الافتراضية القديمة أو المفقودة تحصل على الغلاف الجديد.
- `ProductPanel`: تكوين توضيحي لبنية قدرات المنتج الموجودة، مع أسماء برامج وعدد مقررات من API. ليس screenshot للوحة مسجلة الدخول، ولا شهادة مزعومة صادرة لشخص، ولا إحصاءات عملاء. يوجد وصف واضح لذلك في التكوين.
- أيقونات Lucide/react-icons من اعتماديات المشروع الحالية.
- الخطوط من حزم Fontsource 5.3.0، مع copyright الأصلي وSIL OFL-1.1 كاملًا في `public/licenses/ofoq-brand-fonts.txt`.
- لا صور stock جديدة، لا صور مولدة بالذكاء الاصطناعي، لا شهادات عملاء أو شعارات عملاء أو نسب نجاح مختلقة. كل صور QA التقطها Chrome من الموقع الحقيقي.

## F/G — الحركة وقصة التمرير

استخدام Framer Motion الموجود بالمشروع، دون مكتبة animation إضافية أو scroll hijacking:

- CSS entrance choreography للنص والتكوين والملاحظة.
- `useScroll` لتحريك Hero رأسيًا قليلًا وتصحيح ميله.
- قصة desktop من خمس حالات: البرنامج ← التعلم ← التقييم ← الشهادة ← الإدارة.
- `position:sticky` داخل نطاق 270vh؛ عند ارتفاع 900px يكون مسار الحالة نحو 1530px، وليس آلاف البيكسلات من المشاهد الخالية أثناء الاستخدام الفعلي.
- offset: `start start` / `end end`؛ الحالة `floor(progress * 5)` مع clamp إلى 4. النص والتكوين يتشاركان الحالة نفسها.
- scale scrub وclip-path reveal عند انتقال الحالة، مع AnimatePresence للنص والتبويبات.
- أزرار مراحل القصة تنقل إلى موضعها باستخدام التمرير الأصلي.
- الموبايل والتابلت تحت 860px يعرضان خمس مقاطع مستقلة دون pinning، مع تكوينين مرئيين بدل تكرار خمس نوافذ ثقيلة.
- reduced motion يزيل pinning والحركات المكانية، ويبقي اختيار المراحل والتبويبات والمحتوى متاحًا.
- لا wheel interception ولا preloader يمنع الاستخدام.

عولج عيب حقيقي: `overflow-x:hidden` القديم على body كان يمنع sticky من الالتصاق بصاحب التمرير الصحيح. التعديل scoped إلى الصفحات العامة باستخدام `body:has(.publicScope)`؛ لا تغيير لسلوك صفحات اللوحات.

## H/I — بنية الصفحة والمسارات

ثمانية مشاهد: Discovery Hero → Connected Journey → Product Perspectives → Functional Depth → Real Programs → Achievement → Management Intelligence → Conversion.

الرئيسية تستخدم `/api/categories` الحالي من الخادم؛ عند فشل الاتصال تعرض رسالة حقيقية بدل كتالوج وهمي. فحص HTTP أرجع 5 برامج منشورة، و`/api/allCourses` أرجع 12 مقررًا عامًا. أسماء البرامج المعروضة في الرئيسية طابقت API.

هوية header/footer والطباعة والألوان scoped إلى `/`, `/about`, `/courses`, `/diploms`, `/diplomas/*`, `/course-details/*`, `/community`, `/search`, `/verify-certificate`, `/privacy`, `/terms`. مسارات الدخول واللوحات والمشغل مستثناة. الروابط والبحث والترتيب والتسجيل والتحقق الحالية محفوظة؛ CTA يذهب إلى `/auth` الحالي أو لوحة الدور للمستخدم الموجود، لا fake login.

`/about` أصبح تعريفًا بالمنتج، مع الحفاظ على الأقسام الستة كروابط anchors. الكتالوج أصبح ببحث ظاهر فورًا وأغلفة متسقة. صفحة الدبلومة حصلت على عنوانها الفعلي الذي كان غير ظاهر، وأغلفة للبرنامج والمقررات، دون تغيير enrollment handlers. تفاصيل المقرر تحتفظ بالفيديو والمحتوى والتسجيل، مع غلاف sidebar وألوان عامة جديدة. صفحات المجتمع والتحقق والسياسات تحصل على shell وهوية مشتركة، وليست إعادة كتابة لمنطقها أو نصها القانوني.

`/brand-lab` مختبر اتجاه جديد للتطوير فقط: `notFound()` يُنفذ server-side عند `NODE_ENV=production` قبل قراءة البيانات. لا رابط له في header أو footer.

## J — الملفات الدقيقة

كل المسارات التالية بالنسبة لجذر frontend:

### ملفات التطبيق والمكونات القائمة المعدلة

- `app/page.tsx`
- `app/layout.tsx`
- `app/about/page.tsx`
- `app/community/page.tsx` — إزالة دور button من بطاقات معلومات لا تمتلك فعلًا.
- `app/diplomas/[slug]/page.tsx`
- `app/course-details/[id]/page.tsx` — تمرير عنوان المقرر للغلاف فقط.
- `app/brand-lab/page.tsx` — استبدال المختبر السابق.
- `components/HomeHeader.tsx`
- `components/Footer.tsx`
- `components/HeroSearchSection.tsx`
- `components/DiplomaCard.tsx`
- `components/CourseCard.tsx`
- `components/CourseSidebar.tsx` — غلاف scoped، دون تغيير callbacks.
- `components/brand/BrandSystem.module.css`
- `components/brand/brandFonts.ts` — تصحيح تعليق نطاق الاستخدام.
- `docs/ofoq-brand-foundation.md` — توضيح أنها وثيقة الاتجاه السابق وليست مرجع الألوان الحالي.

### ملفات جديدة في هذه المهمة

- `components/brand/BrandMark.tsx`
- `components/brand/publicRoutes.ts`
- `components/brand/PublicShell.tsx`
- `components/brand/ProductPanel.tsx`
- `components/brand/ProgramArtwork.tsx`
- `components/brand/ShowcaseMotion.tsx`
- `components/brand/Showcase.module.css`
- `scripts/creative-rebirth-qa.mjs`
- `scripts/creative-rebirth-smoke.mjs`
- `public/licenses/ofoq-brand-fonts.txt`
- `docs/ofoq-creative-rebirth.md`
- `artifacts/creative-rebirth/*.png` وملفات النتائج JSON.

حُذف stylesheet المختبر السابق غير المستخدم `app/brand-lab/BrandLab.module.css`. `BrandPrimitives` الحالي أعيد استخدامه، وليس مكتبة UI جديدة. تعديلات backend وseeders وpackage files الظاهرة في worktree كانت موجودة من المراحل السابقة وليست تنفيذًا جديدًا لهذه المهمة.

## K — الاعتماديات

لا مكتبات جديدة لهذه المهمة. Framer Motion وLucide وreact-icons موجودة بالفعل. حزم الخطوط ثبتت في المرحلة السابقة. QA يستخدم Chrome المثبت وNode built-in WebSocket/CDP، دون Playwright/Puppeteer دائمين أو تنزيل متصفح جديد.

## L — أدلة وصور حقيقية

المجلد: `artifacts/creative-rebirth/`:

- `home-1440-full.png`, `home-1440-hero.png`
- `home-768-full.png`, `home-768-hero.png`
- `home-390-full.png`, `home-390-hero.png`
- `mobile-navigation.png`
- `scroll-start.png`, `scroll-middle.png`, `scroll-final.png`, `scroll-reverse.png`, `scroll-fast-end.png`, `scroll-fast-start.png`
- `product-admin.png`, `product-student.png`
- `real-programs.png`, `final-cta.png`, `reduced-motion-full.png`
- `page-about.png`, `page-courses.png`, `page-diploms.png`, `page-community.png`, `page-verify-certificate.png`، ولكل منها نسخة `-mobile.png`.
- `page-diploma-detail.png`, `page-diploma-detail-mobile.png`
- `page-course-detail.png`, `page-course-detail-mobile.png`
- `client-navigation-story.png`
- `browser-results.json`, `additional-browser-results.json`, `production-smoke.json`.

لا يوجد تسجيل فيديو. البديل القابل لإعادة الإنتاج هو سكربت QA الذي يقود Chrome فعليًا إلى مواضع start/middle/end/reverse/fast ويقارن الحالة وتثبيت canvas؛ الصورة الثابتة وحدها ليست دليل نجاح الحركة. لقطة full-page تُسطّح مساحة sticky، ولذلك تُراجع مع صور الحالات والاختبار التفاعلي، لا وحدها.

## M/N — نتائج الفحص البصري والإتاحة

**PASS، فحص آلي ومشاهدة فعلية**: لا horizontal overflow في الرئيسية عند 1920/1440/1280/768/390/360. Hero عند 1440×900 يحتوي الرسالة وCTA وتكوين منتج داخل viewport. الموبايل يعيد التكوين، لا يصغر desktop فقط. الصفحات الخمس الداعمة وتفاصيل الدبلومة والمقرر لا تتجاوز عرض 390px.

**PASS**: تبديل الطالب والإدارة، keyboard Home للتبويبات، فتح القائمة وإغلاقها بـEscape، capabilities disclosure، البحث الفوري عن Python يعرض نتيجة واحدة، إعادة الانتقال client-side من الرئيسية إلى about والعودة ثم استخدام sticky، reduced motion واختيار مراحله. لا Runtime exceptions مرصودة.

الإصلاحات نتيجة مشاهدة الصور: عنوان التقارير الداكن كان داكنًا فوق خلفية داكنة؛ أصبح عاجيًا. مقدمة التحقق كانت بنص فاتح وعنوان غير واضح؛ صُححت الألوان والظهور. placeholder البحث أصبح أغمق. القائمة محدودة بارتفاع viewport وتسمح بالتمرير الداخلي. أضيف focus إلى summary، وربط «إلى الأعلى» بمُعرف header الموجود في جميع الصفحات العامة. أزيلت semantics المضللة لبطاقات المجتمع.

نسب التباين المحسوبة للتركيبات الأساسية: ink/ivory = 13.65:1، ink/lime = 11.81:1، body muted/ivory = 4.52:1، نص التقارير الفاتح/ink = 7.30:1. عُتمت labels داخل تكوين المنتج التي كانت أقل من AA. لا تمثل هذه العينات تدقيق WCAG شاملًا.

**NOT TESTED**: screen reader، audit AA لكل legacy text/state، جميع حالات focus على كل صفحة، متصفحات Safari/Firefox وأجهزة حقيقية. وجود بعض التحكم legacy غير الدلالي في تفاصيل المقرر يحتاج مراجعة إتاحة لاحقة. الحكم النهائي على premium/originality والتناسب الفني يحتاج موافقة بشرية، وليس نجاح build.

## O — النتائج الفنية الفعلية

| الفحص | النتيجة |
| --- | --- |
| Production build النهائي | PASS |
| ESLint للمكونات الجديدة وhomepage/about/community/Brand Lab/search hero | PASS: صفر أخطاء، تحذيران `<img>` |
| ESLint للملفات legacy المتأثرة | FAIL: 68 خطأ في ثلاثة ملفات قديمة، بأعداد مطابقة لـHEAD: diploma detail = 9، course detail = 53، CourseSidebar = 6؛ لا زيادة في الأخطاء |
| TypeScript المشروع كله | FAIL: 80 diagnostic قديمة؛ لم يظهر diagnostic في مناطق التنفيذ المعدلة أو الجديدة |
| Jest | 27 PASS، 2 FAIL، في 3 suites: اثنتان PASS وواحدة FAIL |
| اختبارات المتصفح الأساسية | 34 PASS، صفر FAIL |
| اختبارات متصفح إضافية | 5 PASS، صفر FAIL |
| HTTP smoke + API/data checks | 16 PASS، صفر FAIL |
| `/brand-lab` في الإنتاج | PASS: HTTP 404، server-side |
| `/auth`, `/user`, `/admin` | PASS لتحميل HTTP 200 وعدم وجود brandScope، وليس اختبار جلسة مسجلة الدخول |
| authenticated dashboard/auth E2E | NOT TESTED؛ لم تُنشأ tokens أو تُنفذ عمليات DB لاختبارها |
| `git diff --check` في ملفات التنفيذ | PASS |

فشلا Jest في `utils/lessonService.test.ts`: assertions تتوقع `post(url)` بينما الخدمة الحالية تستدعي `post(url, undefined)`. `utils/lessonService.ts` لم يتغير. suite `components/ExamCard.test.tsx` وsuite preservation لمسارات الإدارة نجحتا. لم تُعدل الاختبارات لمجرد الحصول على PASS.

سبب نجاح build رغم TypeScript: `next.config.js` يحتوي مسبقًا `typescript.ignoreBuildErrors:true` و`eslint.ignoreDuringBuilds:true`. لم يتم تعديلهما أو تخفيفهما. بناء ناجح لا يعني compiler clean. توجد تحذيرات قديمة بشأن metadata viewport/themeColor وmetadataBase وBrowserslist.

`/search` يعيد 307 في HTTP بلا Location لأن التنفيذ القديم client redirect؛ تم اختبار الانتقال الفعلي في Chrome إلى `/diploms` ونجح. لم يُعرض نجاح status وحده كدليل على تجربة المتصفح.

## P — الأداء وحدود القياس

مجموع gzip لملفات JavaScript المدرجة في homepage build manifest نحو 173KB (قياس ملفات، وليس قياس شبكة المستخدم). ملفات خطوط العلامة نحو 160.3KiB. لا صور raster جديدة كبيرة أو فيديو autoplay في Hero أو dependency إضافية للحركة.

رُصد layout shift محلي منخفض جدًا في اختبار الإنتاج cached: نحو 0.0003 على desktop، وصفر في عينات tablet/mobile، مع LCP محلي في عشرات milliseconds. هذه نتائج جهاز محلي وcache، **ليست** Lighthouse score أو Core Web Vitals على شبكة موبايل. النتائج الخام في `browser-results.json`؛ القياس تحت CPU/network throttling وأجهزة ضعيفة **NOT TESTED**. طول الكتالوج على الجوال كبير لأنه يعرض السجلات الحالية، لم تُلغَ البيانات لتقصيره.

## Q — المشكلات المتبقية

1. **FAIL خارجي مؤكد**: روابط Bunny/mediadelivery العربية والإنجليزية والفرنسية في المجتمع ترجع HTTP 404. يلزم استعادة media أو URLs صحيحة من المالك. لم تُستبدل بفيديوهات مزعومة أو تُخفَ المشكلة.
2. TypeScript القديم وفشلا Jest وأخطاء lint القديمة كما أعلاه؛ تمنع وصف المشروع كله بأنه clean.
3. صور product showcase تكوينات دقيقة للقدرات، لا لقطات جلسة دخول فعلية. تحديثها لاحقًا بلقطات معتمدة يمكن أن يزيد قوة الدليل التجاري، دون ادعاء أنها موجودة الآن.
4. بعض تفاصيل المحتوى والبيانات تعرض نصوص `OFOQ Sales Demo dataset` والعملات legacy المختلفة؛ لم تُعدّل سجلات أو قواعد تسعير لإخفاء ذلك. تحتاج مراجعة محتوى/تسعير مستقلة ضمن صلاحيات مناسبة.
5. سياسات الخصوصية والشروط باقية بنصها الحالي؛ يجب مراجعتها قانونيًا قبل بيع المنتج المستقل. الهوية المشتركة ليست اعتمادًا قانونيًا للنص.
6. اعتماد فني للشعار المؤقت، وتدقيق إتاحة/أداء شامل، وتجارب logged-in end-to-end ما زالت مطلوبة قبل إعلان جاهزية إطلاق عامة.

## R — المراجعة البشرية وإعادة الاختبار

افتح http://127.0.0.1:3004 على 1440×900 ثم 390px. راجع وضوح الجمهور والرسالة وCTA، مرر عبر القصة بهدوء ثم بسرعة وبالعكس، جرّب التبويبات والبحث وافتح برنامجًا حقيقيًا. فعّل prefers-reduced-motion وتحقق أن القصة كاملة دون pinning. راجع صور الصفحات الداعمة، لا Hero فقط.

من جذر frontend:

```powershell
npm.cmd run build
npm.cmd run start
node scripts/creative-rebirth-qa.mjs
$env:OFOQ_QA_QUICK='1'
node scripts/creative-rebirth-qa.mjs
Remove-Item Env:OFOQ_QA_QUICK
node scripts/creative-rebirth-smoke.mjs
npm.cmd test -- --runInBand
npm.cmd run type-check
```

أوقف dev server قبل build؛ لا تشغّل dev وproduction على `.next` نفسها أثناء البناء. QA يفتح Chrome headless مخفيًا بprofile مؤقت منفصل، لا يستخدم جلسة المستخدم أو أسراره. يمكن تغيير URL عبر `OFOQ_QA_URL` ومنفذ CDP عبر `OFOQ_QA_PORT`. السكربت يرجع exit code غير صفري إذا فشل assertion.

**التوصية: READY FOR HUMAN VISUAL REVIEW.** لا يُعلن creative approval أو production launch PASS نيابة عن المستخدم. إصلاح مصدر فيديو المجتمع، ومعالجة quality debt واختبارات logged-in والإتاحة والأداء الشاملة، شروط منفصلة عن اعتماد الاتجاه البصري.
