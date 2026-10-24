import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { XRayPlayground } from '@/components/xray/XRayPlayground';

export const metadata: Metadata = {
  title: 'Repair-quote X-ray: what your insurer pays vs what you pay',
  description:
    'Paste your workshop’s repair quote and see, line by line, how much your car insurer would pay and how much you would pay after depreciation and deductible. Free, instant, no sign-up.',
  alternates: { canonical: '/xray' },
};

export default function XRayPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-steel-700">Repair-quote X-ray</p>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-950 sm:text-5xl">See exactly what you’ll pay on a repair quote.</h1>
          <p className="text-lg text-navy-600">
            Insurers don’t pay the full price of replaced parts. Each line of your quote loses value depending on the material and your car’s age.
            The X-ray shows the split line by line, and where you could pay less.
          </p>
        </header>
        <XRayPlayground />
      </main>
      <PublicFooter />
    </div>
  );
}
