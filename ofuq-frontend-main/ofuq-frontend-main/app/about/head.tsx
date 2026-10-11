import { brand } from '@/lib/brand'
export default function Head() {
  const description =
    `${brand.name}: مؤسسة تعليمية رائدة تقدّم برامج دبلوم نوعية بمنهج متكامل يجمع العلوم الشرعية والتربوية والتقنية والإعلامية لإعداد كفاءات مؤثرة وفاعلة.`;
  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href="/about" />
      <meta name="og:locale" content="ar" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `عن ${brand.name}`,
            description,
            url: '/about',
            mainEntity: {
              '@type': 'Organization',
              name: brand.name,
              url: '/',
              logo: '/logo.png',
            },
          }),
        }}
      />
    </>
  );
}
