import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

/** Keeps signed-in areas (vehicles, claims, documents, organisations) out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/vehicles', '/decision', '/verification', '/reports', '/settings', '/onboarding', '/org', '/login'],
      },
    ],
    sitemap: `${BRAND.siteUrl}/sitemap.xml`,
    host: BRAND.siteUrl,
  };
}
