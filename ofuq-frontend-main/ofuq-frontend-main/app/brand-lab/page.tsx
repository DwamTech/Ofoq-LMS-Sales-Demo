import { brand } from '@/lib/brand'
import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import { BrandScope } from '@/components/brand/BrandPrimitives'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ProductExplorer } from '@/components/brand/ShowcaseMotion'
import { getPublicDiplomas } from '@/utils/categoryService'
import styles from '@/components/brand/Showcase.module.css'

export const dynamic = 'force-dynamic'
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f4ed' }

export default async function BrandLabPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  const programs = await getPublicDiplomas().catch(() => [])
  return <BrandScope className={styles.publicScope}>
    <section className={styles.section}>
      <span className={styles.eyebrow}>مختبر الهوية · للتطوير فقط</span>
      <h1 className={styles.capabilityTitle}>{brand.name}</h1>
      <p>الشعار المصوّر المعتمد: رمز ميم بنفسجي، كتابة عربية محفوظة من الأصل، ونسخ واضحة للأسطح الفاتحة والداكنة.</p>
      <div className={styles.programGrid}>
        <div className={styles.programCover} style={{ background: brand.colors.ivory }}><BrandLogo theme="light"/><BrandLogo variant="compact" theme="light"/><BrandLogo variant="icon" theme="light"/></div>
        <div className={styles.programCover} style={{ background: brand.colors.ink }}><BrandLogo theme="dark"/><BrandLogo variant="compact" theme="dark"/><BrandLogo variant="icon" theme="dark"/></div>
        <div className={styles.programCover} style={{ background: '#fff' }}><BrandLogo theme="mono"/><BrandLogo variant="compact" theme="mono"/><BrandLogo variant="icon" theme="mono"/></div>
      </div>
    </section>
    <section className={styles.section}>
      <span className={styles.eyebrow}>Alexandria + IBM Plex Sans Arabic</span>
      <h2 className={styles.capabilityTitle}>نظام الهوية البصرية والتطبيقات الرقمية</h2>
      <p>خطوط محلية، تشكيل عربي طبيعي، وفصل واضح بين العناوين والمحتوى. شعار بلا اعتماد على خطوط الجهاز.</p>
    </section>
    <section className={styles.section}><ProductExplorer programs={programs}/></section>
  </BrandScope>
}
