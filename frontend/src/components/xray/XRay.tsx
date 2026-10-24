'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { CATEGORY_LABEL, newLine, xray, XCategory, XLine, XPolicy } from '@/lib/xray';
import { metalDepreciation } from '@/lib/engine';
import { rupees } from '@/lib/claimCheck';
import { TOTAL_LOSS_RATIO } from '@/lib/repairOrSell';

const EASE = [0.16, 1, 0.3, 1] as const;
const CATS = Object.keys(CATEGORY_LABEL) as XCategory[];
const SHORT: Record<XCategory, string> = { metal: 'Metal', plastic: 'Plastic', glass: 'Glass', fiberglass: 'Fibre', labour: 'Labour', consumables: 'Consumable' };

/** Editable quote lines + live X-ray. Fully on-device. */
export function XRay({
  lines,
  onLinesChange,
  policy,
  onPolicyChange,
  editable = true,
  compact = false,
}: {
  lines: XLine[];
  onLinesChange?: (l: XLine[]) => void;
  policy: XPolicy;
  onPolicyChange?: (p: XPolicy) => void;
  editable?: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const r = useMemo(() => xray(lines, policy), [lines, policy]);
  const priced = r.lines.filter((l) => l.cost > 0);
  const topIds = new Set([...priced].sort((a, b) => b.depreciation - a.depreciation).filter((l) => l.depreciation > 0).slice(0, 2).map((l) => l.id));
  const insurerPct = r.total ? (r.insurerPays / r.total) * 100 : 0;
  const share = policy.idv > 0 ? r.total / policy.idv : 0;
  const update = (id: string, patch: Partial<XLine>) => onLinesChange?.(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section className="vs-grain relative overflow-hidden rounded-[28px] bg-navy-950 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/10 blur-[90px]" />
        <div className="relative grid gap-6 sm:grid-cols-3">
          <Stat label="Repair quote" value={r.total} />
          <Stat label="Insurer would pay" value={r.insurerPays} tone="text-signal" />
          <Stat label="You would pay" value={r.youPay} tone="text-ember" />
        </div>

        {/* One bar, one segment per line, each split insurer | you */}
        <div className="relative mt-7">
          <div className="flex h-12 gap-1 overflow-hidden rounded-2xl" role="img" aria-label={`Insurer pays ${Math.round(insurerPct)} percent of the quote`}>
            {priced.length === 0 && <div className="flex-1 rounded-2xl bg-white/[0.06]" />}
            {priced.map((l) => {
              const youPct = (l.depreciation / l.cost) * 100;
              const dim = hover && hover !== l.id;
              return (
                <motion.button
                  type="button"
                  key={l.id}
                  layout
                  onMouseEnter={() => setHover(l.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(l.id)}
                  onBlur={() => setHover(null)}
                  aria-label={`${l.label || CATEGORY_LABEL[l.category]}: insurer ${rupees(l.insurerShare)}, you ${rupees(l.depreciation)}`}
                  className="relative flex h-full overflow-hidden rounded-lg transition-opacity duration-300"
                  style={{ flexGrow: l.cost, flexBasis: 0, opacity: dim ? 0.35 : 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                  <motion.span className="h-full bg-signal" initial={false} animate={{ width: `${100 - youPct}%` }} transition={{ duration: reduce ? 0 : 0.6, ease: EASE }} />
                  <motion.span className="h-full bg-ember" initial={false} animate={{ width: `${youPct}%` }} transition={{ duration: reduce ? 0 : 0.6, ease: EASE }} />
                </motion.button>
              );
            })}
          </div>
          <div className="mt-3 flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs text-white/55">
            {hover && priced.find((l) => l.id === hover) ? (
              (() => {
                const l = priced.find((x) => x.id === hover)!;
                return (
                  <span className="font-medium text-white">
                    {l.label || CATEGORY_LABEL[l.category]}: insurer {rupees(l.insurerShare)}, you {rupees(l.depreciation)}
                    {l.depRate ? ` (${Math.round(l.depRate * 100)}% depreciation)` : ' (not depreciated)'}
                  </span>
                );
              })()
            ) : (
              <>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-signal" /> Insurer {Math.round(insurerPct)}%</span>
                <span className="flex items-center gap-1.5">
                  You: depreciation {rupees(r.depreciation)} + deductible {rupees(r.deductible)}{r.idvCapped ? ' + amount above IDV' : ''}
                  <span className="h-2 w-2 rounded-full bg-ember" />
                </span>
              </>
            )}
          </div>
        </div>

        {r.youPayWithZeroDep !== undefined && r.youPay - r.youPayWithZeroDep > 0 && (
          <p className="relative mt-5 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75">
            With zero-depreciation cover you’d pay about <strong className="tabular text-white">{rupees(r.youPayWithZeroDep)}</strong> on this quote,{' '}
            <strong className="tabular text-signal">{rupees(r.youPay - r.youPayWithZeroDep)}</strong> less. Worth checking at your next renewal.
          </p>
        )}
      </section>

      {share >= TOTAL_LOSS_RATIO && (
        <div className="flex flex-col gap-3 rounded-[22px] border border-ember/40 bg-loss-soft p-5 sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-loss" />
          <p className="flex-1 text-sm text-navy-800">
            <span className="font-semibold">This quote is {Math.round(share * 100)}% of the IDV.</span> Many policies treat repairs above about 75% of the IDV as a total loss, and selling the car as it is might also beat repairing.
          </p>
          <Link href="/decision" className="vs-btn-primary shrink-0 py-2.5">Compare repair vs sell <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}

      {/* Policy controls */}
      {onPolicyChange && (
        <section className="grid gap-5 rounded-[28px] border border-navy-100 bg-white p-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-navy-800">Car age</span>
              <span className="font-mono text-xs text-navy-500">
                {policy.ageYears} yr{policy.ageYears === 1 ? '' : 's'} · metal {Math.round(metalDepreciation(policy.ageYears) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={policy.ageYears}
              onChange={(e) => onPolicyChange({ ...policy, ageYears: Number(e.target.value) })}
              aria-label="Car age in years"
              className="mt-4 w-full accent-navy-950"
            />
            <p className="mt-1 text-xs text-navy-400">Older cars lose more on metal parts. Plastic is always 50%.</p>
          </div>
          <div>
            <span className="text-sm font-medium text-navy-800">Deductible</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1000, 2000].map((d) => (
                <button key={d} type="button" onClick={() => onPolicyChange({ ...policy, deductible: d })} aria-pressed={policy.deductible === d} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${policy.deductible === d ? 'bg-navy-950 text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100'}`}>
                  {rupees(d)}
                </button>
              ))}
              <MoneyBox value={[1000, 2000].includes(policy.deductible) ? 0 : policy.deductible} onChange={(v) => onPolicyChange({ ...policy, deductible: v })} placeholder="Other" small />
            </div>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">IDV</span>
              <MoneyBox value={policy.idv} onChange={(v) => onPolicyChange({ ...policy, idv: v })} placeholder="e.g. 6,00,000" />
            </label>
            <button type="button" role="switch" aria-checked={policy.zeroDep} onClick={() => onPolicyChange({ ...policy, zeroDep: !policy.zeroDep })} className="flex w-full items-center justify-between rounded-2xl border border-navy-100 px-4 py-2.5 text-sm font-medium text-navy-800">
              Zero-dep cover
              <span className={`relative h-6 w-11 rounded-full transition-colors ${policy.zeroDep ? 'bg-navy-950' : 'bg-navy-200'}`}>
                <motion.span layout className={`absolute top-1 h-4 w-4 rounded-full ${policy.zeroDep ? 'right-1 bg-signal' : 'left-1 bg-white'}`} transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Lines */}
      <section className="overflow-hidden rounded-[28px] border border-navy-100 bg-white">
        <ul className="divide-y divide-navy-50">
          <AnimatePresence initial={false}>
            {r.lines.map((l) => {
              const youPct = l.cost ? (l.depreciation / l.cost) * 100 : 0;
              const top = topIds.has(l.id);
              const lit = hover === l.id;
              return (
                <motion.li
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  onMouseEnter={() => setHover(l.id)}
                  onMouseLeave={() => setHover(null)}
                  className={`grid gap-3 px-5 py-4 transition-colors duration-300 md:grid-cols-[1fr_120px_1fr] md:items-start md:gap-5 ${lit ? 'bg-[#f6f5f0]' : ''}`}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      {editable ? (
                        <input value={l.label} onChange={(e) => update(l.id, { label: e.target.value })} placeholder="Item, e.g. front bumper" aria-label="Item description" className="w-full bg-transparent font-medium text-navy-950 placeholder:text-navy-300 focus:outline-none" />
                      ) : (
                        <p className="font-medium text-navy-950">{l.label || 'Item'}</p>
                      )}
                      {top && <span className="shrink-0 rounded-full bg-loss/10 px-2 py-0.5 text-[10px] font-semibold text-loss">Big cost to you</span>}
                    </div>
                    {editable ? (
                      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Material">
                        {CATS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            role="radio"
                            aria-checked={l.category === c}
                            onClick={() => update(l.id, { category: c })}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${l.category === c ? 'bg-navy-950 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}
                          >
                            {SHORT[c]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-navy-500">{CATEGORY_LABEL[l.category]}</p>
                    )}
                  </div>
                  {editable ? (
                    <MoneyBox value={l.cost} onChange={(v) => update(l.id, { cost: v })} placeholder="Cost" />
                  ) : (
                    <p className="tabular text-right font-medium text-navy-950">{rupees(l.cost)}</p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-navy-50">
                      <motion.span className="h-full bg-signal-600" initial={false} animate={{ width: `${100 - youPct}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE }} />
                      <motion.span className="h-full bg-ember" initial={false} animate={{ width: `${youPct}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="tabular font-medium text-signal-700">Insurer {rupees(l.insurerShare)}</span>
                      <span className="tabular font-medium text-loss">You {rupees(l.depreciation)}{l.depRate ? ` · ${Math.round(l.depRate * 100)}%` : ''}</span>
                      {editable && (
                        <button type="button" onClick={() => onLinesChange?.(lines.filter((x) => x.id !== l.id))} className="ml-2 rounded-full p-1 text-navy-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${l.label || 'item'}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {!compact && l.tip && <p className="text-xs leading-relaxed text-navy-500">{l.tip}</p>}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {editable && (
          <button type="button" onClick={() => onLinesChange?.([...lines, newLine()])} className="flex w-full items-center gap-2 border-t border-navy-100 px-5 py-3.5 text-sm font-medium text-navy-500 transition hover:bg-[#f6f5f0] hover:text-navy-950">
            <Plus className="h-4 w-4" /> Add a line
          </button>
        )}
      </section>
      <p className="text-xs leading-relaxed text-navy-500">
        Uses the standard depreciation schedule insurers commonly apply. Your policy wording, add-ons and the surveyor’s assessment decide the actual settlement.
      </p>
    </div>
  );
}

function Stat({ label, value, tone = 'text-white' }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <AnimatedNumber value={value} duration={0.5} className={`mt-1 block font-display text-4xl font-semibold tracking-tight ${tone}`} />
    </div>
  );
}

function MoneyBox({ value, onChange, placeholder, small }: { value: number; onChange: (v: number) => void; placeholder?: string; small?: boolean }) {
  return (
    <span className={`relative block ${small ? 'w-28' : 'mt-1.5'}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy-400">₹</span>
      <input
        inputMode="numeric"
        value={value ? new Intl.NumberFormat('en-IN').format(value) : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, '').slice(0, 9)) || 0)}
        className={`vs-input tabular pl-7 text-right text-sm ${small ? 'py-1.5' : 'py-2'}`}
      />
    </span>
  );
}

export { newLine };
export type { XLine, XPolicy };
