import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const host = base && /^https?:\/\//.test(base) ? base.replace(/\/$/, '') : undefined;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: host ? `${host}/sitemap.xml` : '/sitemap.xml',
    host,
  };
}