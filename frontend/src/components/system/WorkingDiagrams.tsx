'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Reveal } from '@/components/home/fx';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { calculateDecision, metalDepreciation, nextNcb, RULE_VERSION } from '@/lib/engine';
import { NCB_STEPS, rupees } from '@/lib/claimCheck';
import { FlowGraph, GraphEdge, GraphNode } from './FlowGraph';

const TABS = [
  { id: 'calc', label: 'How a result is worked out' },
  { id: 'ledger', label: 'Saving to the ledger' },
  { id: 'reading', label: 'Reading a document' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** Working diagrams: each one runs on real logic or real states, not a picture of them. */
export function WorkingDiagrams() {
  const [tab, setTab] = useState<Tab>('calc');
  return (
    <section id="working" className="scroll-mt-24 bg-white px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-forest-700">Working diagrams</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950 sm:text-5xl">See the logic run.</h2>
          <p className="mt-4 text-lg text-ink-500">Change the inputs or play a scenario. The calculation uses the same engine as the claim check.</p>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Diagrams">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-ink-950 text-white' : 'bg-paper text-ink-700 hover:bg-ink-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-5">
            {tab === 'calc' && <CalcPipeline />}
            {tab === 'ledger' && <LedgerStates />}
            {tab === 'reading' && <ReadingPipeline />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- calculation */
const PREMIUM = 18000;
const IDV = 600000;
const DEDUCTIBLE = 1000;
type Material = 'plastic' | 'metal' | 'glass' | 'mixed';

function Stage({ title, value, note, tone = 'plain', op }: { title: string; value: number; note?: string; tone?: 'plain' | 'dark' | 'loss' | 'gain'; op?: string }) {
  const cls = {
    plain: 'border-ink-100 bg-white text-ink-950',
    dark: 'border-ink-950 bg-ink-950 text-white',
    loss: 'border-loss/30 bg-loss-soft text-ink-950',
    gain: 'border-gain/30 bg-gain-soft text-ink-950',
  }[tone];
  return (
    <div className={`relative min-w-0 flex-1 rounded-xl border p-4 ${cls}`}>
      {op && <span className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950 font-mono text-xs text-white md:flex">{op}</span>}
      <p className={`text-xs font-medium ${tone === 'dark' ? 'text-white/60' : 'text-ink-500'}`}>{title}</p>
      <AnimatedNumber value={value} duration={0.4} className="mt-1 block font-display text-2xl font-semibold tracking-tight" />
      {note && <p className={`mt-1 text-[11px] leading-snug ${tone === 'dark' ? 'text-white/50' : 'text-ink-400'}`}>{note}</p>}
    </div>
  );
}

function Lane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{title}</p>
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-5">{children}</div>
    </div>
  );
}

function CalcPipeline() {
  const [bill, setBill] = useState(25000);
  const [material, setMaterial] = useState<Material>('plastic');
  const [age, setAge] = useState(3);
  const [ncb, setNcb] = useState(35);

  const r = useMemo(
    () =>
      calculateDecision({
        vehicle: { age_years: age },
        policy: { idv: IDV, deductible: DEDUCTIBLE, ncb_percentage: ncb, zero_depreciation_addon: false, rule_version: RULE_VERSION },
        repair_items: material === 'mixed' ? [{ category: 'metal', cost: bill / 2 }, { category: 'plastic', cost: bill / 2 }] : [{ category: material, cost: bill }],
        estimated_base_premium_next_year: PREMIUM,
      }),
    [bill, material, age, ncb]
  );
  const depNote = { plastic: 'plastic: 50%', metal: `metal at ${age} yrs: ${Math.round(metalDepreciation(age) * 100)}%`, glass: 'glass: 0%', mixed: `half plastic (50%), half metal (${Math.round(metalDepreciation(age) * 100)}%)` }[material];
  const rule = r.recommendation === 'CLAIM' ? 0 : r.recommendation === 'SELF-PAY' ? 1 : 2;

  return (
    <div className="grid gap-6 rounded-2xl border border-ink-100 bg-paper p-5 lg:grid-cols-[260px_1fr] lg:p-7">
      {/* Inputs */}
      <div className="space-y-5">
        <label className="block">
          <span className="flex justify-between text-sm font-medium text-ink-800">Repair bill <span className="font-mono text-ink-950">{rupees(bill)}</span></span>
          <input type="range" min={2000} max={300000} step={1000} value={bill} onChange={(e) => setBill(Number(e.target.value))} className="mt-2 w-full accent-ink-950" />
        </label>
        <div>
          <span className="text-sm font-medium text-ink-800">Mostly</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(['plastic', 'metal', 'glass', 'mixed'] as Material[]).map((m) => (
              <button key={m} type="button" onClick={() => setMaterial(m)} aria-pressed={material === m} className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${material === m ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-100'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="flex justify-between text-sm font-medium text-ink-800">Car age <span className="font-mono text-ink-950">{age} yrs</span></span>
          <input type="range" min={0} max={10} step={1} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-2 w-full accent-ink-950" />
        </label>
        <div>
          <span className="text-sm font-medium text-ink-800">No-Claim Bonus now</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NCB_STEPS.map((n) => (
              <button key={n} type="button" onClick={() => setNcb(n)} aria-pressed={ncb === n} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${ncb === n ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-100'}`}>
                {n}%
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-ink-400">Fixed for this example: IDV {rupees(IDV)}, deductible {rupees(DEDUCTIBLE)}, renewal premium {rupees(PREMIUM)}, no zero-dep cover.</p>
      </div>

      {/* Pipeline */}
      <div className="space-y-6">
        <Lane title="1 · What the insurer pays">
          <Stage title="Repair bill" value={r.total_estimate} />
          <Stage op="−" title="Depreciation" value={r.depreciation_deduction} note={depNote} tone="loss" />
          <Stage op="−" title="Deductible" value={r.deductible_deduction} note="always yours" tone="loss" />
          <Stage op="=" title="Insurer pays" value={r.estimated_payout} note={r.estimated_payout >= IDV ? 'capped at your IDV' : 'never more than your IDV'} tone="gain" />
        </Lane>
        <Lane title="2 · What claiming costs you">
          <Stage title="You pay the workshop" value={r.immediate_out_of_pocket} note="bill − insurer pays" />
          <Stage op="+" title="Bonus lost next year" value={r.future_ncb_impact} note={`${nextNcb(ncb, false)}% of ${rupees(PREMIUM)}`} tone="loss" />
          <Stage op="=" title="Cost of claiming" value={r.effective_claim_cost} tone="dark" />
        </Lane>
        <Lane title="3 · The decision">
          <Stage title="Cost of paying yourself" value={r.self_pay_cost} note="the whole bill, bonus kept" />
          <Stage op="−" title="Cost of claiming" value={r.effective_claim_cost} />
          <div className="min-w-0 flex-[1.4] rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-xs font-medium text-ink-500">Claiming saves</p>
            <p className={`font-display text-2xl font-semibold tracking-tight ${r.estimated_saving >= 0 ? 'text-ink-950' : 'text-loss'}`}>
              {r.estimated_saving < 0 ? '−' : ''}
              {rupees(Math.abs(r.estimated_saving))}
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {['More than ₹2,000 → claim', 'Less than −₹1,000 → pay yourself', 'In between → close call'].map((t, i) => (
                <li key={t} className={`rounded-md px-2 py-1 transition ${rule === i ? 'bg-signal font-semibold text-ink-950' : 'text-ink-400'}`}>{t}</li>
              ))}
            </ul>
          </div>
        </Lane>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- scenario player */
function useScenario(paths: Record<string, string[]>, initial: string) {
  const [scenario, setScenario] = useState(initial);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const path = paths[scenario];
  // Playback stops by itself at the last state.
  const running = playing && i < path.length - 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setI((x) => x + 1), 1100);
    return () => clearTimeout(t);
  }, [running, i]);
  const play = (s: string) => {
    setScenario(s);
    setI(0);
    setPlaying(true);
  };
  const shown = path.slice(0, i + 1);
  const litEdges = new Set(shown.slice(1).map((n, k) => `${shown[k]}>${n}`));
  return { scenario, play, litNodes: new Set(shown), litEdges, current: shown[shown.length - 1] };
}

function ScenarioButtons({ items, active, onPlay }: { items: [string, string][]; active: string; onPlay: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onPlay(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${active === id ? 'bg-ink-950 text-white' : 'bg-paper text-ink-700 hover:bg-ink-100'}`}>
          <Play className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- ledger states */
const L_NODES: GraphNode[] = [
  { id: 'saved', x: 90, y: 150, label: 'Saved', sub: 'record in Postgres' },
  { id: 'pending', x: 300, y: 55, label: 'Pending', sub: 'ledger offline' },
  { id: 'failed', x: 300, y: 245, label: 'Failed', sub: 'ledger rejected it' },
  { id: 'committed', x: 500, y: 150, label: 'Committed', sub: 'fingerprint on ledger' },
  { id: 'unchanged', x: 720, y: 75, label: 'Unchanged', sub: 'hashes match' },
  { id: 'changed', x: 720, y: 225, label: 'Changed', sub: 'hashes differ' },
];
const L_EDGES: GraphEdge[] = [
  { from: 'saved', to: 'committed', label: 'accepted' },
  { from: 'saved', to: 'pending', label: 'offline' },
  { from: 'saved', to: 'failed', label: 'rejected' },
  { from: 'pending', to: 'committed', label: 'retry' },
  { from: 'failed', to: 'committed', label: 'retry' },
  { from: 'committed', to: 'unchanged', label: 'verify' },
  { from: 'committed', to: 'changed', label: 'verify after edit' },
];
const L_INFO: Record<string, string> = {
  saved: 'The claim is stored first and its SHA-256 fingerprint computed, so the record is safe whatever the ledger does next.',
  pending: 'The ledger could not be reached. The record is kept with status pending and can be retried at any time.',
  failed: 'The ledger answered but did not accept the transaction. The error is stored and the record can be retried.',
  committed: 'The fingerprint is on the ledger with a transaction ID. Retrying again does nothing: a record is never anchored twice.',
  unchanged: 'Recomputing the fingerprint from the stored record gives the same value as the ledger: nothing has been edited.',
  changed: 'The stored record no longer matches its anchored fingerprint, so someone changed it after it was saved.',
};
const L_PATHS: Record<string, string[]> = {
  online: ['saved', 'committed', 'unchanged'],
  offline: ['saved', 'pending', 'committed', 'unchanged'],
  rejected: ['saved', 'failed', 'committed'],
  edited: ['saved', 'committed', 'changed'],
};

function LedgerStates() {
  const s = useScenario(L_PATHS, 'offline');
  const [picked, setPicked] = useState('pending');
  const info = s.current ?? picked;
  return (
    <div className="space-y-4 rounded-2xl border border-ink-100 p-5 lg:p-7">
      <ScenarioButtons
        items={[['online', 'Ledger online'], ['offline', 'Offline, then retry'], ['rejected', 'Rejected, then retry'], ['edited', 'Record edited later']]}
        active={s.scenario}
        onPlay={s.play}
      />
      <FlowGraph nodes={L_NODES} edges={L_EDGES} width={820} height={300} litNodes={s.litNodes} litEdges={s.litEdges} current={s.current} picked={picked} onPick={setPicked} />
      <p className="rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink-700">
        <span className="font-semibold text-ink-950">{L_NODES.find((n) => n.id === info)?.label}: </span>
        {L_INFO[info]}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- document reading */
const R_NODES: GraphNode[] = [
  { id: 'upload', x: 85, y: 160, label: 'Upload', sub: 'PDF or photo, ≤ 10 MB' },
  { id: 'kind', x: 245, y: 160, label: 'File type?', shape: 'diamond' },
  { id: 'text', x: 400, y: 80, label: 'Text inside?', shape: 'diamond' },
  { id: 'plumber', x: 575, y: 50, label: 'pdfplumber', sub: 'reads text + tables' },
  { id: 'ocr', x: 575, y: 260, label: 'Tesseract OCR', sub: 'reads the image' },
  { id: 'rules', x: 760, y: 160, label: 'Find the fields', sub: 'rules + page numbers' },
  { id: 'review', x: 760, y: 280, label: 'You review', sub: 'then claim check' },
];
const R_EDGES: GraphEdge[] = [
  { from: 'upload', to: 'kind' },
  { from: 'kind', to: 'text', label: 'PDF' },
  { from: 'kind', to: 'ocr', label: 'photo' },
  { from: 'text', to: 'plumber', label: 'yes' },
  { from: 'text', to: 'ocr', label: 'no (scan)' },
  { from: 'plumber', to: 'rules' },
  { from: 'ocr', to: 'rules', label: 'marked less certain' },
  { from: 'rules', to: 'review' },
];
const R_PATHS: Record<string, string[]> = {
  digital: ['upload', 'kind', 'text', 'plumber', 'rules', 'review'],
  scanned: ['upload', 'kind', 'text', 'ocr', 'rules', 'review'],
  photo: ['upload', 'kind', 'ocr', 'rules', 'review'],
};

function ReadingPipeline() {
  const s = useScenario(R_PATHS, 'photo');
  return (
    <div className="space-y-4 rounded-2xl border border-ink-100 p-5 lg:p-7">
      <ScenarioButtons items={[['digital', 'Digital PDF'], ['scanned', 'Scanned PDF'], ['photo', 'Phone photo']]} active={s.scenario} onPlay={s.play} />
      <FlowGraph nodes={R_NODES} edges={R_EDGES} width={860} height={320} litNodes={s.litNodes} litEdges={s.litEdges} current={s.current} />
      <p className="text-sm text-ink-500">The file is read in memory and never stored. Only the first three pages of a scan are read with OCR, where policy schedules put the key figures.</p>
    </div>
  );
}
