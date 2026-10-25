'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Plus } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { EASE, Reveal } from '@/components/home/fx';

/* ================================================================ architecture */
// Coordinates share one 960 x 540 frame for the boxes (HTML) and the lines (SVG).
type NodeId = 'web' | 'engine' | 'assistant' | 'vercel' | 'api' | 'pdf' | 'auth' | 'db' | 'gateway' | 'fabric';

interface Node {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  zone: 'device' | 'edge' | 'server' | 'data' | 'ledger';
  role: string;
  tech: string[];
  notes: string[];
}

const NODES: Node[] = [
  {
    id: 'web', x: 30, y: 40, w: 230, h: 92, title: 'Web app', sub: 'Next.js · React', zone: 'device',
    role: 'Everything you see and click. Runs in your browser after the first page load.',
    tech: ['Next.js 16 (App Router)', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Framer Motion'],
    notes: ['Signed-in pages call the API with your session token.', 'Public pages and the 26 guide articles are pre-rendered, so they need no server work.'],
  },
  {
    id: 'engine', x: 30, y: 220, w: 230, h: 92, title: 'Claim engine', sub: 'TypeScript, in your browser', zone: 'device',
    role: 'Works out depreciation, deductible, payout, No-Claim Bonus loss, the claim-or-pay verdict, repair-or-sell and fleet triage.',
    tech: ['Fixed rules (depreciation schedule, NCB slabs, IDV cap)', 'Same engine in Python on the server'],
    notes: ['No network request: results appear instantly and your figures stay on your device.', '305 test cases check that the browser and server engines give identical answers, to the paisa.'],
  },
  {
    id: 'assistant', x: 30, y: 400, w: 230, h: 92, title: 'Assistant', sub: 'Guide search, in your browser', zone: 'device',
    role: 'Answers questions from a reviewed guide of 26 entries, and explains your result using the numbers already on screen.',
    tech: ['Keyword and synonym matching', 'No language model'],
    notes: ['It can only say what is written in the guide, so it can’t invent policy rules.', 'When it doesn’t know, it says so.'],
  },
  {
    id: 'vercel', x: 365, y: 112, w: 230, h: 80, title: 'Vercel', sub: 'Pages and CDN', zone: 'edge',
    role: 'Builds the website from GitHub on every push and serves it from a global CDN.',
    tech: ['Static generation', 'Server rendering where needed', 'Automatic HTTPS'],
    notes: ['Sitemap, robots rules and share images are generated here.'],
  },
  {
    id: 'api', x: 365, y: 210, w: 230, h: 112, title: 'ClearClaim API', sub: 'FastAPI · Render (Singapore)', zone: 'server',
    role: 'The only part that can read or write stored data. Checks who you are and what you may see on every request.',
    tech: ['Python 3.12', 'FastAPI', 'Pydantic 2', 'SlowAPI rate limits', 'GZip', 'Docker'],
    notes: [
      'Your sign-in token is verified locally with Supabase’s public keys (cached), so no extra call per request.',
      'Your role comes from the database, never from the browser.',
      'Runs on Render’s free tier, which sleeps when idle: the first request can take 30 to 60 seconds.',
    ],
  },
  {
    id: 'pdf', x: 365, y: 410, w: 230, h: 92, title: 'PDF reader', sub: 'PyMuPDF, inside the API', zone: 'server',
    role: 'Pulls IDV, No-Claim Bonus, deductible and repair lines out of text-based PDFs, with the page each value came from.',
    tech: ['PyMuPDF', 'Rules, not AI'],
    notes: ['Up to 10 MB, checked to really be a PDF.', 'The file is read in memory and not stored.', 'Scanned or photographed pages can’t be read yet.'],
  },
  {
    id: 'auth', x: 700, y: 20, w: 230, h: 82, title: 'Supabase Auth', sub: 'Sign-in', zone: 'data',
    role: 'Creates accounts and issues signed session tokens.',
    tech: ['ES256-signed tokens', 'Published public keys (JWKS)'],
    notes: ['Sign-up can only create car owner, fleet or workshop accounts.'],
  },
  {
    id: 'db', x: 700, y: 150, w: 230, h: 92, title: 'Postgres', sub: 'Supabase', zone: 'data',
    role: 'Stores accounts, organisations, vehicles, saved checks, sharing grants and the audit log.',
    tech: ['PostgreSQL', '16 tables', 'SQL migrations in the repo'],
    notes: ['Only the API holds the database key; the browser never talks to the database directly.'],
  },
  {
    id: 'gateway', x: 700, y: 290, w: 230, h: 92, title: 'Fabric gateway', sub: 'Node.js · optional', zone: 'ledger',
    role: 'A small service the API calls to write and read fingerprints on the ledger.',
    tech: ['Node.js', 'Express', 'fabric-network SDK', 'API-key protected'],
    notes: ['In local development the API can drive the ledger directly through the Fabric command line instead.'],
  },
  {
    id: 'fabric', x: 700, y: 430, w: 230, h: 92, title: 'Fabric network', sub: '2 peers · Raft orderer', zone: 'ledger',
    role: 'Holds SHA-256 fingerprints of saved records, so later edits can be detected.',
    tech: ['Hyperledger Fabric 2.5', 'Chaincode in JavaScript: RecordEvent, GetVehicleHistory, VerifyEvent'],
    notes: ['A test network. It is not connected to the live site right now, so new records wait as “pending” until it is.', 'Only fingerprints go on the ledger, never names or contact details.'],
  },
];

type EdgeId = string;
const EDGES: { id: EdgeId; a: NodeId; b: NodeId; label: string }[] = [
  { id: 'web-vercel', a: 'web', b: 'vercel', label: 'pages' },
  { id: 'web-engine', a: 'web', b: 'engine', label: 'in browser' },
  { id: 'web-assistant', a: 'web', b: 'assistant', label: 'in browser' },
  { id: 'web-auth', a: 'web', b: 'auth', label: 'sign in' },
  { id: 'web-api', a: 'web', b: 'api', label: 'HTTPS + token' },
  { id: 'api-auth', a: 'api', b: 'auth', label: 'public keys' },
  { id: 'api-db', a: 'api', b: 'db', label: 'SQL' },
  { id: 'api-pdf', a: 'api', b: 'pdf', label: 'in process' },
  { id: 'api-gateway', a: 'api', b: 'gateway', label: 'HTTPS + key' },
  { id: 'gateway-fabric', a: 'gateway', b: 'fabric', label: 'gRPC' },
];

const ZONE: Record<Node['zone'], { label: string; dot: string }> = {
  device: { label: 'Your device', dot: 'bg-signal-600' },
  edge: { label: 'Edge', dot: 'bg-navy-400' },
  server: { label: 'Our server', dot: 'bg-steel-600' },
  data: { label: 'Managed data', dot: 'bg-steel-400' },
  ledger: { label: 'Ledger', dot: 'bg-loss' },
};

/* ================================================================ flows */
interface Step {
  text: string;
  nodes: NodeId[];
  edges: EdgeId[];
}
const FLOWS: { id: string; label: string; steps: Step[] }[] = [
  {
    id: 'check',
    label: 'Run a claim check',
    steps: [
      { text: 'You enter the car, the damage and your policy details in the web app.', nodes: ['web'], edges: [] },
      { text: 'The claim engine calculates the result in your browser. No request leaves your device.', nodes: ['web', 'engine'], edges: ['web-engine'] },
      { text: 'Ask the assistant and it explains the result from the numbers already on screen, also on-device.', nodes: ['web', 'assistant'], edges: ['web-assistant'] },
    ],
  },
  {
    id: 'save',
    label: 'Save a record',
    steps: [
      { text: 'You press “Save claim record”. The app sends the result to the API with your session token.', nodes: ['web', 'api'], edges: ['web-api'] },
      { text: 'The API checks the token against Supabase’s public keys (cached) and loads your role from the database.', nodes: ['api', 'auth', 'db'], edges: ['api-auth', 'api-db'] },
      { text: 'It checks the vehicle is yours, stores the claim, and computes a SHA-256 fingerprint of the record.', nodes: ['api', 'db'], edges: ['api-db'] },
      { text: 'The fingerprint is sent through the gateway to the Fabric network (RecordEvent).', nodes: ['api', 'gateway', 'fabric'], edges: ['api-gateway', 'gateway-fabric'] },
      { text: 'The ledger status is saved as committed, or pending if the ledger is offline. Retrying later is safe: it never anchors twice.', nodes: ['api', 'db', 'web'], edges: ['api-db', 'web-api'] },
    ],
  },
  {
    id: 'pdf',
    label: 'Read a PDF',
    steps: [
      { text: 'You drop a policy or estimate PDF. The app uploads it to the API.', nodes: ['web', 'api'], edges: ['web-api'] },
      { text: 'The API checks size (10 MB) and that it really is a PDF, then the reader pulls out the figures with their page numbers.', nodes: ['api', 'pdf'], edges: ['api-pdf'] },
      { text: 'The figures come back for you to review. The file itself is not stored.', nodes: ['web', 'api'], edges: ['web-api'] },
      { text: 'After you check them, they go straight into a claim check in your browser.', nodes: ['web', 'engine'], edges: ['web-engine'] },
    ],
  },
  {
    id: 'share',
    label: 'Share with a workshop',
    steps: [
      { text: 'You choose a car, a workshop and how long it may see the records.', nodes: ['web', 'api'], edges: ['web-api'] },
      { text: 'The API stores the grant and writes an audit-log entry.', nodes: ['api', 'db'], edges: ['api-db'] },
      { text: 'When the workshop opens the car, the API checks ownership or an active grant on every request. Anything else returns “not found”.', nodes: ['api', 'db'], edges: ['api-db'] },
    ],
  },
  {
    id: 'verify',
    label: 'Verify a record',
    steps: [
      { text: 'You ask to verify a saved record.', nodes: ['web', 'api'], edges: ['web-api'] },
      { text: 'The API recomputes the fingerprint from the record as it is stored now.', nodes: ['api', 'db'], edges: ['api-db'] },
      { text: 'It reads the anchored fingerprint from the ledger (VerifyEvent) and compares the two: a match means unchanged since saving.', nodes: ['api', 'gateway', 'fabric'], edges: ['api-gateway', 'gateway-fabric'] },
    ],
  },
];

const center = (n: Node) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, Node>;

function Architecture() {
  const reduce = useReducedMotion();
  const [flowId, setFlowId] = useState(FLOWS[1].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [picked, setPicked] = useState<NodeId>('api');
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
    <section id="architecture" className="scroll-mt-24 bg-[#f6f5f0] px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-steel-700">Architecture</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-navy-950 sm:text-5xl">Ten parts, three places.</h2>
          <p className="mt-4 text-lg text-navy-500">Some of ClearClaim runs on your device, some on our server, and some with managed services. Pick a journey to watch a request move through it, or click any part for details.</p>
        </Reveal>

        {/* Flow picker */}
        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Journeys">
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === flowId}
              onClick={() => chooseFlow(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${f.id === flowId ? 'bg-navy-950 text-white' : 'bg-white text-navy-700 ring-1 ring-navy-100 hover:ring-navy-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Diagram */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-navy-100 bg-white">
          <div className="relative mx-auto min-w-[760px]" style={{ aspectRatio: '960 / 540' }}>
            {/* zones */}
            {[
              { x: 15, w: 260, label: 'Your device' },
              { x: 350, w: 260, label: 'Edge and our server' },
              { x: 685, w: 260, label: 'Managed services and ledger' },
            ].map((z) => (
              <div key={z.label} className="absolute top-[1.5%] bottom-[1.5%] rounded-xl border border-dashed border-navy-100" style={{ left: `${(z.x / 960) * 100}%`, width: `${(z.w / 960) * 100}%` }}>
                <span className="absolute -top-0 left-3 -translate-y-1/2 bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">{z.label}</span>
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
                    lit ? 'border-navy-950 bg-navy-950 text-white shadow-[0_14px_28px_-16px_rgba(20,19,16,0.7)]' : 'border-navy-200 bg-white text-navy-950 hover:border-navy-400'
                  } ${sel ? 'ring-2 ring-signal-600 ring-offset-2' : ''}`}
                  style={{ left: `${(n.x / 960) * 100}%`, top: `${(n.y / 540) * 100}%`, width: `${(n.w / 960) * 100}%`, height: `${(n.h / 540) * 100}%` }}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    <span className={`h-1.5 w-1.5 rounded-full ${ZONE[n.zone].dot}`} />
                    {ZONE[n.zone].label}
                  </span>
                  <span className="mt-1 font-display text-base font-semibold leading-tight">{n.title}</span>
                  <span className={`text-xs ${lit ? 'text-white/60' : 'text-navy-500'}`}>{n.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step controls */}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-navy-950 p-5 text-white sm:flex-row sm:items-center">
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
              className="flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-sm font-semibold text-navy-950"
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
            className="mt-4 grid gap-6 rounded-2xl border border-navy-100 bg-white p-6 md:grid-cols-[1fr_1fr_1.2fr]"
          >
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-navy-400">
                <span className={`h-1.5 w-1.5 rounded-full ${ZONE[node.zone].dot}`} /> {ZONE[node.zone].label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-navy-950">{node.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{node.role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Built with</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {node.tech.map((t) => (
                  <li key={t} className="rounded-md bg-[#f6f5f0] px-2 py-1 text-xs font-medium text-navy-800 ring-1 ring-navy-100">{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Worth knowing</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-navy-600">
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

/* ================================================================ stack */
const STACK: { group: string; items: { name: string; version?: string; why: string }[] }[] = [
  {
    group: 'Frontend',
    items: [
      { name: 'Next.js', version: '16.3', why: 'Pre-renders public pages for speed and search, and hosts the app in one codebase.' },
      { name: 'React', version: '19.2', why: 'Component model for the interactive tools.' },
      { name: 'TypeScript', version: '5', why: 'Catches mistakes in money calculations before they ship.' },
      { name: 'Tailwind CSS', version: '4', why: 'Design tokens (colours, type, spacing) in one place.' },
      { name: 'Framer Motion', version: '13', why: 'Animations that switch off when your device asks for reduced motion.' },
      { name: 'Sonner and Lucide', why: 'Notifications and icons.' },
    ],
  },
  {
    group: 'Backend',
    items: [
      { name: 'Python', version: '3.12', why: 'The original claim engine and PDF reading live here.' },
      { name: 'FastAPI', version: '0.141', why: 'Typed request validation and automatic API docs.' },
      { name: 'Pydantic', version: '2.13', why: 'Validates every input and the server settings at start-up.' },
      { name: 'PyMuPDF', version: '1.28', why: 'Reads text and positions from PDFs, so each value can cite its page.' },
      { name: 'SlowAPI', version: '0.1', why: 'Per-client rate limits on sensitive endpoints.' },
      { name: 'PyJWT', version: '2.14', why: 'Verifies sign-in tokens locally against cached public keys.' },
    ],
  },
  {
    group: 'Data and identity',
    items: [
      { name: 'Supabase Postgres', why: 'Relational data with foreign keys; migrations kept in the repo.' },
      { name: 'Supabase Auth', why: 'Email sign-in with ES256-signed tokens.' },
    ],
  },
  {
    group: 'Ledger',
    items: [
      { name: 'Hyperledger Fabric', version: '2.5', why: 'Permissioned ledger: known organisations, no cryptocurrency, no public mining.' },
      { name: 'Fabric chaincode (JavaScript)', why: 'RecordEvent, GetVehicleHistory and VerifyEvent.' },
      { name: 'Node.js gateway', why: 'Express service the API calls, protected by an API key.' },
    ],
  },
  {
    group: 'Hosting and quality',
    items: [
      { name: 'Vercel', why: 'Builds and serves the website on every push to main.' },
      { name: 'Render', why: 'Runs the API in a Docker container in Singapore.' },
      { name: 'pytest', why: '63 backend tests: access rules, ledger states, uploads, tokens.' },
      { name: 'Golden tests', why: '305 cases keep the browser and server engines identical.' },
      { name: 'ESLint and TypeScript checks', why: 'Run before each release; not yet automated in CI.' },
    ],
  },
];

function Stack() {
  const [group, setGroup] = useState(STACK[0].group);
  const items = STACK.find((g) => g.group === group)!.items;
  return (
    <section id="stack" className="scroll-mt-24 bg-white px-5 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="text-sm font-semibold text-steel-700">Stack</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-navy-950">What it’s made of, and why.</h2>
          <div className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:items-start">
            {STACK.map((g) => (
              <button
                key={g.group}
                type="button"
                onClick={() => setGroup(g.group)}
                aria-pressed={g.group === group}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${g.group === group ? 'bg-navy-950 text-white' : 'text-navy-600 hover:bg-[#f6f5f0]'}`}
              >
                {g.group} <span className="ml-1 font-mono text-xs opacity-50">{STACK.find((s) => s.group === g.group)!.items.length}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.ul key={group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="grid gap-3 sm:grid-cols-2">
            {items.map((it, i) => (
              <motion.li key={it.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-navy-100 p-5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg font-semibold text-navy-950">{it.name}</span>
                  {it.version && <span className="font-mono text-xs text-navy-400">v{it.version}</span>}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{it.why}</p>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ================================================================ data model */
const TABLES: { name: string; holds: string; links: string[] }[] = [
  { name: 'profiles', holds: 'Each account and its role', links: ['organizations', 'ownership_history', 'consents', 'audit_logs'] },
  { name: 'organizations', holds: 'Fleets, workshops, insurers, surveyors', links: ['profiles', 'consents', 'policies'] },
  { name: 'vehicles', holds: 'Registration, make, model, IDV, NCB', links: ['ownership_history', 'policies', 'claims', 'consents', 'documents'] },
  { name: 'ownership_history', holds: 'Who registered each vehicle', links: ['vehicles', 'profiles'] },
  { name: 'policies', holds: 'Policy number, IDV, deductible, dates', links: ['vehicles', 'organizations', 'claims'] },
  { name: 'claims', holds: 'Saved claim checks and their figures', links: ['vehicles', 'policies', 'ledger_references', 'documents'] },
  { name: 'ledger_references', holds: 'Fingerprint, ledger status, transaction ID', links: ['claims'] },
  { name: 'consents', holds: 'Who may see which vehicle, until when', links: ['vehicles', 'organizations', 'profiles'] },
  { name: 'documents', holds: 'Metadata of read documents (not the file)', links: ['claims', 'vehicles'] },
  { name: 'audit_logs', holds: 'Grants, revocations and other changes', links: ['profiles'] },
];

function DataModel() {
  const [sel, setSel] = useState('claims');
  const t = TABLES.find((x) => x.name === sel)!;
  const linked = useMemo(() => new Set(t.links), [t]);
  return (
    <section id="data" className="scroll-mt-24 bg-[#f6f5f0] px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-steel-700">Data model</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-navy-950">Where the data lives.</h2>
          <p className="mt-4 text-lg text-navy-500">The main tables in Postgres. Click one to see what it connects to. The schema has six more (accidents, repairs, repair items, service events, policy add-ons and model outputs) that today’s screens don’t use.</p>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {TABLES.map((x) => {
              const isSel = x.name === sel;
              const isLink = linked.has(x.name);
              return (
                <button
                  key={x.name}
                  type="button"
                  onClick={() => setSel(x.name)}
                  aria-pressed={isSel}
                  className={`rounded-xl border p-3 text-left transition duration-300 ${isSel ? 'border-navy-950 bg-navy-950 text-white' : isLink ? 'border-signal-600 bg-white' : 'border-navy-100 bg-white opacity-60 hover:opacity-100'}`}
                >
                  <span className="block truncate font-mono text-xs font-semibold">{x.name}</span>
                  <span className={`mt-1 block text-[11px] leading-snug ${isSel ? 'text-white/60' : 'text-navy-500'}`}>{x.holds}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-navy-100 bg-white p-6">
              <p className="font-mono text-sm font-semibold text-navy-950">{t.name}</p>
              <p className="mt-1 text-sm text-navy-500">{t.holds}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-navy-400">Connected to</p>
              <ul className="mt-2 space-y-1.5">
                {t.links.map((l) => (
                  <li key={l}>
                    <button type="button" onClick={() => setSel(l)} className="font-mono text-sm text-steel-700 underline-offset-2 hover:underline">{l}</button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ================================================================ trade-offs */
const TRADEOFFS = [
  {
    title: 'Calculations run in the browser',
    gain: 'Instant results, no server cost per check, and your figures never leave your device.',
    cost: 'The same rules exist in TypeScript and Python. 305 shared test cases keep them identical.',
  },
  {
    title: 'Fingerprints on a ledger, data in Postgres',
    gain: 'Records stay private and quick to read; the ledger only proves they weren’t edited later.',
    cost: 'A second system to run. It proves a record is unchanged, not that what it describes is true.',
  },
  {
    title: 'Access checks in the API, not database row rules',
    gain: 'One place to read and test every rule; cross-account access is covered by tests.',
    cost: 'The API must never leak its database key. It lives only in server settings.',
  },
  {
    title: 'Rules-based PDF reading, no AI',
    gain: 'Predictable, explainable, and every value cites its page.',
    cost: 'Only text-based PDFs work. Scanned pages need to be typed in.',
  },
  {
    title: 'A guide-based assistant, no language model',
    gain: 'Free, instant, and it can’t invent policy rules.',
    cost: 'It only answers what the guide covers, and says so when it can’t.',
  },
  {
    title: 'Exact fleet optimisation, with a cap',
    gain: 'Up to 12 incidents per vehicle, every claim/pay combination is tried (4,096), so the plan is truly the cheapest.',
    cost: 'Above 12 it switches to a fast rule of thumb that may miss the very best plan.',
  },
  {
    title: 'Free hosting tiers',
    gain: 'Costs nothing to run while the product is young.',
    cost: 'The API sleeps when idle, so the first request can take 30 to 60 seconds. The app shows a waking-up message.',
  },
];

function Tradeoffs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="tradeoffs" className="scroll-mt-24 bg-white px-5 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="text-sm font-semibold text-steel-700">Trade-offs</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-navy-950">Every choice cost something.</h2>
          <p className="mt-4 text-navy-500">What we chose, what it bought, and what we gave up for it.</p>
        </Reveal>
        <div className="border-t border-navy-100">
          {TRADEOFFS.map((t, i) => {
            const isOpen = open === i;
            return (
              <div key={t.title} className="border-b border-navy-100">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="font-display text-xl font-semibold tracking-tight text-navy-950">{t.title}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-navy-400 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                      <div className="grid gap-3 pb-6 sm:grid-cols-2">
                        <div className="rounded-xl bg-gain-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gain">What it buys</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-navy-800">{t.gain}</p>
                        </div>
                        <div className="rounded-xl bg-loss-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-loss">What it costs</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-navy-800">{t.cost}</p>
                        </div>
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

/* ================================================================ scalability */
const SCALE = [
  { area: 'Claim checks', today: 'Run in each visitor’s browser, so more users add no server load.', next: 'Nothing to change: this part scales with the number of devices.' },
  { area: 'Public pages', today: 'Pre-rendered and served from Vercel’s CDN.', next: 'Already global; new guide articles are generated at build time.' },
  { area: 'API', today: 'One stateless container on Render’s free tier. Tokens are verified locally, profiles cached for 60 seconds, status for 30.', next: 'Run several instances behind a load balancer on a paid plan so it never sleeps. Move the in-memory caches to a shared cache such as Redis.' },
  { area: 'Database', today: 'Lists load in a fixed number of queries (no query per row), with lookups by key.', next: 'Connection pooling, indexes tuned from real traffic, and a read replica for history pages.' },
  { area: 'Ledger writes', today: 'Done while saving; if the ledger is down the record is kept as pending and can be retried safely.', next: 'Move anchoring to a background queue that batches fingerprints, and run peers for each participating organisation.' },
  { area: 'PDF reading', today: 'In the API process, one file at a time per request, 10 MB cap.', next: 'Move to a separate worker so large files never slow other requests; add scanned-page support.' },
  { area: 'Abuse', today: 'Per-client rate limits, size limits and strict input validation.', next: 'Add a web application firewall and per-account quotas.' },
];

function Scalability() {
  const [mode, setMode] = useState<'today' | 'next'>('today');
  return (
    <section id="scale" className="scroll-mt-24 vs-grain relative overflow-hidden bg-navy-950 px-5 py-20 text-white lg:py-28">
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-signal">Scalability</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl">What holds up, and what changes next.</h2>
          </Reveal>
          <div className="flex rounded-lg bg-white/10 p-1" role="tablist" aria-label="View">
            {(['today', 'next'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${mode === m ? 'bg-signal text-navy-950' : 'text-white/70 hover:text-white'}`}>
                {m === 'today' ? 'Today' : 'At scale'}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {SCALE.map((s) => (
            <li key={s.area} className="grid gap-2 py-5 md:grid-cols-[200px_1fr]">
              <p className="font-display text-lg font-semibold">{s.area}</p>
              <AnimatePresence mode="wait">
                <motion.p key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="leading-relaxed text-white/70">
                  {mode === 'today' ? s.today : s.next}
                </motion.p>
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ================================================================ numbers */
function Numbers() {
  const stats = [
    ['10', 'system parts'],
    ['16', 'database tables'],
    ['305', 'engine parity tests'],
    ['63', 'backend tests'],
    ['26', 'guide articles'],
    ['0', 'AI-generated numbers'],
  ];
  return (
    <section className="border-b border-navy-100 bg-white px-5 py-12">
      <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-6 md:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={v}>
            <dt className="font-display text-3xl font-semibold tracking-tight text-navy-950">{k}</dt>
            <dd className="mt-1 text-xs text-navy-500">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function SystemPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          compact
          eyebrow="System"
          title="How ClearClaim"
          accent="works inside."
          body="The parts, how a request moves between them, the tools we used, the trade-offs we made and how it would grow. Everything here describes the system as it runs today."
          actions={
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                ['#architecture', 'Architecture'],
                ['#stack', 'Stack'],
                ['#data', 'Data model'],
                ['#tradeoffs', 'Trade-offs'],
                ['#scale', 'Scalability'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="rounded-lg border border-white/20 px-3 py-1.5 font-medium text-white/80 transition hover:bg-white/10 hover:text-white">{label}</a>
              ))}
            </div>
          }
        />
        <Numbers />
        <Architecture />
        <Stack />
        <DataModel />
        <Tradeoffs />
        <Scalability />
        <section className="bg-white px-5 py-16">
          <p className="mx-auto max-w-6xl text-sm text-navy-500">
            The code is open: <a href="https://github.com/Sathvik103/InsurTrace" target="_blank" rel="noreferrer" className="font-semibold text-navy-950 underline-offset-2 hover:underline">github.com/Sathvik103/InsurTrace</a>. For what we protect and how, see{' '}
            <Link href="/security" className="font-semibold text-navy-950 underline-offset-2 hover:underline">Security</Link>.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
