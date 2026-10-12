import { brand } from "@/lib/brand";
export default function Head() {
  const description =
    "اكتشف دبلومات ومنهجيات تدريبية متوازنة تجمع التعلم بالممارسة والتعلم المدمج والمشروعات التطبيقية، مع مدربين خبراء وتقنيات حديثة لرحلة تعليمية فعالة.";
  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href="/" />
      <meta name="og:locale" content="ar" />
      <script
        type="application/ld+json"
        // منظمة + موقع لصفحة المنزل
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: brand.name,
            url: "/",
            logo: "/logo.png",
            sameAs: [],
          }),
        }}
      />
    </>
  );
}
