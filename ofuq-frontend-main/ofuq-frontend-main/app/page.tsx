import { brand } from '@/lib/brand'
import { experienceRoutes } from '@/lib/experienceRoutes'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUpLeft, ShieldCheck } from 'lucide-react'
import { getPublicDiplomas } from '@/utils/categoryService'
import { PublicNavigation, PublicFooter } from '@/components/brand/PublicShell'
import { HeroVisual, JourneyStory, ProductExplorer, Reveal } from '@/components/brand/ShowcaseMotion'
import { ProductPanel } from '@/components/brand/ProductPanel'
import { ProgramGraphic } from '@/components/brand/ProgramGraphic'
import { publicDescription } from '@/components/brand/publicContent'
import styles from '@/components/brand/Showcase.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: brand.name, description: 'منصة عربية لإدارة البرامج التعليمية والمقررات والتعلم والاختبارات والشهادات والتقارير. للأكاديميات والجهات التدريبية.' }

export default async function HomePage() {
  const result = await getPublicDiplomas().then((data) => ({ data, failed: false })).catch(() => ({ data: [], failed: true }))
  const programs = result.data
  return <div id="top"><PublicNavigation/><main>
    <section className={styles.hero} aria-labelledby="hero-title"><div className={styles.heroGrid}><div className={styles.heroCopy}><span className={styles.heroKicker}><span className={styles.tinyDot}/> للأكاديميات والجهات التدريبية الطموحة</span><h1 id="hero-title"><em>{brand.name}.</em><br/>لإدارة التجربة<br/>التعليمية.</h1><p>منصتك لإدارة البرامج والتعلّم والاختبارات والشهادات. لتمنح فريقك وضوحًا أكبر، ومتعلميك تجربة متصلة.</p><div className={styles.heroActions}><Link href={experienceRoutes.gateway} className={styles.action}>استكشف المنصة <ArrowUpLeft size={19}/></Link><a href="#journey" className={styles.secondaryAction}>شاهد كيف تتصل الرحلة <ArrowDown size={15}/></a></div><div className={styles.heroAudience}>برامج تعليمية · تجربة طالب · إدارة وتشغيل</div></div><HeroVisual programs={programs}/></div><div className={styles.heroBottom}><span>مصممة للتعليم. مبنية لرحلته كاملة.</span><span dir="ltr">التجربة التعليمية</span><a href="#journey">اكتشف {brand.name} ↓</a></div></section>
    <JourneyStory programs={programs}/>
    <section className={styles.section} id="product"><div className={styles.sectionIntro}><div><span className={styles.eyebrow}>02 / TWO PERSPECTIVES</span><h2>من يدير التجربة.<br/>ومن يعيشها.</h2></div><p>البرنامج نفسه، من منظورين مختلفين. استكشف بنية تجربة الإدارة والطالب، ثم انتقل إلى المنصة الفعلية.</p></div><Reveal><ProductExplorer programs={programs}/></Reveal></section>
    <section className={styles.section} id="capabilities"><span className={styles.eyebrow}>03 / BUILT FOR THE EVERYDAY</span><div className={styles.capabilities}><h2 className={styles.capabilityTitle}>تفاصيل التشغيل،<br/>تعمل <em>معًا.</em></h2><div className={styles.capabilityRows}>{[
      ['برامج لها بنية', 'نظّم الدبلومات والمقررات والفصول والدروس. تحكم في المحتوى المنشور واجعل مسار البرنامج واضحًا.'],
      ['تعلم له سياق', 'إدارة التسجيل ومقررات الطالب والتقدم في الدروس، مع تجربة فيديو تعليمية مرتبطة بالمحتوى.'],
      ['تقييم له مرجع', 'بنوك أسئلة واختبارات نهائية ومحاولات ونتائج؛ ترتبط بالمقرر وتجربة المتعلم.'],
      ['إنجاز له توثيق', 'شهادات مقررات ودبلومات قابلة للتنزيل والتحقق، بعد استيفاء شروط الإتمام.'],
      ['إدارة لها رؤية', 'صلاحيات للأدوار، وإدارة مستخدمين وبرامج، وتقارير للطلاب والمقررات والدبلومات.'],
    ].map(([title, description], i) => <details key={title} open={i === 0}><summary><span>{title}</span><span aria-hidden="true">+</span></summary><p>{description}</p></details>)}</div></div></section>
    <section className={`${styles.section} ${styles.programSection}`} id="programs"><div className={styles.sectionIntro}><div><span className={styles.eyebrow}>04 / REAL PROGRAMS, REAL STRUCTURE</span><h2>ليست مجرد واجهات.<br/>هنا محتوى <em>يعمل.</em></h2></div><p>برامج منشورة من كتالوج المنصة الحالي. أسماء ومقررات وتفاصيل يمكن فتحها واستكشافها؛ هذه بيانات عرض تعليمية وليست أرقام عملاء.</p></div><div className={styles.programGrid}>{programs.slice(0, 3).map((program, i) => <Link className={styles.programCard} key={program.id} href={`/diplomas/${program.slug}`}><div className={styles.programCover}><ProgramGraphic title={program.name} identity={program.slug}/><small>{brand.name} / PROGRAM 0{i + 1}</small><strong>{program.name.replace(/^دبلومة\s*/, '')}</strong><small>{brand.name}</small></div><h3>{program.name}</h3><p>{publicDescription(program.description).slice(0, 120)}</p><div className={styles.programMeta}><span>{program.courses_count ?? '—'} مقررات تعليمية</span><ArrowUpLeft size={20}/></div></Link>)}</div>{programs.length === 0 && <p role="status">{result.failed ? 'تعذر الاتصال بكتالوج البرامج الآن. يمكنك إعادة المحاولة من صفحة البرامج.' : 'لا توجد برامج منشورة حاليًا.'}</p>}<Link href="/diploms" className={styles.catalogLink}>استكشف كل البرامج <ArrowUpLeft size={20}/></Link></section>
    <section className={`${styles.section} ${styles.achievement}`}><div><span className={styles.eyebrow}>05 / LEARNING LEAVES A MARK</span><h2>التعلم رحلة.<br/>والإنجاز <em>أثر.</em></h2><p>من تقدم الدروس إلى الاختبار النهائي، ثم شهادة المقرر أو الدبلومة. خطوات مترابطة، وشهادة يمكن الرجوع إلى مرجعها للتحقق.</p><Link href="/verify-certificate" className={styles.catalogLink}><ShieldCheck size={19}/> تحقق من شهادة <ArrowUpLeft size={18}/></Link></div><ProductPanel perspective="certificate" programs={programs}/></section>
    <section className={`${styles.section} ${styles.intelligence}`}><div><span className={styles.eyebrow}>06 / SEE THE WHOLE PICTURE</span><h2>قريب من التفاصيل.<br/>مُطّلع على <em>الصورة الكاملة.</em></h2><p>تابع الطلاب والمقررات والدبلومات من التقارير الموجودة بالمنصة. واجهة إدارة واحدة تجمع ما يحتاجه فريق التشغيل التعليمي.</p></div><div className={styles.reportList}>{[['الطلاب والمستفيدون', 'STUDENTS'], ['المقررات والدروس', 'COURSES'], ['الدبلومات والبرامج', 'PROGRAMS']].map(([label, english]) => <Link href={experienceRoutes.gateway} key={label}>{label}<span>{english}</span><ArrowUpLeft size={20}/></Link>)}</div></section>
    <section className={styles.closing}><span className={styles.eyebrow}>التجربة التعليمية</span><h2>تجربتك التعليمية،<br/>متصلة من البداية.</h2><p>شاهد المنصة من الداخل. واكتشف كيف تجتمع الرحلة في مكان واحد.</p><Link href={experienceRoutes.gateway} className={styles.action}>ادخل إلى المنصة <ArrowUpLeft size={20}/></Link></section>
  </main><PublicFooter/></div>
}
