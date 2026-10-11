'use client'

import { experienceRoutes } from '@/lib/experienceRoutes'
import { useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
import Link from 'next/link'
import type { Diploma } from '@/utils/categoryService'
import { ProductPanel, type ProductPerspective } from './ProductPanel'
import styles from './Showcase.module.css'

export function Entrance({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .8, delay: reduced ? 0 : delay }}>{children}</motion.div>
}

export function HeroVisual({ programs }: { programs: Diploma[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, -65])
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 0])
  return <motion.div ref={ref} className={styles.heroVisual} style={reduced ? undefined : { y, rotate }}><div className={styles.orbit} aria-hidden="true"/><div className={styles.visualLabel}><span className={styles.tinyDot}/> منظومة واحدة. مسارات متصلة.</div><ProductPanel programs={programs}/><div className={styles.floatingNote}><span>من أول خطوة</span><strong>إلى إنجاز موثّق.</strong><span className={styles.notePath}>برنامج <i/> تعلم <i/> شهادة</span></div><span className={styles.visualCaption}>تكوين من بنية الواجهات الحالية · أسماء برامج فعلية</span></motion.div>
}

const scenes: { title: string; description: string; perspective: ProductPerspective; label: string }[] = [
  { label: 'البرنامج', title: 'كل رحلة تبدأ ببنية واضحة.', description: 'دبلومات تضم مقررات، ومقررات تضم فصولًا ودروسًا. محتواك منظم منذ الخطوة الأولى.', perspective: 'program' },
  { label: 'التعلم', title: 'المتعلم يرى خطوته التالية.', description: 'التسجيل والمقررات ومتابعة التعلم ضمن تجربة طالب واحدة؛ دون فقدان السياق بين الصفحات.', perspective: 'student' },
  { label: 'التقييم', title: 'المعرفة تتحول إلى نتيجة.', description: 'بنك أسئلة واختبارات نهائية ومحاولات مرتبطة بالمقرر. التقييم امتداد للتعلم.', perspective: 'exam' },
  { label: 'الإنجاز', title: 'وكل إنجاز له أثر.', description: 'شهادات للمقررات والدبلومات، وملفات قابلة للتنزيل، ومرجع للتحقق من الشهادة.', perspective: 'certificate' },
  { label: 'الإدارة', title: 'أنت ترى المشهد كاملًا.', description: 'تجميع البرامج والطلاب والمقررات والتقارير في تجربة إدارة تتيح متابعة التشغيل التعليمي.', perspective: 'admin' },
]

export function JourneyStory({ programs }: { programs: Diploma[] }) {
  const target = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (value) => setStep(Math.min(4, Math.floor(value * 5))))
  const scale = useTransform(scrollYProgress, [0, .5, 1], [.96, 1, .98])
  return <section ref={target} id="journey" className={`${styles.journey} ${reduced ? styles.reducedJourney : ''}`} aria-label="قصة المنظومة التعليمية">
    <div className={styles.journeySticky} data-story-state={step}>
      <div className={styles.storyHeading}><span className={styles.eyebrow}>01 / THE CONNECTED JOURNEY</span><h2>ليست أدوات متفرقة.<br/>إنها رحلة <em>واحدة.</em></h2></div>
      <div className={styles.storyScene}><div className={styles.storyCopy}><span className={styles.sceneNumber}>0{step + 1} / 05</span><AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -12 }} transition={{ duration: .25 }}><h3>{scenes[step].title}</h3><p>{scenes[step].description}</p></motion.div></AnimatePresence><Link href="/diploms">استكشف البرامج <ArrowUpLeft size={18}/></Link></div><motion.div className={styles.storyVisual} style={reduced ? undefined : { scale }}><motion.div key={step} initial={reduced ? false : { clipPath: 'inset(0 8% 0 0)', x: 15, opacity: .65 }} animate={{ clipPath: 'inset(0)', x: 0, opacity: 1 }} transition={{ duration: reduced ? 0 : .4 }}><ProductPanel perspective={scenes[step].perspective} programs={programs}/></motion.div></motion.div></div>
      <ol className={styles.storySteps}>{scenes.map((scene, i) => <li key={scene.label} data-active={step === i}><button type="button" aria-current={step === i ? 'step' : undefined} onClick={() => {
        if (reduced) { setStep(i); return }
        const element = target.current
        if (element) { const start = window.scrollY + element.getBoundingClientRect().top; const range = element.offsetHeight - window.innerHeight; window.scrollTo({ top: start + range * (i / 5 + .03), behavior: 'smooth' }) }
      }}><span>0{i + 1}</span>{scene.label}</button></li>)}</ol>
    </div>
    <div className={styles.mobileJourney}>{scenes.map((scene, i) => <article key={scene.label}><span className={styles.eyebrow}>0{i + 1} / {scene.label}</span><h3>{scene.title}</h3><p>{scene.description}</p>{[0, 3].includes(i) && <ProductPanel perspective={scene.perspective} programs={programs}/>}</article>)}</div>
  </section>
}

export function ProductExplorer({ programs }: { programs: Diploma[] }) {
  const [perspective, setPerspective] = useState<'admin' | 'student'>('admin')
  const reduced = useReducedMotion()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  return <div className={styles.explorer}><div className={styles.explorerToolbar}><div role="tablist" aria-label="منظور المنتج">{(['admin', 'student'] as const).map((value, i) => <button ref={(element) => { buttons.current[i] = element }} key={value} type="button" id={`preview-${value}`} role="tab" aria-selected={perspective === value} aria-controls="product-preview" tabIndex={perspective === value ? 0 : -1} onClick={() => setPerspective(value)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i; setPerspective(next === 0 ? 'admin' : 'student'); buttons.current[next]?.focus() } }}>{value === 'admin' ? 'منظور الإدارة' : 'منظور الطالب'}</button>)}</div><span>واجهتان. تجربة تعليمية مترابطة.</span></div><div id="product-preview" role="tabpanel" aria-labelledby={`preview-${perspective}`} tabIndex={0}><AnimatePresence initial={false} mode="wait"><motion.div key={perspective} initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -25 }} transition={{ duration: .25 }}><ProductPanel programs={programs} perspective={perspective}/></motion.div></AnimatePresence></div><div className={styles.explorerFoot}><p>{perspective === 'admin' ? 'تنظيم البرامج، إدارة الطلاب، ومتابعة التقارير من لوحة الإدارة الحالية.' : 'مقررات الطالب واختباراته وشهاداته في مسار تعليمي واضح.'}</p><Link href={experienceRoutes.gateway}>افتح التجربة الفعلية <ArrowUpLeft size={18}/></Link></div></div>
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { clipPath: 'inset(0 0 12% 0)', y: 22, opacity: .65 }} whileInView={{ clipPath: 'inset(0)', y: 0, opacity: 1 }} viewport={{ once: true, amount: .15 }} transition={{ duration: reduced ? 0 : .65 }}>{children}</motion.div>
}
