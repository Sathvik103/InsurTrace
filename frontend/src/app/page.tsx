'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Car, Fingerprint, MessageCircleQuestion, Plus, Scale, Truck, Wrench } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { QuickCheck } from '@/components/home/QuickCheck';
import { Hero } from '@/components/home/Hero';
import { CountUp, EASE, Reveal, SplitWords, Spotlight } from '@/components/home/fx';
import { useAssistant } from '@/context/AssistantContext';
import { useAuth } from '@/context/AuthContext';
import { KNOWLEDGE } from '@/content/assistantKnowledge';
import { NCB_STEPS, rupees } from '@/lib/claimCheck';
import { calculateDecision, RULE_VERSION } from '@/lib/engine';

/* ---------------------------------------------------------------- worked example */
// A fictional example run through the real engine, so every figure below is exact.
const EXAMPLE = calculateDecision({
  vehicle: { age_years: 3 },
  policy: { idv: 600000, deductible: 1000, ncb_percentage: 35, zero_depreciation_addon: false, rule_version: RULE_VERSION },
  repair_items: [{ category: 'plastic', cost: 12000 }],
  estimated_base_premium_next_year: 18000,
});

function Example() {
  const claimNow = EXAMPLE.immediate_out_of_pocket;
  const bonus = EXAMPLE.future_ncb_impact;
  const claimTotal = EXAMPLE.effective_claim_cost;
  const payTotal = EXAMPLE.self_pay_cost;
  const max = Math.max(claimTotal, payTotal);
  return (
    <section className="bg-[#f6f5f0] px-5 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="text-sm font-semibold text-steel-700">Why it matters</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">A ₹12,000 bumper can cost more to claim.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-500">
            Insurers deduct 50% on plastic parts, you pay the deductible, and the claim resets your No-Claim Bonus at renewal. Add it up and paying the workshop yourself is often cheaper.
          </p>
          <p className="mt-4 text-sm text-navy-400">Example: 3-year-old car, 35% No-Claim Bonus, ₹18,000 renewal premium.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[28px] bg-white p-7 ring-1 ring-navy-100 sm:p-9">
            {[
              { label: 'If you claim', total: claimTotal, lines: [['You pay the workshop', claimNow], ['Bonus lost at renewal', bonus]] as [string, number][], win: claimTotal < payTotal },
              { label: 'If you pay yourself', total: payTotal, lines: [['Full repair bill', payTotal]] as [string, number][], win: payTotal <= claimTotal },
            ].map((o) => (
              <div key={o.label} className="border-b border-navy-100 py-6 first:pt-0 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium text-navy-700">{o.label}</p>
                  <p className={`tabular font-display text-3xl font-semibold tracking-tight ${o.win ? 'text-navy-950' : 'text-navy-400'}`}>{rupees(o.total)}</p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-50">
                  <motion.div className={`h-full rounded-full ${o.win ? 'bg-signal-600' : 'bg-navy-300'}`} initial={{ width: 0 }} whileInView={{ width: `${(o.total / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }} />
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  {o.lines.map(([k, v]) => (
                    <div key={k} className="flex justify-between text-navy-500">
                      <dt>{k}</dt>
                      <dd className="tabular">{rupees(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <p className="mt-6 rounded-2xl bg-navy-950 px-4 py-3 text-sm text-white">
              Paying yourself saves about <span className="font-semibold text-signal">{rupees(Math.abs(claimTotal - payTotal))}</span> here. Your own numbers may say the opposite, which is why we check.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
/* ---------------------------------------------------------------- steps */
const STEPS = [
  { icon: Car, title: 'Pick your car', body: 'A saved car, or just the year it was made. Age decides how much insurers knock off metal parts.' },
  { icon: Wrench, title: 'Tap what’s damaged', body: 'Point at the bumper, door or windshield on a diagram and type the workshop’s quote. Or upload the PDF.' },
  { icon: Scale, title: 'Get a straight answer', body: 'What the insurer pays, what you pay, the bonus you’d lose, and which choice costs less over three years.' },
];

function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white px-5 py-28 lg:py-36">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-sm font-semibold text-steel-700">How it works</p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-navy-950 sm:text-6xl">
            <SplitWords text="Three taps." inView />
            <br />
            <SplitWords text="One answer." inView delay={0.15} className="text-navy-300" />
          </h2>
          <p className="mt-6 max-w-sm text-lg text-navy-500">No insurance vocabulary needed. Unsure about a word? The assistant explains it in one line.</p>
        </div>
        <div ref={ref} className="relative pl-10 sm:pl-14">
          <div className="absolute bottom-4 left-[15px] top-4 w-px bg-navy-100 sm:left-[19px]" />
          <motion.div style={{ scaleY: line }} className="absolute bottom-4 left-[15px] top-4 w-px origin-top bg-navy-950 sm:left-[19px]" />
          <div className="space-y-16 sm:space-y-24">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} className="relative">
                <span className="absolute -left-10 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 font-mono text-xs font-semibold text-signal ring-8 ring-white sm:-left-14 sm:h-10 sm:w-10">
                  0{i + 1}
                </span>
                <s.icon className="h-7 w-7 text-steel-600" />
                <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">{s.title}</h3>
                <p className="mt-3 max-w-md text-lg leading-relaxed text-navy-500">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- bento */
function NcbLadder() {
  const reduce = useReducedMotion();
  const steps = NCB_STEPS.slice(1); // 20 … 50
  return (
    <div className="flex h-40 items-end gap-2">
      {steps.map((s, i) => (
        <motion.div
          key={s}
          className="relative flex-1 rounded-t-lg bg-navy-950"
          initial={reduce ? false : { height: 0 }}
          whileInView={{ height: `${(s / 50) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 * i, ease: EASE }}
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-navy-500">{s}%</span>
        </motion.div>
      ))}
      <motion.div
        className="relative flex-1 rounded-t-lg bg-loss"
        initial={reduce ? false : { height: '100%' }}
        whileInView={{ height: '4%' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1.2, ease: [0.7, 0, 0.84, 0] }}
      >
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-semibold text-loss">0%</span>
      </motion.div>
    </div>
  );
}

function Bento() {
  return (
    <section className="bg-[#f6f5f0] px-5 py-28 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-steel-700">What you’ll see</p>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-6xl">The numbers insurers use. Finally out loud.</h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="h-full rounded-[32px] bg-white p-7 ring-1 ring-navy-100 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-navy-950">Your No-Claim Bonus, climbing for years</h3>
                  <p className="mt-2 max-w-md text-navy-500">Each claim-free year raises the discount. One claim drops it to zero. ClearClaim prices that loss in rupees.</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-loss/10 px-3 py-1 text-xs font-semibold text-loss sm:inline">after a claim</span>
              </div>
              <div className="mt-10"><NcbLadder /></div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.08}>
            <div className="flex h-full flex-col justify-between rounded-[32px] bg-navy-950 p-7 text-white sm:p-9">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/40">Plastic bumper, ₹10,000 quote</p>
              <div>
                <p className="font-display text-6xl font-semibold tracking-tight text-signal">
                  <CountUp value={5000} />
                </p>
                <p className="mt-2 text-white/60">is yours to pay. Plastic parts lose 50% on replacement.</p>
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.05}>
            <div className="h-full rounded-[32px] bg-signal p-7 text-navy-950 sm:p-9">
              <Scale className="h-7 w-7" />
              <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight">A verdict, with the working shown</h3>
              <p className="mt-2 text-navy-800">Claim, pay yourself, or too close to call, and every rule behind it. Fixed rules, not AI guesses: same inputs, same answer.</p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-3" delay={0.12}>
            <div className="h-full overflow-hidden rounded-[32px] bg-white p-7 ring-1 ring-navy-100 sm:p-9">
              <Fingerprint className="h-7 w-7 text-steel-600" />
              <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight text-navy-950">A record you can prove later</h3>
              <p className="mt-2 text-navy-500">Saved checks get a fingerprint. If anyone edits the record afterwards, the mismatch shows.</p>
              <p className="mt-6 truncate rounded-xl bg-navy-50 px-3 py-2 font-mono text-xs text-navy-500">sha256 · 9f2c4e1a7b…d03e8c55</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- try it */
function TryIt() {
  return (
    <section className="vs-grain relative overflow-hidden bg-navy-950 px-5 py-28 text-white lg:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-steel-600/20 blur-[140px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-sm font-semibold text-signal">Try it, no sign-up</p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            Your quote.
            <br />
            <span className="text-signal">Your answer.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-white/60">Enter what the workshop quoted. Everything runs in your browser; nothing is sent anywhere.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <QuickCheck />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- orgs */
function Orgs() {
  const items = [
    { href: '/for-fleets', icon: Truck, tag: 'Fleet triage', title: 'Run a fleet?', body: 'Log every incident. Get the claim-or-pay plan with the lowest total cost. The bonus is lost once per vehicle, so triage bundles claims to match.' },
    { href: '/for-workshops', icon: Wrench, tag: 'Estimates', title: 'Run a workshop?', body: 'Build the estimate and show the customer, line by line, what their insurer will likely cover. No surprises at handover.' },
  ];
  return (
    <section className="bg-white px-5 py-28 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-2xl font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-6xl">Built for the people who handle the most claims.</h2>
          <p className="max-w-xs text-navy-500">Separate workspaces for fleets and workshops, designed around how each actually works.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {items.map((o, i) => (
            <Reveal key={o.href} delay={i * 0.08}>
              <Spotlight className="h-full rounded-[32px] bg-navy-950 text-white">
                <Link href={o.href} className="relative flex h-full min-h-[340px] flex-col justify-between p-8 sm:p-10">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">{o.tag}</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition duration-500 group-hover:rotate-45 group-hover:bg-signal group-hover:text-navy-950">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                  <div>
                    <o.icon className="h-8 w-8 text-signal" />
                    <h3 className="mt-5 font-display text-4xl font-semibold tracking-tight">{o.title}</h3>
                    <p className="mt-3 max-w-md leading-relaxed text-white/60">{o.body}</p>
                  </div>
                </Link>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- honesty */
function StrikeItem({ text, delay }: { text: string; delay: number }) {
  const reduce = useReducedMotion();
  // A background stroke on an inline span follows the text across wrapped lines.
  return (
    <li className="py-1">
      <motion.span
        className="bg-no-repeat text-white/40"
        style={{ backgroundImage: 'linear-gradient(#ff9b6a, #ff9b6a)', backgroundPosition: '0 58%' }}
        initial={reduce ? { backgroundSize: '100% 2px' } : { backgroundSize: '0% 2px' }}
        whileInView={{ backgroundSize: '100% 2px' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
      >
        {text}
      </motion.span>
    </li>
  );
}

function Honesty() {
  return (
    <section className="vs-grain relative overflow-hidden bg-navy-950 px-5 py-28 text-white lg:py-36">
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="text-sm font-semibold text-signal">Straight talk</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] sm:text-6xl">On your side of the table. Not the insurer’s.</h2>
        </Reveal>
        <div className="mt-16 grid gap-14 md:grid-cols-2">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-signal">ClearClaim is</p>
            <ul className="mt-6 space-y-4 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {['An independent calculator', 'A tamper-evident record of your car', 'Clear about what’s estimated', 'Built on your consent'].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ember">ClearClaim is not</p>
            <ul className="mt-6 space-y-4 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {['Your insurer, or a broker', 'Approving or rejecting claims', 'Guessing with AI fraud scores', 'A guarantee of the payout'].map((t, i) => (
                <StrikeItem key={t} text={t} delay={0.3 + i * 0.15} />
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- faq */
const FAQ_IDS = ['claim-or-pay', 'ncb', 'idv', 'not-final', 'ledger', 'privacy'];

function Faq() {
  const { open } = useAssistant();
  const [openFaq, setOpenFaq] = useState<string | null>('claim-or-pay');
  const faqs = FAQ_IDS.map((id) => KNOWLEDGE.find((k) => k.id === id)!).filter(Boolean);
  return (
    <section id="questions" className="scroll-mt-24 bg-white px-5 py-28 lg:py-36">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-sm font-semibold text-steel-700">Questions</p>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950 sm:text-5xl">Car insurance, minus the jargon.</h2>
          <p className="mt-5 text-navy-500">The assistant answers from the same reviewed guide, and says so when it doesn’t know.</p>
          <button type="button" onClick={() => open()} className="vs-btn-secondary mt-8">
            <MessageCircleQuestion className="h-4 w-4" /> Ask the assistant
          </button>
        </Reveal>
        <div className="border-t border-navy-100">
          {faqs.map((f) => {
            const isOpen = openFaq === f.id;
            return (
              <div key={f.id} className="border-b border-navy-100">
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : f.id)} aria-expanded={isOpen} className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className="font-display text-xl font-medium tracking-tight text-navy-950 transition group-hover:translate-x-1 sm:text-2xl">{f.question}</span>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${isOpen ? 'rotate-45 bg-navy-950 text-signal' : 'bg-navy-50 text-navy-700 group-hover:bg-navy-100'}`}>
                    <Plus className="h-5 w-5" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                      <div className="max-w-2xl space-y-3 pb-7 text-[16px] leading-relaxed text-navy-600">
                        {f.answer.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- final cta */
function FinalCta({ checkHref }: { checkHref: string }) {
  return (
    <section className="bg-white px-3 pb-3">
      <div className="vs-grain relative overflow-hidden rounded-[40px] bg-navy-950 px-6 py-24 text-center text-white sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-20%] bottom-[-30%] h-[80%] opacity-60">
          <div className="vs-floor h-full w-full" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-signal/15 blur-[120px]" />
        <div className="relative">
          <h2 className="mx-auto max-w-5xl font-display text-[clamp(3rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
            <SplitWords text="Know before" inView />
            <br />
            <SplitWords text="you claim." inView delay={0.15} className="text-signal" />
          </h2>
          <p className="mx-auto mt-8 max-w-md text-lg text-white/60">Free. Two minutes. No insurer ever sees it unless you share it.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={checkHref} className="vs-btn-signal group py-4 pl-7 pr-2">
                Check my claim
                <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 text-signal transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            <Link href="/onboarding" className="vs-btn-ghost-dark py-4">Add my car</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { status } = useAuth();
  const checkHref = status === 'authenticated' ? '/decision' : '/login?next=%2Fdecision';
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <Hero checkHref={checkHref} />
        <Example />
        <Steps />
        <TryIt />
        <Bento />
        <Orgs />
        <Honesty />
        <Faq />
        <FinalCta checkHref={checkHref} />
      </main>
      <PublicFooter />
    </div>
  );
}
