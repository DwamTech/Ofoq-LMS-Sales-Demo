'use client'
import { brand } from '@/lib/brand'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowUp, ArrowUpLeft, BookOpen, ChevronDown, Menu, MessageCircle, ShieldCheck, X } from 'lucide-react'
import { getCurrentUser, signout, type User } from '@/utils/authService'
import { getPublicSectionsSafe, type Section } from '@/utils/sectionService'
import { BrandScope } from './BrandPrimitives'
import { BrandMark } from './BrandMark'
import { isBrandedPublicRoute } from './publicRoutes'
import styles from './Showcase.module.css'
import { WHATSAPP_LINK } from '../SocialMediaFloat'
import { experienceRoutes } from '@/lib/experienceRoutes'

const links = [[`عن ${brand.name}`, '/about'], ['البرامج', '/diploms'], ['المقررات', '/courses'], ['المجتمع', '/community']] as const

export function PublicBrandBoundary({ children }: { children: ReactNode }) {
  const path = usePathname()
  return isBrandedPublicRoute(path) ? <BrandScope className={styles.publicScope}>{children}</BrandScope> : <>{children}</>
}

export function PublicNavigation() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [logoutError, setLogoutError] = useState('')
  const menuButton = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  useEffect(() => { let active = true; getPublicSectionsSafe().then((data) => { if (active) setSections(data) }); return () => { active = false } }, [])
  useEffect(() => {
    const update = () => setUser(getCurrentUser())
    update()
    setHydrated(true)
    window.addEventListener('storage', update)
    window.addEventListener('auth-change', update)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('auth-change', update) }
  }, [path])
  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() }
    }
    const outside = (event: PointerEvent) => {
      if (open && !header.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', escape)
    window.addEventListener('pointerdown', outside)
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('pointerdown', outside) }
  }, [open])
  const destination = experienceRoutes.gateway
  return <header ref={header} id="public-top" className={styles.navigation} data-public-hydrated={hydrated}>
    <Link className={styles.navBrand} href="/" aria-label={`${brand.name} — الصفحة الرئيسية`}><BrandMark /></Link>
    <nav className={styles.desktopNav} aria-label="التنقل الرئيسي">
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
      {sections.length > 0 && <details className={styles.navDropdown}><summary>المجالات <ChevronDown size={15} aria-hidden="true"/></summary><div>{sections.map((section) => <Link key={section.id} href={`/diploms?section=${encodeURIComponent(section.slug)}`}>{section.name}</Link>)}</div></details>}
    </nav>
    <div className={styles.navTools}>
      <Link className={styles.navAction} href={destination} aria-label={user ? 'لوحة التحكم' : 'ادخل إلى المنصة'}><span>{user ? 'لوحة التحكم' : 'ادخل إلى المنصة'}</span><ArrowUpLeft size={18} aria-hidden="true"/></Link>
      {user && <button className={styles.logout} type="button" onClick={async () => { try { await signout(); setUser(null); setLogoutError('') } catch { setLogoutError('تعذر تسجيل الخروج. أعد المحاولة.') } }}>تسجيل الخروج</button>}
      <button ref={menuButton} className={styles.menuToggle} type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-mobile-navigation" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>{open ? <X/> : <Menu/>}</button>
    </div>
    {logoutError && <span className={styles.navError} role="alert">{logoutError}</span>}
    {open && <nav id="public-mobile-navigation" className={styles.mobileNav} aria-label="التنقل على الجوال" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setOpen(false) }}>
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><span>{label}</span><ArrowUpLeft size={18} aria-hidden="true"/></Link>)}
      {sections.map((section) => <Link key={section.id} href={`/diploms?section=${encodeURIComponent(section.slug)}`}>{section.name}<ArrowUpLeft size={18} aria-hidden="true"/></Link>)}
      <Link href="/search">البحث عن برنامج <ArrowUpLeft size={18} aria-hidden="true"/></Link>
      <Link href="/verify-certificate">التحقق من شهادة <ArrowUpLeft size={18} aria-hidden="true"/></Link>
      <Link className={styles.mobileNavAction} href={destination}>الدخول إلى المنصة <ArrowUpLeft size={18} aria-hidden="true"/></Link>
    </nav>}
  </header>
}

export function PublicFooter() {
  const [showBackTop, setShowBackTop] = useState(false)
  useEffect(() => {
    const update = () => setShowBackTop(window.scrollY > 300)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return <><footer className={styles.footer} id="footer">
    <div className={styles.footerTop}>
      <div className={styles.footerBrand}>
        <Link className={styles.footerLogo} href="/" aria-label={`${brand.name} — الصفحة الرئيسية`}><BrandMark/></Link>
        <p>من البرنامج الأول، إلى الإنجاز التالي.<br/>مساحة واحدة لإدارة التجربة التعليمية.</p>
        <a className={styles.footerContact} href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true"/><span>الدعم عبر واتساب</span><ArrowUpLeft size={17} aria-hidden="true"/></a>
      </div>
      <nav className={styles.footerLinks} aria-label="روابط المنصة">
        <span className={styles.footerGroupIcon} aria-hidden="true"><BookOpen size={23}/></span>
        {[[`عن ${brand.name}`, '/about'], ['المجتمع', '/community'], ['البرامج التعليمية', '/diploms']].map(([label, href]) => <Link key={href} href={href}><span>{label}</span><ArrowUpLeft size={16} aria-hidden="true"/></Link>)}
      </nav>
      <nav className={styles.footerLinks} aria-label="الشهادات والسياسات">
        <span className={styles.footerGroupIcon} aria-hidden="true"><ShieldCheck size={23}/></span>
        {[['التحقق من الشهادات', '/verify-certificate'], ['سياسة الخصوصية', '/privacy'], ['الشروط والأحكام', '/terms']].map(([label, href]) => <Link key={href} href={href}><span>{label}</span><ArrowUpLeft size={16} aria-hidden="true"/></Link>)}
      </nav>
    </div>
    <div className={styles.footerBottom}>
      <span>تصميم وتطوير شركة</span>
      <a className={styles.footerDeveloper} href="https://dwam-tech.com/" target="_blank" rel="noopener noreferrer" aria-label="شركة دوام — تصميم وتطوير"><Image src="/brand/02.webp" alt="دوام" width={76} height={76} unoptimized/></a>
    </div>
  </footer>
    {showBackTop && <button className={styles.floatingBackTop} type="button" aria-label="التمرير إلى أعلى الصفحة" title="إلى الأعلى" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={23} aria-hidden="true"/></button>}
  </>
}
