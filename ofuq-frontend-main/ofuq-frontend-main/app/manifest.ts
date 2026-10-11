import type { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return { name: brand.name, short_name: brand.name, description: brand.description, lang: 'ar', dir: 'rtl', start_url: '/', display: 'standalone', background_color: brand.colors.ivory, theme_color: brand.colors.ink, icons: [{ src: '/brand/mansatak-app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/brand/mansatak-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/brand/mansatak-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }
}
