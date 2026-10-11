import localFont from 'next/font/local'

/**
 * Local, OFL-licensed brand fonts. They intentionally live on BrandScope so
 * authentication, student, and admin experiences keep their existing type.
 */
export const ofoqDisplayFont = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/alexandria/files/alexandria-arabic-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-ofq-display',
  display: 'swap',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
  preload: true,
})

export const ofoqUiFont = localFont({
  src: [
    { path: '../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-ofq-ui',
  display: 'swap',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
  preload: true,
})
