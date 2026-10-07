export default function Head() {
  const description =
    'استكشف دبلومات أفق: برامج احترافية تجمع الأصالة والمعاصرة في الإعلام والعلوم الشرعية والتقنية، بتعلم بالممارسة ومشروعات تطبيقية ومرونة في التحديث.';
  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href="/diploms" />
      <meta name="og:locale" content="ar" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'دبلومات منصة أفق',
            description,
            url: '/diploms',
          }),
        }}
      />
    </>
  );
}