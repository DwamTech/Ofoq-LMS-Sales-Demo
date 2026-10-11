'use client';
import { brand } from '@/lib/brand'
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { experienceRoutes } from '@/lib/experienceRoutes';
import { enterDemo, validatedStoredIdentity, type DemoPersona } from '@/utils/demoGateway';
import type { User } from '@/utils/authService';
import { HorizonIntro } from './HorizonIntro';
import { AdminWorld, StudentWorld } from './PersonaWorlds';
import styles from './Experience.module.css';

export default function ExperienceGateway({ enabled, program }: { enabled: boolean; program: { name: string; courses: number } | null }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<'initial'|'horizon'|'ready'>('initial');
  const [active, setActive] = useState<DemoPersona | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [confirm, setConfirm] = useState<DemoPersona | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true; setHydrated(true);
    let seen = false;
    try { seen = sessionStorage.getItem('ofoq_experience_intro') === 'seen'; sessionStorage.setItem('ofoq_experience_intro','seen'); } catch {}
    if (seen || reduced) { setStage('ready'); return; }
    const horizon = setTimeout(() => setStage(current => current === 'ready' ? 'ready' : 'horizon'), 150);
    const ready = setTimeout(() => setStage('ready'), 1500);
    return () => { clearTimeout(horizon); clearTimeout(ready); };
  }, [reduced]);
  useEffect(() => {
    const controller = new AbortController();
    void validatedStoredIdentity(AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
      .then(identity => { if (!controller.signal.aborted) setUser(identity); })
      .catch(() => { /* A broken existing session never authorizes a persona. */ })
      .finally(() => { if (!controller.signal.aborted) setCheckingSession(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => () => { mounted.current = false; request.current?.abort(); }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const select = async (persona: DemoPersona, confirmed = false) => {
    if (busy) return;
    setStage('ready'); setActive(persona); setError('');
    if ((user || localStorage.getItem('auth_token')) && !confirmed) { setConfirm(persona); return; }
    setConfirm(null);
    if (!enabled) { setError('الدخول التجريبي غير مفعّل في هذه البيئة. يمكنك استخدام تسجيل الدخول المعتاد.'); return; }
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    setBusy(true);
    try {
      const destination = await enterDemo(persona, controller.signal);
      if (mounted.current && !controller.signal.aborted) window.location.assign(destination); // Fresh auth-scoped caches, not a presentation-only route push.
    } catch (reason) {
      if (mounted.current) { setError(reason instanceof Error && reason.name !== 'AbortError' ? reason.message : 'انقطع الاتصال أثناء التحقق. لم يتم تأكيد الدخول؛ أعد المحاولة.'); setBusy(false); setUser(null); }
    } finally { clearTimeout(timeout); }
  };

  return <main className={styles.gateway} data-experience-ready={hydrated} data-session-checked={!checkingSession} data-intro={stage} aria-busy={busy || checkingSession}>
    <nav className={styles.navigation} aria-label={`تنقل تجربة ${brand.name}`}><Link href="/" aria-label={`العودة إلى موقع ${brand.name}`}><BrandMark/></Link><Link href="/"><ArrowRight size={16}/> العودة للموقع</Link><Link href={experienceRoutes.login}>الدخول المعتاد <ArrowUpLeft size={16}/></Link></nav>
    <header className={styles.sceneHeading}><span className={styles.eyebrow}>التجربة التعليمية</span><h1>أهلًا بك في <em>{brand.name}.</em></h1><p>من هنا، تتّسع الرحلة. اختر المنظور الذي تريد استكشافه.</p><HorizonIntro stage={stage}/>{stage !== 'ready' && <button type="button" className={styles.skip} onClick={() => setStage('ready')} aria-controls="experience-worlds">تخطَّ المقدمة ←</button>}</header>
    <div className={styles.sessionNote}><LockKeyhole size={15}/><span>{enabled ? 'جلسة عرض حقيقية · حسابات اصطناعية · استكشاف للقراءة فقط' : 'الدخول التجريبي غير مفعّل هنا · تسجيل الدخول المعتاد محفوظ'}</span>{user && <span>جلسة حالية: {user.role === 'student' ? 'طالب' : 'إدارة'} · اختيار تجربة أخرى يستبدل الجلسة</span>}</div>
    <section id="experience-worlds" className={styles.worlds} aria-label="اختر تجربة المنصة">
      {(['student','admin'] as const).map(persona => <article key={persona} className={`${styles.world} ${persona === 'student' ? styles.student : styles.admin}`} data-selected={active === persona}>
        <div className={styles.worldHeading}><span className={styles.eyebrow}>{persona === 'student' ? `التجربة التعليمية` : '02 / THE BIGGER PICTURE'}</span><h2>{persona === 'student' ? 'رحلتك، نحو أبعد.' : 'كلّ التفاصيل. رؤية واحدة.'}</h2><p>{persona === 'student' ? 'مقرراتك، تقدمك، اختباراتك وإنجازاتك. مساحة تتابع فيها تعلّمك خطوةً بخطوة.' : 'البرامج والطلاب والتقارير. استكشف أدوات تشغيل التجربة التعليمية من داخل المنصة.'}</p></div>
        {persona === 'student' ? <StudentWorld program={program}/> : <AdminWorld/>}
        <div className={styles.worldFooter}><span>{persona === 'student' ? 'تعلم · تقييم · إنجاز' : 'تنظيم · متابعة · تشغيل'}</span><button type="button" id={`enter-${persona}`} disabled={busy || checkingSession} onClick={() => void select(persona)} onFocus={() => setActive(persona)} onPointerEnter={() => setActive(persona)} aria-describedby="entry-disclosure">{busy && active === persona ? 'جارٍ التحقق من الجلسة…' : persona === 'student' ? 'لوحة الطلاب' : 'لوحة الإدارة'}<ArrowUpLeft size={20}/></button></div>
      </article>)}
    </section>
    <AnimatePresence initial={false}>{(busy || error || confirm) && <motion.div className={styles.feedback} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}>
      {busy && <p role="status" aria-live="polite">نتحقق من الهوية والصلاحيات لدى الخادم. ستنتقل إلى اللوحة بعد تأكيد الجلسة فقط.</p>}
      {confirm && <div role="group" aria-label="تأكيد تغيير الجلسة"><p>سيتم إنهاء الجلسة الحالية في هذا المتصفح وفتح حساب عرض {confirm === 'student' ? 'الطالب' : 'الإدارة'}. هل تريد المتابعة؟</p><button type="button" onClick={() => void select(confirm,true)}>تأكيد تغيير الجلسة</button><button type="button" onClick={() => setConfirm(null)}>إلغاء</button><Link href={user?.role === 'student' ? '/user' : '/admin'}>متابعة جلستي الحالية ←</Link></div>}
      {error && <div ref={errorRef} tabIndex={-1} role="alert"><h3>لم نؤكد الدخول بعد.</h3><p>{error}</p><Link href={experienceRoutes.login}>تسجيل الدخول المعتاد ←</Link><button type="button" onClick={() => active && void select(active)}>أعد المحاولة</button></div>}
    </motion.div>}</AnimatePresence>
    <footer className={styles.footer} id="entry-disclosure"><p>هذه تجربة عرض تعليمية. لا عمليات شراء أو تعديل بيانات عبر جلسات العرض.</p><div><Link href={experienceRoutes.register}>إنشاء حساب بالطريقة المعتادة</Link><Link href="/privacy">الخصوصية</Link><Link href="/verify-certificate">التحقق من شهادة</Link></div></footer>
  </main>;
}
