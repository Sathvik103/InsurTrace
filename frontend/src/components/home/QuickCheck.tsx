'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { analyzeClaim, EngineResult, NCB_STEPS, rupees, verdictFor } from '@/lib/claimCheck';
import { describeApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const AGES = [
  { label: 'Under 1 yr', years: 0.8 },
  { label: '1–3 yrs', years: 2 },
  { label: '3–5 yrs', years: 4 },
  { label: '5+ yrs', years: 7 },
];

// Stated example assumptions; the full check uses the user's own policy.
const EXAMPLE = { idv: 600000, deductible: 1000, premium: 14000 };

/** Live, sign-in-free preview of the claim check, computed by the real engine. */
export function QuickCheck() {
  const [bill, setBill] = useState(25000);
  const { status: authStatus } = useAuth();
  const checkHref = authStatus === 'authenticated' ? '/decision' : '/login?next=%2Fdecision';
  const [ncb, setNcb] = useState(35);
  const [age, setAge] = useState(2);
  const [plastic, setPlastic] = useState(true);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setBusy(true);
      try {
        const r = await analyzeClaim(
          { vehicleAgeYears: age, idv: EXAMPLE.idv, deductible: EXAMPLE.deductible, ncbPercentage: ncb, zeroDep: false, nextYearPremium: EXAMPLE.premium },
          [{ category: plastic ? 'plastic' : 'metal', cost: bill }],
          c.signal
        );
        setResult(r);
        setError(null);
      } catch (e) {
        if (!c.signal.aborted) setError(describeApiError(e).title);
      } finally {
        if (!c.signal.aborted) setBusy(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [bill, ncb, age, plastic]);

  const verdict = result ? verdictFor(result) : null;
  const toneColor = verdict?.tone === 'claim' ? 'bg-gain' : verdict?.tone === 'selfpay' ? 'bg-forest-600' : 'bg-amber-500';

  return (
    <div className="vs-surface relative p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Try it: quick check</p>
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-gain" />}
          {busy ? 'Calculating' : 'Live result'}
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="qc-bill" className="text-xs font-medium text-ink-600">Repair bill</label>
            <span className="tabular text-xl font-semibold text-ink-900">{rupees(bill)}</span>
          </div>
          <input id="qc-bill" type="range" min={3000} max={150000} step={1000} value={bill} onChange={(e) => setBill(Number(e.target.value))} className="mt-2 w-full accent-ink-900" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((p) => (
            <button key={String(p)} type="button" onClick={() => setPlastic(p)} aria-pressed={plastic === p} className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${plastic === p ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-100 bg-white text-ink-700 hover:border-ink-300'}`}>
              {p ? 'Bumper / plastic part' : 'Door / metal panel'}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-ink-600">Your No-Claim Bonus</p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {NCB_STEPS.map((n) => (
              <button key={n} type="button" onClick={() => setNcb(n)} aria-pressed={ncb === n} className={`rounded-lg py-1.5 text-xs font-semibold transition ${ncb === n ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:ring-ink-300'}`}>
                {n}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-600">Car age</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {AGES.map((a) => (
              <button key={a.label} type="button" onClick={() => setAge(a.years)} aria-pressed={age === a.years} className={`rounded-lg py-1.5 text-[11px] font-semibold transition ${age === a.years ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:ring-ink-300'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-ink-100">
        {error && !result ? (
          <p className="text-sm text-ink-600">{error}. The live preview needs the ClearClaim server.</p>
        ) : result && verdict ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={verdict.tone} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${toneColor}`} />
                <p className="text-base font-semibold text-ink-900">{verdict.headline}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-ink-500">Insurer might pay</p>
                <AnimatedNumber value={result.estimated_payout} duration={0.5} className="text-xl font-semibold text-gain" />
              </div>
              <div>
                <p className="text-[11px] text-ink-500">Claiming costs you</p>
                <AnimatedNumber value={result.effective_claim_cost} duration={0.5} className="text-xl font-semibold text-ink-900" />
                <p className="text-[10px] text-ink-400">incl. lost NCB</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="vs-shimmer h-5 w-2/3 rounded-lg" />
            <div className="vs-shimmer h-8 w-full rounded-lg" />
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
        Example assumptions: ₹1,000 deductible, ₹14,000 renewal premium, no zero-dep cover. The full check uses your own policy.
      </p>
      <Link href={checkHref} className="vs-btn-primary mt-4 w-full">
        Do the full check with my policy <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
