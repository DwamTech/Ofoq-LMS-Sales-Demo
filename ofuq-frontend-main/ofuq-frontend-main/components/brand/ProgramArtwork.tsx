'use client'
import { brand } from '@/lib/brand'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { isBrandedPublicRoute } from './publicRoutes'
import styles from './Showcase.module.css'
import { ProgramGraphic } from './ProgramGraphic'
import { artworkSubject } from './publicContent'

export function ProgramArtwork({ title, image, identity, className }: { title: string; image?: string; identity: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const path = usePathname()
  if (!isBrandedPublicRoute(path)) return <img src={image} alt={title} className={className}/>
  const tone = Array.from(identity).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 3
  const usable = image && !/banner\.jpg|logo\.(png|svg)|mahad_alofk/.test(image) && !failed
  return <div className={styles.artwork} data-tone={tone} data-subject={artworkSubject(title)}>
    {usable ? <img src={image} alt={title} loading="lazy" onError={() => setFailed(true)}/> : <><ProgramGraphic title={title} identity={identity}/><span>{brand.name} / LEARNING PROGRAM</span><strong>{title}</strong><small>{brand.name}</small></>}
  </div>
}
