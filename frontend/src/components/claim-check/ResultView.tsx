'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, CircleDollarSign, Info, MessageCircleQuestion, Scale, TrendingDown, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { nextNcb } from '@/lib/engine';
import {
  analyzeClaim,
  EngineResult,
  PolicyInputs,
  reasoningSteps,
  RepairLine,
  rupees,
  threeYearPremiumImpact,
  verdictFor,
} from '@/lib/claimCheck';
import { useAssistant } from '@/context/AssistantContext';
import { RepairOrSell } from './RepairOrSell';

const EASE = [0.16, 1, 0.3, 1] as const;

const TONE = {
  claim: { tag: 'Claim it', tagCls: 'bg-signal text-navy-950', text: 'text-signal', Icon: BadgeCheck },
  selfpay: { tag: 'Pay it yourself', tagCls: 'bg-white text-navy-950', text: 'text-white', Icon: Wallet },
  close: { tag: 'Close call', tagCls: 'bg-amber-300 text-navy-950', text: 'text-amber-300', Icon: Scale },
};

export function ResultView({ result, policy, items }: { result: EngineResult; policy: PolicyInputs; items: RepairLine[] }) {
  const reduce = useReducedMotion();
  const { open } = useAssistant();
  const verdict = verdictFor(result);
  const tone = TONE[verdict.tone];
  const claimTotal = result.effective_claim_cost;
  const selfTotal = result.self_pay_cost;
  const max = Math.max(claimTotal, selfTotal, 1);
  const better = claimTotal < selfTotal ? 'claim' : claimTotal > selfTotal ? 'self' : 'tie';
  const threeYear = threeYearPremiumImpact(result);

  return (
    <div className="space-y-6">
      {/* Verdict */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="vs-grain relative overflow-hidden rounded-[28px] bg-navy-950 p-6 text-white sm:p-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-signal/10 blur-[90px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-3">
            <motion.span
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 18 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tone.tagCls}`}
            >
              <tone.Icon className="h-4 w-4" aria-hidden="true" /> {tone.tag}
            </motion.span>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{verdict.headline}</h2>
            <p className="text-base leading-relaxed text-white/60">{verdict.summary}</p>
          </div>
          <div className="shrink-0 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
              {better === 'claim' ? 'Claiming saves' : better === 'self' ? 'Paying yourself saves' : 'Difference'}
            </p>
            <AnimatedNumber value={Math.abs(result.estimated_saving)} className={`mt-1 block font-display text-5xl font-semibold tracking-tight ${tone.text}`} />
            <p className="mt-1 text-xs text-white/45">estimated, next 12 months</p>
          </div>
        </div>
        <button type="button" onClick={() => open('Explain my result')} className="vs-btn-ghost-dark relative mt-7 py-2.5 text-sm">
          <MessageCircleQuestion className="h-4 w-4 text-signal" aria-hidden="true" />
          Explain this to me
        </button>
      </motion.section>

      {/* Side by side */}
      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            key: 'claim',
            title: 'If you claim',
            total: claimTotal,
            lines: [
              { label: 'You pay the workshop now', value: result.immediate_out_of_pocket },
              { label: `Next year’s ${nextNcb(policy.ncbPercentage, false)}% No-Claim Bonus, lost`, value: result.future_ncb_impact },
            ],
          },
          {
            key: 'self',
            title: 'If you pay yourself',
            total: selfTotal,
            lines: [
              { label: 'You pay the full repair bill', value: result.self_pay_cost },
              { label: 'No-Claim Bonus kept and grows next year', value: 0 },
            ],
          },
        ].map((card, i) => {
          const winner = better === card.key;
          return (
            <motion.div
              key={card.key}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.6, ease: EASE }}
              className={`relative rounded-[28px] border bg-white p-6 transition duration-500 ${winner ? 'border-navy-950 shadow-[0_24px_48px_-28px_rgba(10,16,34,0.45)]' : 'border-navy-100'}`}
            >
              {winner && (
                <motion.span
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="absolute -top-3 left-6 rounded-full bg-navy-950 px-3 py-1 text-xs font-semibold text-signal shadow"
                >
                  Cheaper for you
                </motion.span>
              )}
              <h3 className="text-sm font-semibold text-navy-500">{card.title}</h3>
              <AnimatedNumber value={card.total} className="mt-1 block font-display text-4xl font-semibold tracking-tight text-navy-950" />
              <p className="text-xs text-navy-400">total estimated cost to you</p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-navy-50">
                <motion.div
                  className={`h-full rounded-full ${winner ? 'bg-signal-600' : 'bg-navy-200'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(card.total / max) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 1, ease: EASE }}
                />
              </div>
              <dl className="mt-5 space-y-2.5">
                {card.lines.map((l) => (
                  <div key={l.label} className="flex items-start justify-between gap-4 text-sm">
                    <dt className="text-navy-600">{l.label}</dt>
                    <dd className="tabular shrink-0 font-medium text-navy-900">{rupees(l.value)}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          );
        })}
      </section>

      <RepairOrSell
        repairBill={result.total_estimate}
        idv={policy.idv}
        deductible={policy.deductible}
        yourRepairCost={Math.min(result.effective_claim_cost, result.self_pay_cost)}
        ncbLoss={result.future_ncb_impact}
      />

      <MoneyFlow result={result} policy={policy} />
      <ThreeYearChart result={result} threeYear={threeYear} />
      <WhatIf policy={policy} items={items} base={result} />

      <p className="flex items-start gap-2 rounded-2xl bg-navy-50 p-4 text-xs leading-relaxed text-navy-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
        These are estimates from standard motor-insurance rules (rule set {result.rule_version}), using the numbers you entered.
        ClearClaim is not your insurer and does not approve or reject claims. Your insurer and surveyor decide the actual settlement.
      </p>
    </div>
  );
}

function MoneyFlow({ result, policy }: { result: EngineResult; policy: PolicyInputs }) {
  const steps = reasoningSteps(result, policy);
  const total = Math.max(result.total_estimate, 1);
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="vs-surface p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
          <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-navy-900">Where your money goes</h3>
          <p className="text-sm text-navy-500">How the insurer’s estimated payout is worked out, step by step.</p>
        </div>
      </div>
      <ol className="mt-6 space-y-5">
        {steps.map((s, i) => {
          const width = (Math.abs(s.amount) / total) * 100;
          const color = s.kind === 'base' ? 'bg-navy-700' : s.kind === 'minus' ? 'bg-loss/80' : 'bg-gain';
          return (
            <motion.li
              key={s.label}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className={`text-sm font-medium ${s.kind === 'result' ? 'text-navy-900' : 'text-navy-700'}`}>{s.label}</span>
                <span className={`tabular text-base font-semibold ${s.kind === 'minus' ? 'text-loss' : s.kind === 'result' ? 'text-gain' : 'text-navy-900'}`}>
                  {s.kind === 'minus' ? '−' : ''}
                  {rupees(Math.abs(s.amount))}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-navy-50">
                <motion.div
                  className={`h-full rounded-full ${color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(width, s.amount ? 1.5 : 0)}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.9, ease: EASE }}
                />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-navy-500">{s.detail}</p>
            </motion.li>
          );
        })}
      </ol>
    </motion.section>
  );
}

function ThreeYearChart({ result, threeYear }: { result: EngineResult; threeYear: number }) {
  const reduce = useReducedMotion();
  const years = result.simulation_3_year;
  const max = Math.max(...years.flatMap((y) => [y.claim_premium, y.self_pay_premium]), 1);
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="vs-surface p-6 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
            <TrendingDown className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-navy-900">Your premiums over the next 3 years</h3>
            <p className="text-sm text-navy-500">Claiming resets your No-Claim Bonus; it then rebuilds year by year.</p>
          </div>
        </div>
        {threeYear > 0 && (
          <p className="text-sm text-navy-600">
            Claiming adds about <span className="tabular font-semibold text-loss">{rupees(threeYear)}</span> in total
          </p>
        )}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8">
        {years.map((y, i) => (
          <div key={y.year} className="flex flex-col items-center gap-3">
            <div className="flex h-44 w-full items-end justify-center gap-2 sm:gap-3">
              {[
                { v: y.claim_premium, ncb: y.claim_ncb, c: 'bg-loss/75', label: 'If you claim' },
                { v: y.self_pay_premium, ncb: y.self_pay_ncb, c: 'bg-steel-500', label: 'If you pay yourself' },
              ].map((b, j) => (
                <div key={j} className="group relative flex h-full w-1/2 max-w-[56px] flex-col justify-end">
                  <motion.div
                    className={`w-full rounded-t-xl ${b.c}`}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(b.v / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.12 + j * 0.06, duration: 0.9, ease: EASE }}
                    aria-label={`${b.label}, year ${y.year}: ${rupees(b.v)} with ${b.ncb}% NCB`}
                  />
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9 + i * 0.12 }}
                    className="tabular mb-1 order-first text-center text-[10px] font-semibold leading-tight text-navy-700 sm:text-[11px]"
                  >
                    {rupees(b.v)}
                    <span className="block font-normal text-navy-400">NCB {b.ncb}%</span>
                  </motion.span>
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-navy-500">Year {y.year}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-navy-600">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-loss/75" /> If you claim</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-steel-500" /> If you pay yourself</span>
      </div>
    </motion.section>
  );
}

/** Live re-calculation through the real engine as the user drags the repair bill. */
function WhatIf({ policy, items, base }: { policy: PolicyInputs; items: RepairLine[]; base: EngineResult }) {
  const [factor, setFactor] = useState(1);
  const [live, setLive] = useState<EngineResult>(base);
  const [busy, setBusy] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (factor === 1) return;
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setBusy(true);
      try {
        const scaled = items.map((i) => ({ ...i, cost: Math.round(i.cost * factor) }));
        setLive(await analyzeClaim(policy, scaled, c.signal));
      } catch {
        /* keep the last good result */
      } finally {
        if (!c.signal.aborted) setBusy(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [factor, items, policy, base]);

  const shown = factor === 1 ? base : live;
  const verdict = useMemo(() => verdictFor(shown), [shown]);
  const total = shown.total_estimate;

  return (
    <section className="vs-surface p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-navy-900">What if the repair bill is different?</h3>
      <p className="text-sm text-navy-500">Workshop quotes often change. Drag to see how the answer changes, recalculated with the same rules.</p>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="range"
            min={0.05}
            max={3}
            step={0.05}
            value={factor}
            onChange={(e) => setFactor(parseFloat(e.target.value))}
            className="w-full accent-navy-900"
            aria-label="Repair bill"
            aria-valuetext={rupees(total)}
          />
          <div className="mt-1 flex justify-between text-xs text-navy-400">
            <span>Smaller bill</span>
            <button type="button" onClick={() => setFactor(1)} className="font-medium text-steel-700 hover:underline">
              Reset to your bill
            </button>
            <span>Bigger bill</span>
          </div>
        </div>
        <div className={`w-full rounded-3xl bg-navy-50 p-5 transition-opacity sm:w-72 ${busy ? 'opacity-60' : ''}`}>
          <p className="text-xs text-navy-500">Repair bill</p>
          <AnimatedNumber value={total} className="block text-2xl font-semibold text-navy-900" duration={0.4} />
          <motion.p key={verdict.tone} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-semibold text-navy-800">
            {verdict.headline}
          </motion.p>
        </div>
      </div>
      {Number.isFinite(base.break_even_threshold) && base.break_even_threshold > 0 && (
        <p className="mt-5 text-sm text-navy-600">
          Rough rule of thumb for your policy: claiming tends to start paying off when the bill is above about{' '}
          <span className="tabular font-semibold text-navy-900">{rupees(base.break_even_threshold)}</span>.
        </p>
      )}
    </section>
  );
}
