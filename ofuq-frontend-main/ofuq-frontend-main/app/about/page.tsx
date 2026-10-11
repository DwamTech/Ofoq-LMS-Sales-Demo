import { brand } from '@/lib/brand'
import Link from 'next/link'
import { ArrowUpLeft } from 'lucide-react'
import { PublicNavigation, PublicFooter } from '@/components/brand/PublicShell'
import styles from '@/components/brand/Showcase.module.css'

const sections = [
  ['intro', 'التعريف', 'مساحة واحدة للتجربة التعليمية.', `${brand.name} منصة عربية تجمع إدارة البرامج والمقررات وتجربة الطالب والاختبارات والشهادات والتقارير. تخدم الأكاديميات والجهات التدريبية التي تحتاج إلى تنظيم العمل التعليمي ومتابعته.`],
  ['mission', 'الرسالة', 'تقريب التشغيل من التعلم.', 'إعطاء فريقك إطارًا واضحًا لتقديم البرامج، وإعطاء المتعلم سياقًا متصلًا لمتابعة محتواه وتقدمه وإنجازه.'],
  ['goals', 'الأهداف', 'وضوح أكبر في كل مرحلة.', 'تنظيم المحتوى والتسجيل، متابعة الدروس والاختبارات، وتوثيق الإتمام بشهادات قابلة للتحقق. ترتبط هذه المراحل بالبرنامج التعليمي نفسه.'],
  ['values', 'القيم', 'الوضوح. الترابط. قابلية التحقق.', 'واجهة عربية تراعي اتجاه القراءة، ومسارات تحفظ سياق المتعلم، وشهادات يرتبط إصدارها بمتطلبات الإتمام.'],
  ['methodology', 'المنهجية', 'من البنية إلى الإنجاز.', 'دبلومة تضم مقررات؛ مقرر يضم فصولًا ودروسًا. تسجيل، تعلم، تقييم، ثم شهادة. لكل خطوة مكانها داخل المنصة.'],
  ['advantages', 'قدرات المنصة', 'رؤية مشتركة للطالب والإدارة.', 'لوحة طالب للمقررات والاختبارات والشهادات، ولوحة إدارة للمستخدمين والمحتوى والتقارير، مع صلاحيات حسب الدور.'],
] as const

export default function AboutPage() {
  return <div id="top"><PublicNavigation/><main><section className={styles.section}><span className={styles.eyebrow}>التجربة التعليمية</span><div className={styles.sectionIntro}><h1 className={styles.capabilityTitle}>التعليم يستحق<br/>تجربة متصلة.</h1><p>منتج للأكاديميات والجهات التدريبية. يجمع التفاصيل التي تجعل البرنامج التعليمي تجربة مترابطة.</p></div><nav className={styles.aboutIndex} aria-label="أقسام التعريف">{sections.map(([id, label]) => <a href={`#${id}`} key={id}>{label} ↙</a>)}</nav></section><section className={styles.section}><div className={styles.capabilities}><div className={styles.capabilityTitle}><span className={styles.eyebrow}>{brand.name}</span>من أول برنامج،<br/>إلى آخر شهادة.<br/><Link href="/auth" className={styles.catalogLink}>استكشف {brand.name} <ArrowUpLeft size={19}/></Link></div><div>{sections.map(([id, label, title, content]) => <article id={id} key={id} className={styles.aboutArticle}><span className={styles.eyebrow}>{label}</span><h2>{title}</h2><p>{content}</p></article>)}</div></div></section></main><PublicFooter/></div>
}
