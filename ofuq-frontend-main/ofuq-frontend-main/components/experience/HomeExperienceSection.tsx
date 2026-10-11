import Link from 'next/link'
import { ArrowUpLeft } from 'lucide-react'
import { experienceRoutes } from '@/lib/experienceRoutes'
import { isLocalPreview } from '@/lib/localPreview'
import { AdminWorld, StudentWorld } from './PersonaWorlds'
import worldStyles from './Experience.module.css'
import styles from './HomeExperienceSection.module.css'

export function HomeExperienceSection({ program }: { program: { name: string; courses: number } | null }) {
  return <section className={styles.section} id="dashboard-experience" aria-labelledby="dashboard-experience-title">
    <div className={styles.intro}><h2 id="dashboard-experience-title">من هنا، <em>تتّسع الرحلة.</em></h2><p>اختر المنظور الذي تريد استكشافه.</p></div>
    <div className={worldStyles.worlds}>
      {(['admin', 'student'] as const).map(persona => <article key={persona} className={`${worldStyles.world} ${persona === 'student' ? worldStyles.student : worldStyles.admin}`}>
        <div className={worldStyles.worldHeading}>
          <h3 className={styles.cardTitle}><span className={worldStyles.personaTitle}>{persona === 'student' ? 'لوحة الطلاب' : 'لوحة الإدارة'}</span><span className={worldStyles.worldTagline}>{persona === 'student' ? 'رحلتك، نحو أبعد.' : 'كلّ التفاصيل. رؤية واحدة.'}</span></h3>
          <p>{persona === 'student' ? 'مقرراتك، تقدمك، اختباراتك وإنجازاتك. مساحة تتابع فيها تعلّمك خطوةً بخطوة.' : 'البرامج والطلاب والتقارير. استكشف أدوات تشغيل التجربة التعليمية من داخل المنصة.'}</p>
        </div>
        {persona === 'student' ? <StudentWorld program={program}/> : <AdminWorld/>}
        <div className={worldStyles.worldFooter}><span>{persona === 'student' ? 'تعلم · تقييم · إنجاز' : 'تنظيم · متابعة · تشغيل'}</span><Link className={`${styles.entry} ${persona === 'admin' ? styles.adminEntry : ''}`} href={isLocalPreview ? experienceRoutes[persona] : `${experienceRoutes.gateway}#enter-${persona}`}>{persona === 'student' ? 'لوحة الطلاب' : 'لوحة الإدارة'}<ArrowUpLeft size={20} aria-hidden="true"/></Link></div>
      </article>)}
    </div>
  </section>
}
