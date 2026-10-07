import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/course-details.css'
import '@/styles/home-header.css'
import '@/styles/course-cards.css'
import '@/styles/hero-search-section.css'
import '@/styles/students-management.css'
import '@/styles/toast.css'
import 'react-phone-number-input/style.css'
import DemoReadOnlyNotice from '@/components/DemoReadOnlyNotice'

const SITE_TITLE = 'منصة أفق للتعليم والتدريب';
const SITE_DESCRIPTION =
  'منصة أفق للتعليم والتدريب تقدّم دبلومات احترافية تجمع بين الأصالة والمعاصرة بمنهج متكامل يدمج العلوم الشرعية، التربوية، التقنية والإعلامية لإعداد قيادات مؤثرة في المجتمع.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    'منصة أفق',
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
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  themeColor: '#0e7490',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
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
        {children}
        <DemoReadOnlyNotice />
      </body>
    </html>
  )
}
