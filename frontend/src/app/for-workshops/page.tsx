import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Printer, ScanSearch, Share2, Wrench } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { Reveal } from '@/components/home/fx';

export const metadata: Metadata = {
  title: 'For workshops: show customers what insurance will cover',
  description:
    'Build a repair estimate and show the customer, line by line, what their car insurer is likely to pay and what they will pay. Print it or share it. Fewer surprises at handover.',
  alternates: { canonical: '/for-workshops' },
};

const FLOW = [
  { icon: Wrench, title: 'Build the estimate', body: 'Parts with their material, plus labour and paint.' },
  { icon: ScanSearch, title: 'X-ray it live', body: 'Insurer vs customer share per line, with the biggest costs flagged.' },
  { icon: Printer, title: 'Print or share', body: 'A clean summary for the counter or WhatsApp.' },
];

const WHY = [
  'Customers decide faster when they see their real share upfront',
  'Suggest repair over replacement where it saves the customer money',
  'Customers can share their car’s history with you, time-limited, for faster estimates',
  'Free to use; nothing is sent to insurers on your behalf',
];

function Flow() {
  return (
    <ol className="space-y-3">
      {FLOW.map((x, i) => (
        <li key={x.title} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-signal text-navy-950"><x.icon className="h-5 w-5" /></span>
          <span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Step 0{i + 1}</span>
            <span className="mt-0.5 block font-display text-xl font-semibold tracking-tight">{x.title}</span>
            <span className="text-sm text-white/55">{x.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function ForWorkshopsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          eyebrow="For workshops"
          title="No more “why is my share so high?”"
          accent="at handover."
          body="Customers expect insurance to pay the whole bill. Show them upfront, line by line, what their insurer is likely to cover after depreciation and deductible, and what they will pay."
          actions={
            <>
              <Link href="/login?next=%2Forg%2Fworkshop" className="vs-btn-signal">Open the workshop workspace <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/xray" className="vs-btn-ghost-dark">Try the X-ray</Link>
            </>
          }
          aside={<Flow />}
        />

        <section className="bg-white px-5 py-24 lg:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <p className="text-sm font-semibold text-steel-700">Why workshops use it</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">Fewer arguments at the counter.</h2>
              <p className="mt-6 flex items-start gap-2 text-sm text-navy-500"><Share2 className="mt-0.5 h-4 w-4 shrink-0" /> Estimates follow the standard depreciation schedule; the insurer’s surveyor makes the final assessment.</p>
            </Reveal>
            <ul className="border-t border-navy-100">
              {WHY.map((t, i) => (
                <Reveal key={t} delay={i * 0.05}>
                  <li className="flex gap-4 border-b border-navy-100 py-5 text-lg text-navy-800">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-signal-700" /> {t}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
