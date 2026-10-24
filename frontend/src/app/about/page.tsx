import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { Reveal } from '@/components/home/fx';
import { BRAND } from '@/lib/brand';

const PRINCIPLES = [
  {
    n: '01',
    title: 'Rules, not guesses',
    body: 'Every rupee is worked out with fixed rules: the standard depreciation schedule for parts, your deductible, the No-Claim Bonus slabs and your IDV. Same inputs, same answer, every time. No AI decides your numbers.',
  },
  {
    n: '02',
    title: 'Show the working',
    body: 'Each result breaks down line by line, so you can check it against your policy or show it to a workshop. If a number came from a PDF, it says which page. If you changed it, it says so.',
  },
  {
    n: '03',
    title: 'Your data stays yours',
    body: 'Nobody sees your records unless you share them, and sharing is time-limited and can be taken back. You can download everything we hold, or ask us to delete it.',
  },
  {
    n: '04',
    title: 'Honest about limits',
    body: 'ClearClaim is not an insurer, does not file or decide claims, and is not connected to insurer systems or VAHAN. Where something is an estimate or a sample, the screen says so.',
  },
];

const BUILT = [
  ['Calculations', 'A deterministic engine that runs in your browser and on our server. 305 test cases check that both give identical answers.'],
  ['Saved records', 'Each saved check gets a SHA-256 fingerprint. When a ledger is connected, the fingerprint is anchored on a Hyperledger Fabric network, so later edits can be detected. The status page shows whether a ledger is connected right now.'],
  ['Reading PDFs', 'Text-based policy schedules and estimates are read with fixed rules. The file is processed and not kept. Photographed or scanned pages can’t be read yet.'],
  ['Hosting', 'Website on Vercel, server on Render (Singapore), database and sign-in on Supabase.'],
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          compact
          eyebrow="About"
          title="Know the numbers"
          accent="before you call anyone."
          body="A small car insurance claim can quietly cost more than the repair, once you lose your No-Claim Bonus. ClearClaim exists so car owners, fleets and workshops in India can see that clearly, in plain language, before deciding."
        />

        <section className="bg-[#f6f5f0] px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="text-sm font-semibold text-steel-700">How we work</p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">Four rules we don’t bend.</h2>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.n} delay={i * 0.06}>
                  <div className="h-full rounded-[28px] bg-white p-8 ring-1 ring-navy-100">
                    <span className="font-display text-5xl font-semibold text-navy-100">{p.n}</span>
                    <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-navy-950">{p.title}</h3>
                    <p className="mt-2 leading-relaxed text-navy-500">{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-is-built" className="scroll-mt-24 bg-white px-5 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <p className="text-sm font-semibold text-steel-700">Under the hood</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">How it is built.</h2>
              <p className="mt-5 text-navy-500">The short version, without the buzzwords.</p>
            </Reveal>
            <dl className="border-t border-navy-100">
              {BUILT.map(([k, v], i) => (
                <Reveal key={k} delay={i * 0.05}>
                  <div className="grid gap-2 border-b border-navy-100 py-6 sm:grid-cols-[160px_1fr]">
                    <dt className="font-display text-lg font-semibold text-navy-950">{k}</dt>
                    <dd className="leading-relaxed text-navy-600">{v}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <section className="px-3 pb-3">
          <div className="vs-grain relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[40px] bg-navy-950 px-8 py-14 text-white sm:flex-row sm:items-center sm:px-14">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Questions, or found a mistake?</h2>
              <p className="mt-2 text-white/60">We read every message. <a href={`mailto:${BRAND.contactEmail}`} className="text-white underline-offset-2 hover:underline">{BRAND.contactEmail}</a></p>
            </div>
            <Link href="/decision" className="vs-btn-signal shrink-0">Try a claim check <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
