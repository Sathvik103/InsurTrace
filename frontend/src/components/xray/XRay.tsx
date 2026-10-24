'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { CATEGORY_LABEL, newLine, xray, XCategory, XLine, XPolicy } from '@/lib/xray';
import { rupees } from '@/lib/claimCheck';

const EASE = [0.16, 1, 0.3, 1] as const;
const CATS = Object.keys(CATEGORY_LABEL) as XCategory[];

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
  const r = useMemo(() => xray(lines, policy), [lines, policy]);
  const ranked = [...r.lines].filter((l) => l.cost > 0).sort((a, b) => b.depreciation - a.depreciation);
  const topIds = new Set(ranked.filter((l) => l.depreciation > 0).slice(0, 2).map((l) => l.id));
  const insurerPct = r.total ? (r.insurerPays / r.total) * 100 : 0;

  const update = (id: string, patch: Partial<XLine>) => onLinesChange?.(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section className="vs-surface p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Repair quote" value={r.total} />
          <Stat label="Insurer would pay (estimate)" value={r.insurerPays} tone="gain" />
          <Stat label="You would pay" value={r.youPay} tone="loss" />
        </div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-loss/20" role="img" aria-label={`Insurer pays ${Math.round(insurerPct)} percent of the quote`}>
          <motion.div className="h-full rounded-full bg-gain" initial={false} animate={{ width: `${insurerPct}%` }} transition={{ duration: reduce ? 0 : 0.7, ease: EASE }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-navy-500">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gain" />Insurer {Math.round(insurerPct)}%</span>
          <span>
            Your share: depreciation {rupees(r.depreciation)} + deductible {rupees(r.deductible)}
            {r.idvCapped ? ' + amount above IDV' : ''}
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-loss/40" />
          </span>
        </div>
        {r.youPayWithZeroDep !== undefined && r.youPay - r.youPayWithZeroDep > 0 && (
          <p className="mt-4 rounded-2xl bg-steel-50 px-4 py-3 text-sm text-steel-800">
            With zero-depreciation cover you’d pay about <strong className="tabular">{rupees(r.youPayWithZeroDep)}</strong> on this quote, which is{' '}
            <strong className="tabular">{rupees(r.youPay - r.youPayWithZeroDep)}</strong> less. Worth considering at your next renewal.
          </p>
        )}
      </section>

      {/* Policy inputs */}
      {onPolicyChange && (
        <section className="vs-surface grid gap-4 p-5 sm:grid-cols-4 sm:p-6">
          <NumField label="Car age (years)" value={policy.ageYears} onChange={(v) => onPolicyChange({ ...policy, ageYears: v })} step={0.5} />
          <NumField label="Deductible (₹)" value={policy.deductible} onChange={(v) => onPolicyChange({ ...policy, deductible: v })} />
          <NumField label="IDV (₹)" value={policy.idv} onChange={(v) => onPolicyChange({ ...policy, idv: v })} />
          <label className="flex items-center gap-3 self-end rounded-2xl border border-navy-100 px-4 py-3 text-sm font-medium text-navy-800">
            <input type="checkbox" checked={policy.zeroDep} onChange={(e) => onPolicyChange({ ...policy, zeroDep: e.target.checked })} className="h-4 w-4 accent-navy-900" />
            Zero-dep cover
          </label>
        </section>
      )}

      {/* Lines */}
      <section className="vs-surface overflow-hidden">
        <div className="hidden grid-cols-[1fr_160px_120px_1fr] gap-4 border-b border-navy-100 bg-navy-50/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-navy-500 md:grid">
          <span>Item</span>
          <span>Material</span>
          <span className="text-right">Cost</span>
          <span>Insurer vs you</span>
        </div>
        <ul className="divide-y divide-navy-50">
          <AnimatePresence initial={false}>
            {r.lines.map((l) => {
              const youPct = l.cost ? (l.depreciation / l.cost) * 100 : 0;
              const top = topIds.has(l.id);
              return (
                <motion.li key={l.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={`grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px_120px_1fr] md:items-center md:gap-4 ${top ? 'bg-loss-soft/40' : ''}`}>
                  <div className="min-w-0">
                    {editable ? (
                      <input value={l.label} onChange={(e) => update(l.id, { label: e.target.value })} placeholder="Item description" aria-label="Item description" className="w-full bg-transparent text-sm font-medium text-navy-900 focus:outline-none" />
                    ) : (
                      <p className="text-sm font-medium text-navy-900">{l.label || 'Item'}</p>
                    )}
                    {top && <p className="mt-0.5 text-[11px] font-semibold text-loss">One of your biggest costs</p>}
                  </div>
                  {editable ? (
                    <select value={l.category} onChange={(e) => update(l.id, { category: e.target.value as XCategory })} aria-label="Material" className="vs-input py-2 text-sm">
                      {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-navy-600">{CATEGORY_LABEL[l.category]}</p>
                  )}
                  {editable ? (
                    <input value={l.cost ? String(l.cost) : ''} inputMode="numeric" onChange={(e) => update(l.id, { cost: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} placeholder="₹" aria-label="Cost in rupees" className="vs-input tabular py-2 text-right text-sm" />
                  ) : (
                    <p className="tabular text-right text-sm font-medium text-navy-900">{rupees(l.cost)}</p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-navy-50">
                      <motion.span className="h-full bg-gain" initial={false} animate={{ width: `${100 - youPct}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE }} />
                      <motion.span className="h-full bg-loss/70" initial={false} animate={{ width: `${youPct}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="tabular text-gain">Insurer {rupees(l.insurerShare)}</span>
                      <span className="tabular text-loss">You {rupees(l.depreciation)}{l.depRate ? ` (${Math.round(l.depRate * 100)}%)` : ''}</span>
                      {editable && (
                        <button type="button" onClick={() => onLinesChange?.(lines.filter((x) => x.id !== l.id))} className="ml-2 rounded-full p-1 text-navy-300 hover:text-loss" aria-label={`Remove ${l.label || 'item'}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {!compact && l.tip && (
                      <p className="flex gap-1.5 text-xs leading-relaxed text-navy-500"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{l.tip}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {editable && (
          <div className="border-t border-navy-100 p-4">
            <button type="button" onClick={() => onLinesChange?.([...lines, newLine()])} className="vs-chip hover:border-navy-300"><Plus className="h-3.5 w-3.5" /> Add a line</button>
          </div>
        )}
      </section>
      <p className="text-xs leading-relaxed text-navy-500">
        Estimates use the standard depreciation schedule (GR.8) that insurers commonly apply. Your policy wording, add-ons and the surveyor’s assessment decide the actual settlement.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'gain' | 'loss' }) {
  return (
    <div>
      <p className="text-xs text-navy-500">{label}</p>
      <AnimatedNumber value={value} duration={0.5} className={`block text-2xl font-semibold tracking-tight ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-navy-900'}`} />
    </div>
  );
}

function NumField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="text-sm font-medium text-navy-800">
      {label}
      <input type="number" min={0} step={step} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(Number(e.target.value) || 0)} className="vs-input mt-1.5 py-2.5 text-sm" />
    </label>
  );
}

export { newLine };
export type { XLine, XPolicy };
