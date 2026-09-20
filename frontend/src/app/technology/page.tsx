'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SectionReveal, StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';
import { Cpu, Database, Network, ShieldCheck, Code2, Server, ArrowRight, Layers, FileCheck } from 'lucide-react';

export default function TechnologyPage() {
  const stack = [
    {
      icon: Network,
      layer: 'Consensus & Ledger Layer',
      tech: 'Hyperledger Fabric 2.5 (Dual-Peer Raft Consortium Test Network)',
      details: [
        'Dual-peer consortium test network (Org1 & Org2) with crash fault-tolerant (CFT) Raft ordering service.',
        'VehicleHistory chaincode deployed with strict state endorsement policies.',
        'Canonical JSON serialization and SHA-256 deterministic hashing across all event records.',
        'Node.js Fabric Gateway integration with automatic certificate management and wallet persistence.'
      ]
    },
    {
      icon: Database,
      layer: 'Data Storage & Security Layer',
      tech: 'PostgreSQL 15 & Supabase Row-Level Security',
      details: [
        '16 relational tables with strict foreign-key integrity constraints and audit timestamps.',
        'Fine-grained PostgreSQL Row-Level Security (RLS) enforcing tenant and user isolation at the SQL engine level.',
        'Bcrypt password hashing and ECDSA (ES256) JWT cryptographic token issuance.',
        'Authoritative role resolution via server-side profile lookups preventing frontend privilege escalation.'
      ]
    },
    {
      icon: Server,
      layer: 'Backend Application Services',
      tech: 'FastAPI & Python 3.11 Architecture',
      details: [
        'High-performance async ASGI architecture with Pydantic v2 strict type validation.',
        'Deterministic claim financial decision engine executing standard Indian motor tariff depreciation and NCB step-down algorithms.',
        'Document intelligence pipeline utilizing PyMuPDF and OCR for structured policy and estimate extraction.',
        'Tamper-detection subsystem continuously auditing relational state against Hyperledger Fabric block hashes.'
      ]
    },
    {
      icon: Layers,
      layer: 'Client Presentation Layer',
      tech: 'Next.js 14 App Router & React 18',
      details: [
        'Modular workspace routing with granular role-based UI views (Policyholder, Insurer, Surveyor, Garage, Admin).',
        'Framer Motion micro-interactions with native prefers-reduced-motion accessibility compliance.',
        'Tabular typography and monospace formatting for unambiguous financial and hash inspections.',
        'Recharts interactive sensitivity modeling visualizing multi-year NCB break-even curves.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Header */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <Cpu className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Full System Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl leading-tight">
              Enterprise-grade infrastructure built for absolute auditability.
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              VeriSure combines deterministic arithmetic, relational integrity, and distributed ledger technology to create a zero-trust insurance intelligence network.
            </p>
          </FadeIn>
        </section>

        {/* Stack Layers */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {stack.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 sm:p-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {item.layer}
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {item.tech}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </SectionReveal>

        {/* Deterministic Math Deep Dive */}
        <SectionReveal id="math" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-100 dark:border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Mathematical Model
              </h2>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
                The Claim vs. Self-Pay Decision Formula
              </h3>
            </div>
            <div className="md:col-span-8 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-900 dark:text-zinc-100 font-bold font-sans text-sm mb-2">
                Objective Function:
              </div>
              <p className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                Net Cost (Claim) = Compulsory Deductible + Voluntary Deductible + Unadmitted Parts + Parts Depreciation + 3-Year Future NCB Loss Penalty
              </p>
              <p className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                Net Cost (Self-Pay) = Total Garage Estimate - Direct Workshop Discount
              </p>
              <p className="text-zinc-500 font-sans text-xs pt-2">
                If Net Cost (Claim) &gt; Net Cost (Self-Pay), VeriSure advises self-funding the repair to protect multi-year NCB discount accumulation.
              </p>
            </div>
          </div>
        </SectionReveal>

        {/* Verification CTA */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold">Inspect the Ledger Live</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Verify SHA-256 canonical hashing and real-time block validation on our test network console.
              </p>
            </div>
            <Link
              href="/verification"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0"
            >
              Open Verification Console
            </Link>
          </div>
        </SectionReveal>
      </main>

      <PublicFooter />
    </div>
  );
}
