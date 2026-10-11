'use client'
import { brand } from '@/lib/brand'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpLeft, Menu, X } from 'lucide-react'
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
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])
  const destination = experienceRoutes.gateway
  return <header id="public-top" className={styles.navigation} data-public-hydrated={hydrated}>
    <Link href="/" aria-label={`${brand.name} — الصفحة الرئيسية`}><BrandMark /></Link>
    <nav className={styles.desktopNav} aria-label="التنقل الرئيسي">{links.map(([label, href]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}{sections.length > 0 && <details className={styles.navDropdown}><summary>المجالات ↓</summary><div>{sections.map((section) => <Link key={section.id} href={`/diploms?section=${encodeURIComponent(section.slug)}`}>{section.name}</Link>)}</div></details>}</nav>
    <Link className={styles.navAction} href={destination}>{user ? 'لوحة التحكم' : 'ادخل إلى المنصة'}<ArrowUpLeft size={17}/></Link>
    {user && <button className={styles.logout} type="button" onClick={async () => { try { await signout(); setUser(null); setLogoutError('') } catch { setLogoutError('تعذر تسجيل الخروج. أعد المحاولة.') } }}>تسجيل الخروج</button>}
    {logoutError && <span role="alert">{logoutError}</span>}
    <button className={styles.menuToggle} type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-mobile-navigation" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}>{open ? <X/> : <Menu/>}</button>
    {open && <nav id="public-mobile-navigation" className={styles.mobileNav} aria-label="التنقل على الجوال">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}{sections.map((section) => <Link key={section.id} href={`/diploms?section=${encodeURIComponent(section.slug)}`}>{section.name}</Link>)}<Link href="/search">البحث عن برنامج</Link><Link href="/verify-certificate">التحقق من شهادة</Link><Link href={destination}>الدخول إلى المنصة <ArrowUpLeft size={18}/></Link></nav>}
  </header>
}

export function PublicFooter() {
  return <footer className={styles.footer}><div className={styles.footerTop}><Link href="/"><BrandMark/></Link><p>من البرنامج الأول، إلى الإنجاز التالي.<br/>مساحة واحدة لإدارة التجربة التعليمية.</p><div><a className={styles.footerContact} href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">الدعم عبر واتساب ↗</a><Link href="/about">عن {brand.name}</Link><Link href="/community">المجتمع</Link><Link href="/diploms">البرامج التعليمية</Link></div><div><Link href="/verify-certificate">التحقق من الشهادات</Link><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link></div></div><div className={styles.footerBottom}><span>{brand.name} © {new Date().getFullYear()}</span><span dir="ltr">التجربة التعليمية</span><a href="#public-top">إلى الأعلى ↑</a></div></footer>
}
