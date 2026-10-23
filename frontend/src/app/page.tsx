'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Car,
  ChevronDown,
  FileText,
  Fingerprint,
  MessageCircleQuestion,
  Scale,
  ShieldCheck,
  TrendingDown,
  Wrench,
  X,
  Check,
} from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { QuickCheck } from '@/components/home/QuickCheck';
import { LedgerStatusBadge } from '@/components/common/LedgerStatusBadge';
import { useAssistant } from '@/context/AssistantContext';
import { useAuth } from '@/context/AuthContext';
import { KNOWLEDGE } from '@/content/assistantKnowledge';

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const STEPS = [
  { icon: Car, title: 'Pick your car', body: 'Choose a saved car or just enter the year it was made. Its age decides how much insurers deduct for wear.' },
  { icon: Wrench, title: 'Tap what’s damaged', body: 'Point at the bumper, door or windshield on a simple diagram and enter what the workshop quoted.' },
  { icon: Scale, title: 'Get a clear answer', body: 'See what your insurer might pay, what you’d pay, and whether claiming or paying yourself costs less over three years.' },
];

const OUTCOMES = [
  { icon: Calculator, title: 'What your insurer might pay', body: 'After depreciation on parts and your deductible, capped at your IDV.' },
  { icon: TrendingDown, title: 'What claiming really costs', body: 'Including the No-Claim Bonus discount you’d lose at renewal, and how it recovers.' },
  { icon: BadgeCheck, title: 'Which option is cheaper', body: 'A plain verdict with the reasoning shown line by line. No black boxes.' },
  { icon: Fingerprint, title: 'A record you can prove', body: 'Save the result; its fingerprint is anchored so later changes can be detected.' },
];

const FAQ_IDS = ['claim-or-pay', 'ncb', 'idv', 'not-final', 'ledger', 'privacy'];

export default function HomePage() {
  const reduce = useReducedMotion();
  const { open } = useAssistant();
  const { status: authStatus } = useAuth();
  const checkHref = authStatus === 'authenticated' ? '/decision' : '/login?next=%2Fdecision';
  const [openFaq, setOpenFaq] = useState<string | null>('claim-or-pay');
  const faqs = FAQ_IDS.map((id) => KNOWLEDGE.find((k) => k.id === id)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="vs-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-steel-200/50 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.6, 0.85, 0.6] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-20">
          <div className="space-y-7">
            <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex flex-wrap items-center gap-2">
              <span className="vs-chip">For car owners in India</span>
              <span className="vs-chip text-navy-500"><LedgerStatusBadge /></span>
            </motion.div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
              className="text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-navy-950 sm:text-6xl"
            >
              Had a dent or a scrape?
              <br />
              <span className="bg-gradient-to-r from-steel-600 to-steel-400 bg-clip-text text-transparent">Know if claiming is worth it.</span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
              className="max-w-xl text-lg leading-relaxed text-navy-600"
            >
              A small claim can cost you more than the repair, because you lose your No-Claim Bonus. VeriSure works out what your insurer
              might pay, what you’d pay, and which choice is cheaper, in plain language, before you call anyone.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Link href={checkHref} className="vs-btn-primary px-6 py-3.5 text-base">
                Check my claim <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => open()} className="vs-btn-secondary px-6 py-3.5 text-base">
                <MessageCircleQuestion className="h-4 w-4" /> Ask a question
              </button>
            </motion.div>
            <motion.ul
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-500"
            >
              {['Free, no paperwork', 'Every number explained', 'Not an insurer: no sales calls'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-gain" /> {t}</li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          >
            <QuickCheck />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-navy-100 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-steel-700">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">Three questions. One clear answer.</h2>
            <p className="mt-3 text-lg text-navy-600">No insurance vocabulary needed. If a word is unfamiliar, tap the question mark and the assistant explains it.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="group relative h-full rounded-[28px] border border-navy-100 bg-gradient-to-b from-navy-50/60 to-white p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(17,26,49,0.25)]">
                  <span className="absolute right-6 top-6 text-6xl font-semibold text-navy-100 transition group-hover:text-steel-100">{i + 1}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg"><s.icon className="h-5 w-5" /></span>
                  <h3 className="mt-6 text-xl font-semibold text-navy-900">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-navy-600">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-semibold text-steel-700">What you’ll understand</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">The numbers insurers use, finally explained.</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-600">
              VeriSure uses the standard motor-insurance rules for depreciation, deductibles and No-Claim Bonus, the same kind of rules surveyors
              apply. Fixed rules, not AI guesses, so the same inputs always give the same answer.
            </p>
            <Link href={checkHref} className="vs-btn-primary mt-8">Start a claim check <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {OUTCOMES.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.08}>
                <div className="vs-surface h-full p-6 transition duration-500 hover:-translate-y-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-steel-50 text-steel-700"><o.icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 font-semibold text-navy-900">{o.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Honesty */}
      <section className="bg-navy-950 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-steel-300">Straight talk</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What VeriSure is, and isn’t.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[28px] bg-white/5 p-7 ring-1 ring-white/10">
                <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-steel-300" /> VeriSure is</p>
                <ul className="mt-5 space-y-3 text-navy-100">
                  {['An independent calculator that shows every step', 'A tamper-evident history for your car’s records', 'Clear about what’s estimated, extracted or unavailable', 'Built around your consent: you choose who sees your data'].map((t) => (
                    <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-gain" /> {t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-[28px] bg-white/5 p-7 ring-1 ring-white/10">
                <p className="flex items-center gap-2 font-semibold"><X className="h-5 w-5 text-loss" /> VeriSure is not</p>
                <ul className="mt-5 space-y-3 text-navy-100">
                  {['Your insurer: it never approves, rejects or files claims', 'Connected to IRDAI, VAHAN or insurer systems', 'A source of AI fraud or damage scores (those stay off without validated data)', 'A guarantee of the final settlement amount'].map((t) => (
                    <li key={t} className="flex gap-3"><X className="mt-0.5 h-5 w-5 shrink-0 text-navy-400" /> {t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="questions" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="text-sm font-semibold text-steel-700">Common questions</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">Car insurance, without the jargon.</h2>
            <p className="mt-4 text-navy-600">Can’t find your question? The VeriSure Assistant answers from the same reviewed guide, and tells you when it doesn’t know.</p>
            <button type="button" onClick={() => open()} className="vs-btn-secondary mt-6">
              <MessageCircleQuestion className="h-4 w-4" /> Ask the assistant
            </button>
          </Reveal>
          <div className="divide-y divide-navy-100 rounded-[28px] border border-navy-100 bg-white">
            {faqs.map((f) => {
              const isOpen = openFaq === f.id;
              return (
                <div key={f.id}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : f.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="font-semibold text-navy-900">{f.question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-navy-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                        <div className="space-y-3 px-6 pb-6 text-[15px] leading-relaxed text-navy-600">
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

      {/* Final CTA */}
      <section className="px-4 pb-20">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-gradient-to-br from-navy-900 via-navy-800 to-steel-800 px-8 py-14 text-center text-white sm:px-16">
          <div className="vs-grid-bg pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative">
            <FileText className="mx-auto h-10 w-10 text-steel-300" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Got a workshop quote? Find out in two minutes.</h2>
            <p className="mx-auto mt-3 max-w-xl text-navy-200">Use a sample account to explore, or add your own car. No payment, no insurer contact.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={checkHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-navy-900 transition hover:bg-navy-50">
                Check my claim <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10">
                Add my car
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <PublicFooter />
    </div>
  );
}
