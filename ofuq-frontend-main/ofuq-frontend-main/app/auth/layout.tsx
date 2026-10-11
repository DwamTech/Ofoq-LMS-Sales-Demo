import { brand } from '@/lib/brand'
export const metadata = {
  title: brand.name,
  description: `تسجيل الدخول إلى ${brand.name}`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
