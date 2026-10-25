import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { XRayPlayground } from '@/components/xray/XRayPlayground';
import { PageHero } from '@/components/public/PageHero';

export const metadata: Metadata = {
  title: 'Repair-quote X-ray: what your insurer pays vs what you pay',
  description:
    'Paste your workshop’s repair quote and see, line by line, how much your car insurer would pay and how much you would pay after depreciation and deductible. Free, instant, no sign-up.',
  alternates: { canonical: '/xray' },
};

export default function XRayPage() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicNavbar tone="dark" />
      <PageHero
        compact
        eyebrow="Repair-quote X-ray"
        title="See exactly what you’ll pay"
        accent="on a repair quote."
        body="Insurers don’t pay the full price of replaced parts. Each line loses value depending on the material and your car’s age. The X-ray shows the split line by line, and where you could pay less."
      />
      <main className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 pb-24">
        <XRayPlayground />
      </main>
      <PublicFooter />
    </div>
  );
}
