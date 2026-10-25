'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { rupees } from '@/lib/claimCheck';
import { CONSIDER_RATIO, repairOrSell, TOTAL_LOSS_RATIO } from '@/lib/repairOrSell';
import { useAssistant } from '@/context/AssistantContext';

const EASE = [0.16, 1, 0.3, 1] as const;
const fmt = (s: string) => (s ? new Intl.NumberFormat('en-IN').format(Number(s)) : '');

function Money({ label, hint, value, onChange, placeholder }: { label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white">{label}</span>
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">₹</span>
        <input
          inputMode="numeric"
          value={fmt(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
          className="tabular w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-8 pr-3 text-white placeholder:text-white/30 transition focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/20"
        />
      </span>
      <span className="mt-1 block text-xs text-white/45">{hint}</span>
    </label>
  );
}

function Path({ title, value, sub, win, muted }: { title: string; value: string; sub: string; win?: boolean; muted?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-4 transition-colors duration-500 ${win ? 'bg-signal text-navy-950' : 'bg-white/[0.05] text-white'}`}>
      {win && <span className="absolute right-3 top-3 rounded-md bg-navy-950 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-signal">Better</span>}
      <p className={`text-xs font-medium ${win ? 'text-navy-800' : 'text-white/55'}`}>{title}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tracking-tight ${muted ? 'text-white/35' : ''}`}>{value}</p>
      <p className={`mt-1 text-xs leading-relaxed ${win ? 'text-navy-800' : 'text-white/50'}`}>{sub}</p>
    </div>
  );
}

/** Repair it, or sell it as it is? Opens itself when the repair bill is large next to the car’s value. */
export function RepairOrSell({
  repairBill,
  idv,
  deductible,
  yourRepairCost,
  ncbLoss,
}: {
  repairBill: number;
  idv: number;
  deductible: number;
  yourRepairCost: number;
  ncbLoss: number;
}) {
  const reduce = useReducedMotion();
  const { open: ask } = useAssistant();
  const [afterRepair, setAfterRepair] = useState('');
  const [offer, setOffer] = useState('');
  const base = repairOrSell({ repairBill, idv, deductible, yourRepairCost, ncbLoss });
  const [open, setOpen] = useState(() => (base ? base.band !== 'repair' : false));
  if (!base) return null;

  const r = repairOrSell({ repairBill, idv, deductible, yourRepairCost, ncbLoss, valueAfterRepair: Number(afterRepair) || undefined, asIsOffer: Number(offer) || undefined })!;
  const pct = Math.round(r.ratio * 100);
  const tone =
    r.band === 'total-loss'
      ? { label: 'Likely total loss', cls: 'bg-ember text-navy-950' }
      : r.band === 'consider'
        ? { label: 'Worth a thought', cls: 'bg-amber-300 text-navy-950' }
        : { label: 'Repair makes sense', cls: 'bg-white/10 text-white' };

  const sellWins = r.sell?.better;
  const tlWins = r.totalLoss?.betterThanRepair && (!r.sell || r.totalLoss.netAfterNcb > (Number(offer) || 0));

  const verdict = (() => {
    if (r.totalLoss && tlWins) return `A total-loss settlement would leave you about ${rupees(r.totalLoss.netAfterNcb - Math.max(r.keepValue, Number(offer) || 0))} better off than the next option, if your insurer agrees it is a total loss.`;
    if (r.sell && sellWins) {
      // Compare with the next-best option, which may be the total-loss settlement rather than repairing.
      const next = r.totalLoss && r.totalLoss.netAfterNcb > r.keepValue ? { v: r.totalLoss.netAfterNcb, name: 'a total-loss settlement' } : { v: r.keepValue, name: 'repairing' };
      return `Selling as it is leaves you about ${rupees(Number(offer) - next.v)} better off than ${next.name}.`;
    }
    if (r.sell) return `Repairing leaves you about ${rupees(r.sell.difference)} better off than that offer.`;
    return `If anyone offers more than ${rupees(r.breakEvenOffer)} for the car as it is, selling beats repairing.`;
  })();

  return (
    <section className="vs-grain relative overflow-hidden rounded-2xl bg-navy-950 text-white">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-4 p-6 text-left sm:p-7">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${tone.cls}`}>{tone.label}</span>
            <span className="font-mono text-xs text-white/45">repair = {pct}% of IDV</span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">Repair it, or sell it as it is?</h3>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden">
            <div className="space-y-6 px-6 pb-7 sm:px-7">
              {/* Gauge: repair bill against the car's insured value */}
              <div>
                <div className="relative h-3 overflow-visible rounded-md bg-white/[0.08]">
                  <motion.div
                    className={`h-full rounded-md ${r.band === 'total-loss' ? 'bg-ember' : r.band === 'consider' ? 'bg-amber-300' : 'bg-signal'}`}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 1, ease: EASE }}
                  />
                  {[CONSIDER_RATIO, TOTAL_LOSS_RATIO].map((m) => (
                    <span key={m} className="absolute top-[-4px] h-5 w-px bg-white/40" style={{ left: `${m * 100}%` }} />
                  ))}
                </div>
                <div className="relative mt-2 h-4 text-[11px] text-white/45">
                  <span className="absolute left-0">₹0</span>
                  <span className="absolute -translate-x-1/2" style={{ left: `${CONSIDER_RATIO * 100}%` }}>40%</span>
                  <span className="absolute -translate-x-1/2" style={{ left: `${TOTAL_LOSS_RATIO * 100}%` }}>75% total-loss line</span>
                  <span className="absolute right-0">IDV {rupees(idv)}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Money label="Car’s value once repaired" hint="Starts at your IDV. Accident-repaired cars often sell for less, so lower it if a dealer quoted less." value={afterRepair} onChange={setAfterRepair} placeholder={new Intl.NumberFormat('en-IN').format(Math.round(idv))} />
                <Money label="Best offer for it as it is (optional)" hint="From a dealer, an exchange offer or a used-car buyer, for the damaged car." value={offer} onChange={setOffer} placeholder="Leave empty if you have none" />
              </div>

              <div className={`grid gap-3 ${r.totalLoss ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <Path
                  title="Repair and keep"
                  value={rupees(r.keepValue)}
                  sub={`A car worth ${rupees(r.valueAfterRepair)}, minus the ${rupees(yourRepairCost)} the repair costs you on the cheaper route.`}
                  win={!sellWins && !tlWins && !!(r.sell || r.totalLoss)}
                />
                <Path
                  title="Sell as it is"
                  value={r.sell ? rupees(Number(offer)) : `> ${rupees(r.breakEvenOffer)}`}
                  sub={r.sell ? 'The offer you entered, with no repair bill.' : 'The offer you would need for selling to win.'}
                  win={!!sellWins && !tlWins}
                  muted={!r.sell}
                />
                {r.totalLoss && (
                  <Path
                    title="Total-loss settlement"
                    value={rupees(r.totalLoss.netAfterNcb)}
                    sub={`IDV minus the ${rupees(deductible)} deductible, minus ${rupees(ncbLoss)} of No-Claim Bonus. The insurer usually keeps the damaged car.`}
                    win={!!tlWins}
                  />
                )}
              </div>

              <motion.p key={verdict} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 px-4 py-3 text-[15px] leading-relaxed">
                {verdict}
              </motion.p>

              <p className="text-xs leading-relaxed text-white/45">
                {r.totalLoss
                  ? 'Many policies treat repairs above about 75% of the IDV as a total loss; your policy wording sets the exact rule and the insurer’s surveyor decides. '
                  : ''}
                These are estimates from the figures above, not a valuation.{' '}
                <button type="button" onClick={() => ask('What happens if my car is a total loss?')} className="font-semibold text-white underline-offset-2 hover:underline">
                  How total loss works
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
