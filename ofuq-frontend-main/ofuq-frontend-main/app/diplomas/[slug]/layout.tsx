import type { Metadata } from 'next';
import { getPublicDiplomaDetails } from '@/utils/categoryService';

const SITE_TITLE = 'منصة أفق للتعليم والتدريب';

function trimDescription(text?: string, max = 180): string {
  if (!text) return 'دبلومات احترافية تجمع بين الأصالة والمعاصرة بمنهج متكامل يدمج المعرفة والمهارات التطبيقية.';
  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1) + '…' : cleaned;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const diploma = await getPublicDiplomaDetails(params.slug);
    const description = trimDescription(diploma?.description);
    const image = diploma?.cover_image_url || '/logo.png';

    return {
      title: SITE_TITLE,
      description,
      alternates: { canonical: `/diplomas/${params.slug}` },
      openGraph: {
        type: 'article',
        locale: 'ar',
        url: `/diplomas/${params.slug}`,
        title: SITE_TITLE,
        description,
        images: [{ url: image }],
        siteName: SITE_TITLE,
      },
      twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description,
        images: [image],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    const description = trimDescription();
    return {
      title: SITE_TITLE,
      description,
      alternates: { canonical: `/diplomas/${params.slug}` },
      robots: { index: true, follow: true },
    };
  }
}

export default function DiplomaSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}