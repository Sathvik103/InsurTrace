'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { EASE, Reveal } from '@/components/home/fx';
import { EDGES, FLOWS, Node, NodeId, NODES, ZONE } from '@/content/system';
import { SequenceDiagram } from './SequenceDiagram';

const center = (n: Node) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, Node>;

export function Architecture() {
  const reduce = useReducedMotion();
  const [flowId, setFlowId] = useState(FLOWS[1].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [picked, setPicked] = useState<NodeId>('api');
  const [view, setView] = useState<'map' | 'sequence'>('map');
  const flow = FLOWS.find((f) => f.id === flowId)!;
  const current = flow.steps[step];

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < flow.steps.length - 1) setStep(step + 1);
      else setPlaying(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [playing, step, flow.steps.length]);

  const litNodes = new Set(current.nodes);
  const litEdges = new Set(current.edges);
  const seenEdges = new Set(flow.steps.slice(0, step).flatMap((s) => s.edges));
  const node = byId[picked];

  const chooseFlow = (id: string) => {
    setFlowId(id);
    setStep(0);
    setPlaying(false);
  };

  return (
    <section id="architecture" className="scroll-mt-24 bg-paper px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-forest-700">Architecture</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950 sm:text-5xl">Ten parts, three places.</h2>
          <p className="mt-4 text-lg text-ink-500">Some of ClearClaim runs on your device, some on our server, and some with managed services. Pick a journey to watch a request move through it, or click any part for details.</p>
        </Reveal>

        {/* Flow picker and view switch */}
        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Journeys">
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === flowId}
              onClick={() => chooseFlow(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${f.id === flowId ? 'bg-ink-950 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:ring-ink-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="inline-flex w-fit rounded-lg bg-white p-1 ring-1 ring-ink-100" role="tablist" aria-label="Diagram style">
          {(['map', 'sequence'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${view === v ? 'bg-ink-950 text-white' : 'text-ink-600 hover:text-ink-950'}`}>
              {v === 'map' ? 'Map' : 'Sequence'}
            </button>
          ))}
        </div>
        </div>

        {/* Diagram: map of the parts, or the same journey as a sequence of messages */}
        {view === 'sequence' ? (
          <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-4">
            <SequenceDiagram steps={flow.steps} step={step} />
          </div>
        ) : (
          <>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <div className="relative mx-auto min-w-[760px]" style={{ aspectRatio: '960 / 540' }}>
            {/* zones */}
            {[
              { x: 15, w: 260, label: 'Your device' },
              { x: 350, w: 260, label: 'Edge and our server' },
              { x: 685, w: 260, label: 'Managed services and ledger' },
            ].map((z) => (
              <div key={z.label} className="absolute top-[1.5%] bottom-[1.5%] rounded-xl border border-dashed border-ink-100" style={{ left: `${(z.x / 960) * 100}%`, width: `${(z.w / 960) * 100}%` }}>
                <span className="absolute -top-0 left-3 -translate-y-1/2 bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{z.label}</span>
              </div>
            ))}

            <svg viewBox="0 0 960 540" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {EDGES.map((e) => {
                const a = center(byId[e.a]);
                const b = center(byId[e.b]);
                const lit = litEdges.has(e.id);
                const seen = seenEdges.has(e.id);
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                return (
                  <g key={e.id}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? '#b7862c' : seen ? '#857d6d' : '#d4cebf'} strokeWidth={lit ? 3 : 1.5} strokeDasharray={lit ? '8 6' : undefined}>
                      {lit && !reduce && <animate attributeName="stroke-dashoffset" from="28" to="0" dur="0.8s" repeatCount="indefinite" />}
                    </line>
                    <text x={mx} y={my - 6} textAnchor="middle" fontSize="11" fill={lit ? '#8a6219' : '#ada594'} style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 4 }}>
                      {e.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {NODES.map((n) => {
              const lit = litNodes.has(n.id);
              const sel = picked === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setPicked(n.id)}
                  aria-pressed={sel}
                  className={`absolute flex flex-col justify-center rounded-xl border px-3 text-left transition duration-300 ${
                    lit ? 'border-ink-950 bg-ink-950 text-white shadow-[0_14px_28px_-16px_rgba(20,19,16,0.7)]' : 'border-ink-200 bg-white text-ink-950 hover:border-ink-400'
                  } ${sel ? 'ring-2 ring-signal-600 ring-offset-2' : ''}`}
                  style={{ left: `${(n.x / 960) * 100}%`, top: `${(n.y / 540) * 100}%`, width: `${(n.w / 960) * 100}%`, height: `${(n.h / 540) * 100}%` }}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    <span className={`h-1.5 w-1.5 rounded-full ${ZONE[n.zone].dot}`} />
                    {ZONE[n.zone].label}
                  </span>
                  <span className="mt-1 font-display text-base font-semibold leading-tight">{n.title}</span>
                  <span className={`text-xs ${lit ? 'text-white/60' : 'text-ink-500'}`}>{n.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

          </>
        )}

        {/* Step controls */}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-ink-950 p-5 text-white sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }} disabled={step === 0} aria-label="Previous step" className="rounded-lg border border-white/20 p-2 transition hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!playing && step === flow.steps.length - 1) setStep(0);
                setPlaying((p) => !p);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-sm font-semibold text-ink-950"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={() => { setPlaying(false); setStep(Math.min(flow.steps.length - 1, step + 1)); }} disabled={step === flow.steps.length - 1} aria-label="Next step" className="rounded-lg border border-white/20 p-2 transition hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-white/45">Step {step + 1} of {flow.steps.length}</p>
            <AnimatePresence mode="wait">
              <motion.p key={`${flowId}-${step}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-1 leading-relaxed">
                {current.text}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 gap-1" aria-hidden="true">
            {flow.steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-sm transition-colors ${i <= step ? 'bg-signal' : 'bg-white/15'}`} />
            ))}
          </div>
        </div>

        {/* Node details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={node.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-4 grid gap-6 rounded-2xl border border-ink-100 bg-white p-6 md:grid-cols-[1fr_1fr_1.2fr]"
          >
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
                <span className={`h-1.5 w-1.5 rounded-full ${ZONE[node.zone].dot}`} /> {ZONE[node.zone].label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950">{node.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{node.role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Built with</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {node.tech.map((t) => (
                  <li key={t} className="rounded-md bg-paper px-2 py-1 text-xs font-medium text-ink-800 ring-1 ring-ink-100">{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Worth knowing</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-600">
                {node.notes.map((t) => (
                  <li key={t} className="border-l-2 border-signal-600 pl-3">{t}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
