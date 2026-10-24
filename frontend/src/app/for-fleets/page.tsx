import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FileSpreadsheet, Layers, Share2, Truck } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';

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

export default function ForFleetsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-steel-700">For fleets</p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-navy-950 sm:text-5xl">Stop guessing which damage to claim across your fleet.</h1>
            <p className="text-lg leading-relaxed text-navy-600">
              Claiming every dent quietly wipes out No-Claim Bonus on vehicle after vehicle. Claiming nothing leaves money on the table. ClearClaim decides incident by incident, for the whole fleet at once.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login?next=%2Forg%2Ffleet" className="vs-btn-primary px-6 py-3.5 text-base">Open the fleet workspace <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/learn/fleet-triage" className="vs-btn-secondary px-6 py-3.5 text-base">How triage works</Link>
            </div>
          </div>
          <div className="vs-surface space-y-4 p-6">
            <p className="text-sm font-semibold text-navy-900">The insight most fleets miss</p>
            <p className="text-navy-600">
              NCB is lost <strong>once per vehicle</strong>, however many claims you make on it. If a ₹90,000 front-end repair on a cab is already worth claiming, the ₹6,000 bumper scrape on the <em>same</em> cab should be claimed too, because it costs no extra NCB. Claimed alone, that scrape would cost more in lost NCB than it pays out.
            </p>
            <p className="rounded-2xl bg-gain-soft px-4 py-3 text-sm text-gain">Triage finds these combinations automatically, vehicle by vehicle.</p>
          </div>
        </section>

        <section className="border-y border-navy-100 bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-[28px] border border-navy-100 bg-gradient-to-b from-navy-50/60 to-white p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white"><s.icon className="h-5 w-5" /></span>
                <p className="mt-5 text-xs font-semibold text-navy-400">STEP {i + 1}</p>
                <h2 className="mt-1 text-xl font-semibold text-navy-900">{s.title}</h2>
                <p className="mt-2 text-navy-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-navy-950">Built for operations teams</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Instant: every decision is calculated on your device, so 50 incidents update as you type',
              'Plain reasons for every decision, ready to share with finance',
              'CSV import and export that fits existing maintenance logs',
              'Downtime cost shown alongside, from your own daily figure (never assumed)',
              'Save decisions as records with a tamper-evident fingerprint',
              'Share a vehicle’s history with a workshop or insurer, time-limited and revocable',
            ].map((t) => (
              <li key={t} className="flex gap-3 rounded-2xl border border-navy-100 bg-white p-4 text-navy-700"><Check className="mt-0.5 h-5 w-5 shrink-0 text-gain" /> {t}</li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-sm text-navy-500"><Share2 className="h-4 w-4" /> ClearClaim is independent and never files claims. Your insurer and surveyor decide settlements.</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
