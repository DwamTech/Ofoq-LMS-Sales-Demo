# منصتك التعليمية — نسخة PNG من المرجع

الملف: `mansatak-reference-extracted-v2.png`، أبعاده ١٩٥٨×٨٠٣، بنمط RGBA وخلفية شفافة فعلية. استخدمت أداة image_gen المدمجة، ثم نسخت الناتج إلى هذا المجلد دون المساس بأصول التطبيق. `preview-on-ivory.png` لقطة متصفح للمعاينة فقط، وليست بديلًا للملف الشفاف.

المصدر البصري: `C:/Users/Copy/Downloads/Arabic EdTech Brand Identity Board.png`، الشعار الرئيسي أعلى يمين اللوحة. طلب المستخدم استخراج الصورة وتحسينها بدل إعادة بنائها متجهيًا.

هذه معالجة بالذكاء الاصطناعي، وليست قصًا بكسليًا حتميًا أو ملف SVG. قد تختلف تفاصيل دقيقة في الحروف والتدرجات عن الصورة الأصلية، وتظل بعض آثار الحواف ملحوظة عند التكبير. لا أدّعي تطابقًا بكسليًا مع اللوحة المرجعية.

## الاعتماد والتركيب — 2026-10-11

اعتمد المستخدم نسخة v2 وطلب مواءمة الألوان والتباين مع ثيم الفرونت. نُسخ الأصل دون تغيير بايتاته إلى `ofuq-frontend-main/ofuq-frontend-main/public/brand/mansatak-approved.png`. يعرضه المكوّن المركزي `BrandLogo` بقصّ ثابت، مع أقنعة CSS لضبط لون الكتابة والعلامة الليمونية دون إعادة توليد الحروف. توجد نسخة عكسية عالية التباين للأسطح الداكنة وأخرى أحادية للطباعة. النسخ المتجهية السابقة ليست الشعار الجاري استخدامه.

التقرير ولقطات المتصفح: `ofuq-frontend-main/ofuq-frontend-main/docs/approved-logo-integration.md` و`ofuq-frontend-main/ofuq-frontend-main/artifacts/mansatak-approved/`، نسبة إلى جذر المشروع.

## التوجيه الأخير المستخدم للأداة

Use case: background-extraction / edge cleanup. Image 1 is the isolated logo edit target. Image 2 is the original visual reference, only its large top-right main logo is relevant. Make a single narrowly targeted cleanup of Image 1: remove ALL stray colored specks and fringes outside the logo shapes, smooth jagged cutout contours into crisp clean anti-aliased edges, remove neon-blue edge artifacts, and ensure transparent pixels outside the artwork are truly clean alpha-zero. Maintain small even transparent padding on every side with no stray pixels touching the canvas edges. Preserve the exact two-line Arabic wording 'منصتك التعليمية', existing letter connections, dots, composition and relative proportions; keep the dark-purple wordmark on the left and original folded purple M ribbon with lime diamond above on the right. Match the original reference's softer lime green (#C8F263) and purple (#7B61D9), not saturated neon colors. Keep the original soft ribbon-fold shading. Do NOT invent or redesign the logo, change typography, add letters, slogans, decorations, checkerboard, backgrounds, cards or shadows. Output ONE high-resolution horizontal PNG cutout with genuinely transparent background and polished edges. No presentation board.
