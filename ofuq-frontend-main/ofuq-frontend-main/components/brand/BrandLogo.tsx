import type { CSSProperties } from 'react'
import Image from 'next/image'
import { brand } from '@/lib/brand'
import styles from './BrandLogo.module.css'

type LogoProps = {
  variant?: 'primary' | 'compact' | 'icon'
  theme?: 'auto' | 'light' | 'dark' | 'mono'
  className?: string
  decorative?: boolean
}

/** Approved raster, never re-typeset or misrepresented as vectors.
 * Alpha masks theme the wordmark and diamond without changing their shapes.
 * Fixed crops/aspect ratios remove source padding without causing layout shift. */
export function BrandLogo({ variant = 'primary', theme = 'auto', className, decorative = false }: LogoProps) {
  const source = { '--brand-logo-source': `url("${brand.assets.master}")` } as CSSProperties
  return <span className={[styles.logo, styles[variant], styles[theme], className].filter(Boolean).join(' ')} style={source} data-brand-logo={variant} data-brand-logo-theme={theme} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : brand.name} aria-hidden={decorative || undefined}>
    <span className={styles.canvas} aria-hidden="true">
      <Image src={brand.assets.master} width={1958} height={803} unoptimized loading="eager" alt="" draggable={false} className={styles.artwork}/>
      <span className={styles.wordTone}/>
      <span className={styles.accentTone}/>
    </span>
  </span>
}
