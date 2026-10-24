import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FileSpreadsheet, Layers, Share2, Truck } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { Reveal } from '@/components/home/fx';

export const metadata: Metadata = {
  title: 'Fleet claim triage: decide which vehicle damage to claim',
  description:
    'For taxi, delivery and corporate fleets in India: log incidents across vehicles and get the claim-or-pay plan with the lowest total cost, including No-Claim Bonus and downtime.',
  alternates: { canonical: '/for-fleets' },
};

const STEPS = [
  { icon: Truck, title: 'Add your vehicles', body: 'Registration, IDV, NCB and renewal premium for each vehicle. Daily downtime cost is optional.' },
  { icon: FileSpreadsheet, title: 'Log incidents', body: 'Type them in or import a CSV from your maintenance log: vehicle, quote amount, material, days off road.' },
  { icon: Layers, title: 'Get the cheapest plan', body: 'ClearClaim tests every claim/pay combination per vehicle and shows the plan with the lowest total cost.' },
];

const FEATURES = [
  'Instant: every decision is calculated on your device, so 50 incidents update as you type',
  'Plain reasons for every decision, ready to share with finance',
  'CSV import and export that fits existing maintenance logs',
  'Downtime cost shown alongside, from your own daily figure (never assumed)',
  'Save decisions as records with a tamper-evident fingerprint',
  'Share a vehicle’s history with a workshop or insurer, time-limited and revocable',
];

function Insight() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">The insight most fleets miss</p>
      <p className="mt-4 font-display text-2xl font-medium leading-snug tracking-tight">
        No-Claim Bonus is lost <span className="text-signal">once per vehicle</span>, however many claims you make on it.
      </p>
      <div className="mt-6 space-y-2 font-mono text-[13px]">
        <div className="flex justify-between rounded-xl bg-white/[0.05] px-3 py-2.5"><span className="text-white/70">Cab 07 · front-end repair</span><span className="text-signal">claim</span></div>
        <div className="flex justify-between rounded-xl bg-white/[0.05] px-3 py-2.5"><span className="text-white/70">Cab 07 · bumper scrape</span><span className="text-signal">claim too: no extra NCB cost</span></div>
        <div className="flex justify-between rounded-xl bg-white/[0.05] px-3 py-2.5"><span className="text-white/70">Cab 12 · bumper scrape</span><span className="text-ember">pay directly</span></div>
      </div>
      <p className="mt-5 text-sm text-white/50">Triage finds these combinations automatically, vehicle by vehicle.</p>
    </div>
  );
}

export default function ForFleetsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          eyebrow="For fleets"
          title="Stop guessing which damage"
          accent="to claim."
          body="Claiming every dent quietly wipes out No-Claim Bonus on vehicle after vehicle. Claiming nothing leaves money on the table. ClearClaim decides incident by incident, for the whole fleet at once."
          actions={
            <>
              <Link href="/login?next=%2Forg%2Ffleet" className="vs-btn-signal">Open the fleet workspace <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/learn/fleet-triage" className="vs-btn-ghost-dark">How triage works</Link>
            </>
          }
          aside={<Insight />}
        />

        <section className="bg-[#f6f5f0] px-5 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="text-sm font-semibold text-steel-700">How it works</p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">From maintenance log to claim plan in minutes.</h2>
            </Reveal>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="group h-full rounded-[28px] bg-white p-8 ring-1 ring-navy-100 transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(10,16,34,0.35)]">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-6xl font-semibold tracking-tight text-navy-100 transition group-hover:text-signal-600">0{i + 1}</span>
                      <s.icon className="h-6 w-6 text-navy-400" />
                    </div>
                    <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight text-navy-950">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-navy-500">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-24 lg:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <p className="text-sm font-semibold text-steel-700">For operations teams</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">Fast enough for the daily stand-up.</h2>
              <p className="mt-6 flex items-start gap-2 text-sm text-navy-500"><Share2 className="mt-0.5 h-4 w-4 shrink-0" /> ClearClaim is independent and never files claims. Your insurer and surveyor decide settlements.</p>
            </Reveal>
            <ul className="border-t border-navy-100">
              {FEATURES.map((t, i) => (
                <Reveal key={t} delay={i * 0.04}>
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
