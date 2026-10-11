import { brand } from '@/lib/brand'
import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import '@/styles/course-details.css'
import '@/styles/home-header.css'
import '@/styles/course-cards.css'
import '@/styles/hero-search-section.css'
import '@/styles/students-management.css'
import '@/styles/toast.css'
import 'react-phone-number-input/style.css'
import DemoReadOnlyNotice from '@/components/DemoReadOnlyNotice'
import { PublicBrandBoundary } from '@/components/brand/PublicShell'

const SITE_TITLE = brand.name;
const SITE_DESCRIPTION = brand.description;

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, themeColor: brand.colors.ink };

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: brand.name,
  manifest: '/manifest.webmanifest',
  keywords: [
    brand.name,
    'التعليم والتدريب',
    'دبلومات احترافية',
    'تعليم عن بعد',
    'علوم شرعية',
    'إعلام',
    'تقنية',
    'ذكاء اصطناعي',
    'تأهيل الدعاة',
    'رعاية الموهوبين',
    'إشراف تربوي',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar',
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    images: [{ url: brand.assets.openGraph, width: 1200, height: 630, alt: brand.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [brand.assets.openGraph],
  },
  icons: {
    icon: [{ url: '/favicon.png', sizes: '64x64', type: 'image/png' }, { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' }],
    apple: [{ url: '/brand/mansatak-apple-touch.png', sizes: '180x180' }],
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <PublicBrandBoundary>{children}</PublicBrandBoundary>
        <DemoReadOnlyNotice />
      </body>
    </html>
  )
}
