'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowRight, ScanLine } from 'lucide-react';
import { calculateDecision, lineDepreciation, RULE_VERSION } from '@/lib/engine';
import { rupees } from '@/lib/claimCheck';
import { CountUp, EASE, Magnetic, SplitWords } from './fx';

/* ---------------------------------------------------------------- example */
// A fictional example, run through the same engine as a real check.
const AGE = 3;
const POLICY = { idv: 650000, deductible: 1000, ncb_percentage: 35, zero_depreciation_addon: false, rule_version: RULE_VERSION };
const PREMIUM = 22000;

type Part = { name: string; category: 'metal' | 'plastic' | 'glass'; cost: number; x: number; y: number };
const PARTS: Part[] = [
  { name: 'Rear door', category: 'metal', cost: 14500, x: 262, y: 138 },
  { name: 'Windshield', category: 'glass', cost: 11200, x: 452, y: 92 },
  { name: 'Bonnet', category: 'metal', cost: 16800, x: 540, y: 116 },
  { name: 'Headlamp', category: 'plastic', cost: 6400, x: 588, y: 130 },
  { name: 'Front bumper', category: 'plastic', cost: 9800, x: 600, y: 156 },
];
const LABOUR = 7400;

const CAT_WORD = { metal: 'metal', plastic: 'plastic', glass: 'glass' } as const;

/* ---------------------------------------------------------------- car art */
const BODY =
  'M36 168 C34 150 40 133 64 127 L156 112 C188 84 224 66 284 62 L404 60 C446 60 474 78 506 104 L566 115 C594 120 606 136 606 156 L606 168 C606 174 602 178 596 178 L522 178 A44 44 0 0 0 438 178 L198 178 A44 44 0 0 0 114 178 L46 178 C40 178 36 174 36 168 Z';
const WINDOWS = ['M188 110 C210 88 238 76 284 74 L330 73 L332 110 Z', 'M346 73 L402 72 C434 72 458 86 480 108 L348 110 Z'];
const SKELETON = [
  'M64 127 L566 115', // waistline
  'M338 73 L338 172', // B-pillar / door seam
  'M196 112 L198 172', // rear door seam
  'M480 108 L486 172', // A-pillar / front door
  'M506 104 L512 132 L600 136', // bonnet line
  'M60 150 L110 150 M530 150 L604 150', // bumper lines
];

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={178} r={34} />
      <circle cx={cx} cy={178} r={14} />
      {[0, 60, 120].map((a) => (
        <line key={a} x1={cx + 14 * Math.cos((a * Math.PI) / 180)} y1={178 + 14 * Math.sin((a * Math.PI) / 180)} x2={cx + 30 * Math.cos((a * Math.PI) / 180)} y2={178 + 30 * Math.sin((a * Math.PI) / 180)} />
      ))}
    </g>
  );
}

function CarLines({ skeleton }: { skeleton?: boolean }) {
  return (
    <>
      <path d={BODY} />
      {WINDOWS.map((d) => <path key={d} d={d} />)}
      <path d="M576 124 C588 124 598 128 602 136 L584 138 C578 134 576 130 576 124 Z" />
      <path d="M40 136 L58 132 L60 146 L40 148 Z" />
      <path d="M300 118 L322 118 M440 118 L462 118" strokeLinecap="round" />
      <Wheel cx={156} />
      <Wheel cx={480} />
      {skeleton && SKELETON.map((d) => <path key={d} d={d} strokeDasharray="4 5" />)}
      {skeleton && <rect x={520} y={122} width={58} height={34} rx={6} strokeDasharray="3 4" />}
    </>
  );
}

/* ---------------------------------------------------------------- scanner */
function Scanner() {
  const reduce = useReducedMotion();
  const beam = useMotionValue(reduce ? 700 : -60);
  const [seen, setSeen] = useState(reduce ? PARTS.length : 0);
  const maskX = useTransform(beam, (v) => v - 90);
  const glowX = useTransform(beam, (v) => v - 40);

  const result = useMemo(
    () =>
      calculateDecision({
        vehicle: { age_years: AGE },
        policy: POLICY,
        repair_items: [...PARTS.map((p) => ({ category: p.category, cost: p.cost })), { category: 'labour', cost: LABOUR }],
        estimated_base_premium_next_year: PREMIUM,
      }),
    []
  );

  useMotionValueEvent(beam, 'change', (v) => {
    const n = PARTS.filter((p) => p.x < v).length;
    setSeen((prev) => (prev === n ? prev : n));
  });

  useEffect(() => {
    if (reduce) return;
    const c = animate(beam, [-60, 700], { duration: 3.4, ease: 'easeInOut', delay: 0.9, repeat: Infinity, repeatDelay: 5.5 });
    return () => c.stop();
  }, [beam, reduce]);

  const done = seen === PARTS.length;
  const verdict = result.recommendation === 'CLAIM' ? 'Claim it' : result.recommendation === 'SELF-PAY' ? 'Pay it yourself' : 'Close call';

  return (
    <div className="relative rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_40px_120px_-40px_rgba(212,242,92,0.25)] backdrop-blur-sm sm:p-6">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        <span className="flex items-center gap-2"><ScanLine className="h-3.5 w-3.5 text-signal" /> Quote X-ray</span>
        <span>Example · 3-yr-old car</span>
      </div>

      {/* Car */}
      <svg viewBox="0 20 640 210" className="mt-3 w-full" role="img" aria-label="A car being scanned part by part">
        <defs>
          <linearGradient id="beam" x1="0" x2="1">
            <stop offset="0" stopColor="#d4f25c" stopOpacity="0" />
            <stop offset="0.5" stopColor="#d4f25c" stopOpacity="0.35" />
            <stop offset="1" stopColor="#d4f25c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="reveal" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="scan">
            <motion.rect x={maskX} y={0} width={180} height={260} fill="url(#reveal)" />
          </mask>
        </defs>

        <g fill="rgba(127,192,230,0.035)" stroke="rgba(181,219,241,0.35)" strokeWidth={1.4} strokeLinejoin="round">
          <CarLines />
        </g>
        <g mask="url(#scan)" fill="rgba(212,242,92,0.07)" stroke="#d4f25c" strokeWidth={1.6} strokeLinejoin="round">
          <CarLines skeleton />
        </g>
        <line x1={20} x2={620} y1={214} y2={214} stroke="rgba(255,255,255,0.08)" />

        {!reduce && (
          <>
            <motion.rect x={glowX} y={30} width={80} height={190} fill="url(#beam)" />
            <motion.rect x={beam} y={30} width={1.5} height={190} fill="#d4f25c" />
          </>
        )}

        {PARTS.map((p, i) => (
          <g key={p.name}>
            {i < seen && (
              <>
                <motion.circle cx={p.x} cy={p.y} r={5} fill="#d4f25c" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} />
                {!reduce && (
                  <motion.circle cx={p.x} cy={p.y} r={5} fill="none" stroke="#d4f25c" initial={{ r: 5, opacity: 0.9 }} animate={{ r: 18, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />
                )}
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Readout */}
      <ul className="mt-2 space-y-1 font-mono text-[12px] sm:text-[13px]">
        {PARTS.map((p, i) => {
          const dep = lineDepreciation(p.category, p.cost, AGE, false);
          const pct = Math.round((dep / p.cost) * 100);
          return (
            <li key={p.name} className="relative grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-1.5">
              <AnimatePresence>
                {i < seen && (
                  <motion.span layoutId={undefined} initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="absolute inset-0 origin-left rounded-lg bg-white/[0.04]" />
                )}
              </AnimatePresence>
              <span className={`relative truncate transition-colors duration-300 ${i < seen ? 'text-white' : 'text-white/25'}`}>
                {p.name} <span className="hidden text-white/40 sm:inline">· {CAT_WORD[p.category]}</span>
              </span>
              <span className={`relative transition-colors duration-300 ${i < seen ? 'text-white/70' : 'text-white/20'}`}>{rupees(p.cost)}</span>
              <span className={`relative w-[104px] whitespace-nowrap text-right transition-colors duration-300 ${i < seen ? (pct ? 'text-ember' : 'text-signal') : 'text-white/20'}`}>
                {i < seen ? (pct ? `−${pct}% yours` : 'fully covered') : '—'}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Verdict */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        {[
          { k: 'Insurer pays', v: result.estimated_payout, c: 'text-white' },
          { k: 'You pay now', v: result.immediate_out_of_pocket, c: 'text-white' },
          { k: 'Bonus lost', v: result.future_ncb_impact, c: 'text-ember' },
        ].map((s) => (
          <div key={s.k}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{s.k}</p>
            <p className={`mt-1 font-display text-lg font-semibold sm:text-2xl ${s.c}`}>{done ? <CountUp key={`${s.k}-${seen}`} value={s.v} start /> : <span className="text-white/20">₹ —</span>}</p>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="v" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: EASE }} className="mt-4 flex items-center justify-between rounded-2xl bg-signal px-4 py-3 text-navy-950">
            <span className="font-display text-lg font-semibold">{verdict}</span>
            <span className="text-sm font-medium">saves about {rupees(Math.abs(result.estimated_saving))}</span>
          </motion.div>
        ) : (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-white/45">
            <span className="h-2 w-2 animate-pulse rounded-full bg-signal" /> Scanning the quote…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------------- hero */
export function Hero({ checkHref }: { checkHref: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const light = useTransform([mx, my], ([x, y]) => `radial-gradient(700px circle at ${x}% ${y}%, rgba(69,160,214,0.18), transparent 60%)`);

  return (
    <section
      className="vs-grain relative isolate overflow-hidden bg-navy-950 text-white"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* Atmosphere */}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: light }} />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[480px] w-[480px] rounded-full bg-steel-600/20 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-[380px] w-[380px] rounded-full bg-signal/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-20%] bottom-[-10%] -z-10 h-[55%] opacity-70">
        <div className="vs-floor h-full w-full" />
      </div>

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pb-16 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-24">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-xs font-medium text-white/70"
          >
            <span className="rounded-full bg-signal px-2 py-0.5 font-semibold text-navy-950">Free</span>
            For car owners, fleets and workshops in India
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(3.1rem,9vw,6.8rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
            <SplitWords text="Claim it," delay={0.15} />
            <br />
            <SplitWords text="or pay it" delay={0.3} className="text-white/55" />
            <br />
            <span className="relative inline-block">
              <SplitWords text="yourself?" delay={0.45} className="text-signal" />
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 300 20"
                className="absolute -bottom-2 left-0 w-full"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
              >
                <motion.path
                  d="M4 14 C 80 4, 200 4, 296 12"
                  fill="none"
                  stroke="#d4f25c"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1.1, ease: EASE }}
                />
              </motion.svg>
            </span>
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-white/65"
          >
            A small claim can cost more than the repair once you lose your No-Claim Bonus. ClearClaim X-rays the workshop quote and shows, line by line, what your insurer
            pays, what you pay, and which choice is cheaper.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <Link href={checkHref} className="vs-btn-signal group w-full py-4 pl-7 pr-2 sm:w-auto">
                Check my claim
                <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 text-signal transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Magnetic>
            <Link href="/xray" className="vs-btn-ghost-dark py-4">
              X-ray a repair quote <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.dl
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6"
          >
            {[
              ['2 min', 'to an answer'],
              ['0', 'sales calls'],
              ['100%', 'math shown'],
            ].map(([k, v]) => (
              <div key={v}>
                <dt className="font-display text-2xl font-semibold text-white">{k}</dt>
                <dd className="mt-0.5 text-xs text-white/45">{v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60, rotateX: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
          style={{ transformPerspective: 1200 }}
        >
          <Scanner />
        </motion.div>
      </div>
    </section>
  );
}
