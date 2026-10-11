/** Public identity only. API contracts, namespaces and historic records stay stable. */
export const brand = Object.freeze({
  name: 'منصتك التعليمية',
  description: 'منصة عربية متكاملة للأكاديميات والجهات التدريبية، تربط البرامج والتعلّم والتقييم والشهادات في تجربة واحدة.',
  colors: {
    ink: '#29233B',
    purple: '#635080',
    ivory: '#F6F4ED',
    paper: '#FFFDF7',
    lime: '#D8EF73',
    copper: '#AA7451',
  },
  assets: {
    master: '/brand/mansatak-approved.png',
    primary: '/brand/mansatak-approved-horizontal-light.png',
    compact: '/brand/mansatak-approved-horizontal-light.png',
    icon: '/brand/mansatak-approved-icon-light.png',
    social: '/brand/mansatak-social.png',
    openGraph: '/brand/mansatak-og.png',
  },
})

/** Presentation-only aliasing. Never changes stored users, IDs, routes or certificates. */
export function publicBrandText(value: string): string {
  if (/^Ofoq Demo Admin$/i.test(value)) return 'حساب عرض الإدارة'
  return value.replace(/\b(?:OFOQ|OFUQ)\b(?!-[A-Z]-\d)|(?<![\u0600-\u06ff])(?:أُفُق|أفق|الأفق|افق)(?![\u0600-\u06ff])/gi, brand.name)
}
