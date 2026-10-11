import { brand } from '@/lib/brand'
import { BrandLogo } from './BrandLogo'
import { experienceRoutes } from '@/lib/experienceRoutes'
import { ArrowUpLeft, Check, Layers3, Play, ShieldCheck } from 'lucide-react'
import type { Diploma } from '@/utils/categoryService'
import styles from './Showcase.module.css'

export type ProductPerspective = 'admin' | 'student' | 'program' | 'exam' | 'certificate'
const headings = { admin: 'الصورة الكاملة. في مكان واحد.', student: 'مسارك التعليمي، واضح أمامك.', program: 'بنية البرنامج التعليمي', exam: 'التقييم جزء من رحلة التعلم', certificate: 'إنجاز قابل للتحقق' }

/** Art-directed composition of existing page structures; not an application screenshot. */
export function ProductPanel({ perspective = 'admin', programs }: { perspective?: ProductPerspective; programs: Diploma[] }) {
  const selected = programs.slice(0, 3)
  return <div className={styles.productPanel} data-perspective={perspective}>
    <div className={styles.windowBar}><span><i/><i/><i/></span><small>{brand.name} / {perspective.toUpperCase()}</small><ShieldCheck size={14}/></div>
    <div className={styles.panelLayout}>
      <aside className={styles.panelSidebar}><BrandLogo variant="icon" decorative/>{(perspective === 'student' ? ['لوحة الطالب', 'مقرراتي', 'اختباراتي', 'شهاداتي'] : ['نظرة عامة', 'الدبلومات', 'المقررات', 'الطلاب', 'التقارير']).map((label, i) => <span className={i === 0 ? styles.selectedMenu : undefined} key={label}>{i === 0 && <span className={styles.tinyDot}/>} {label}</span>)}<small>بنية الواجهة · عرض توضيحي</small></aside>
      <div className={styles.panelContent}><div className={styles.panelEyebrow}>تجربة {perspective === 'student' ? 'المتعلم' : 'المنصة'}</div><h3>{headings[perspective]}</h3>
        {perspective === 'certificate' ? <div className={styles.certificatePanel}><BrandLogo variant="compact" theme="mono"/><small>شهادة إتمام برنامج تعليمي</small><h4>{selected[0]?.name || 'البرامج التعليمية'}</h4><p>إصدار الشهادة بعد استيفاء متطلبات الإتمام</p><div><ShieldCheck size={17}/> مرجع للتحقق · ملف PDF</div><span className={styles.certificateLine}/></div>
        : perspective === 'exam' ? <div className={styles.examPanel}><span>المقرر ← الاختبار النهائي ← النتيجة</span><h4>أسئلة واختيارات، داخل مسار المقرر.</h4><p>تُدار الأسئلة من بنك الأسئلة، وتظهر المحاولات والنتائج في تجربة الطالب.</p><div><Check size={17}/> بنك أسئلة</div><div><Check size={17}/> محاولات ونتائج</div><a href={experienceRoutes.gateway}>استكشف الاختبارات داخل المنصة <ArrowUpLeft size={16}/></a></div>
        : <><div className={styles.panelModules}>{(perspective === 'student' ? ['المقررات', 'التقدم', 'الشهادات'] : ['البرامج', 'المتعلمون', 'التقارير']).map((label, i) => <div key={label}><span>0{i + 1}</span><strong>{label}</strong><small>{['مسار مترابط', 'متابعة منظمة', 'إنجاز موثق'][i]}</small></div>)}</div><div className={styles.panelTable}><div className={styles.tableHeading}><strong>{perspective === 'student' ? 'برامج تعليمية داخل المنصة' : 'الدبلومات المنشورة'}</strong><Layers3 size={16}/></div>{selected.map((program, i) => <div className={styles.tableRow} key={program.id}><span className={styles.programDot} data-tone={i}/><div><strong>{program.name}</strong><small>{program.courses_count ?? '—'} مقررات · برنامج تعليمي</small></div><span>{perspective === 'student' ? <Play size={14}/> : 'منشور'}</span></div>)}{selected.length === 0 && <p>يمكن استكشاف البرامج من كتالوج المنصة.</p>}</div><div className={styles.panelStatus}><span className={styles.tinyDot}/> المحتوى ← التعلم ← التقييم ← الشهادة</div></>}
      </div>
    </div>
  </div>
}
