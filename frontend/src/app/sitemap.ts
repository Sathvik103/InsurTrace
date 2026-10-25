import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';
import { KNOWLEDGE } from '@/content/assistantKnowledge';

/** Public, indexable pages only. Signed-in app pages are excluded (see robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = BRAND.siteUrl;
  const now = new Date();
  const pages: { path: string; priority: number; freq: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1, freq: 'weekly' },
    { path: '/xray', priority: 0.9, freq: 'monthly' },
    { path: '/for-fleets', priority: 0.8, freq: 'monthly' },
    { path: '/for-workshops', priority: 0.8, freq: 'monthly' },
    { path: '/learn', priority: 0.8, freq: 'monthly' },
    { path: '/about', priority: 0.4, freq: 'yearly' },
    { path: '/system', priority: 0.5, freq: 'monthly' },
    { path: '/security', priority: 0.4, freq: 'yearly' },
    { path: '/contact', priority: 0.3, freq: 'yearly' },
    { path: '/privacy', priority: 0.2, freq: 'yearly' },
    { path: '/terms', priority: 0.2, freq: 'yearly' },
    { path: '/disclaimer', priority: 0.2, freq: 'yearly' },
  ];
  return [
    ...pages.map((p) => ({ url: `${base}${p.path}`, lastModified: now, changeFrequency: p.freq, priority: p.priority })),
    ...KNOWLEDGE.map((k) => ({ url: `${base}/learn/${k.id}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
