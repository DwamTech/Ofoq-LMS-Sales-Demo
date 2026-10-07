import type { MetadataRoute } from 'next';
import { getPublicDiplomas } from '../utils/categoryService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const host = base && /^https?:\/\//.test(base) ? base.replace(/\/$/, '') : undefined;
  const now = new Date();

  const prefix = host ?? '';

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${prefix}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${prefix}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${prefix}/diploms`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    const diplomas = await getPublicDiplomas();
    const diplomaEntries: MetadataRoute.Sitemap = diplomas.map((d) => ({
      url: `${prefix}/diplomas/${d.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
    return [...staticEntries, ...diplomaEntries];
  } catch {
    return staticEntries;
  }
}