export const metadata = {
  title: 'منصة أفق للتعليم عن بعد',
  description: 'تسجيل الدخول إلى منصة أفق للتعليم عن بعد',
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