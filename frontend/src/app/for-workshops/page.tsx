import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Printer, ScanSearch, Share2, Wrench } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata: Metadata = {
  title: 'For workshops: show customers what insurance will cover',
  description:
    'Build a repair estimate and show the customer, line by line, what their car insurer is likely to pay and what they will pay. Print it or share it. Fewer surprises at handover.',
  alternates: { canonical: '/for-workshops' },
};

export default function ForWorkshopsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-steel-700">For workshops</p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl">No more “why is my share so high?” at handover.</h1>
            <p className="text-lg leading-relaxed text-navy-600">
              Customers expect insurance to pay the whole bill. Show them upfront, line by line, what their insurer is likely to cover after depreciation and deductible, and what they will pay.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login?next=%2Forg%2Fworkshop" className="vs-btn-primary px-6 py-3.5 text-base">Open the workshop workspace <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/xray" className="vs-btn-secondary px-6 py-3.5 text-base">Try the X-ray</Link>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: Wrench, title: 'Build the estimate', body: 'Parts with their material, plus labour and paint.' },
              { icon: ScanSearch, title: 'X-ray it live', body: 'Insurer vs customer share per line, with the biggest costs flagged.' },
              { icon: Printer, title: 'Print or share', body: 'A clean, branded summary for the counter or WhatsApp.' },
            ].map((x) => (
              <div key={x.title} className="vs-surface flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-steel-50 text-steel-700"><x.icon className="h-5 w-5" /></span>
                <span><span className="block font-semibold text-navy-900">{x.title}</span><span className="text-sm text-navy-600">{x.body}</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-navy-100 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-semibold text-navy-950">Why workshops use it</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Customers decide faster when they see their real share upfront',
                'Suggest repair over replacement where it saves the customer money',
                'Customers can share their car’s history with you, time-limited, for faster estimates',
                'Free to use; nothing is sent to insurers on your behalf',
              ].map((t) => (
                <li key={t} className="flex gap-3 rounded-2xl border border-navy-100 p-4 text-navy-700"><Check className="mt-0.5 h-5 w-5 shrink-0 text-gain" /> {t}</li>
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-2 text-sm text-navy-500"><Share2 className="h-4 w-4" /> Estimates follow the standard depreciation schedule; the insurer’s surveyor makes the final assessment.</p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
