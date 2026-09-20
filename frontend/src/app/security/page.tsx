'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SectionReveal, StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';
import { Shield, Lock, Eye, KeyRound, CheckCircle2, FileCheck2, Database } from 'lucide-react';

export default function SecurityPage() {
  const securityControls = [
    {
      icon: Database,
      title: 'PostgreSQL Row-Level Security (RLS)',
      desc: 'All database queries are executed with RLS policies enforced at the PostgreSQL kernel level. Users can never query records outside their authorized role or organization, eliminating horizontal privilege escalation vulnerabilities.'
    },
    {
      icon: Lock,
      title: 'Dual-Layer Identity & Authoritative Roles',
      desc: 'Supabase Auth handles ECDSA (ES256) JWT signing. Role and organization claims are validated authoritatively against the profiles database table by FastAPI dependencies, completely preventing client-side role manipulation.'
    },
    {
      icon: FileCheck2,
      title: 'Hyperledger Fabric Tamper-Evidence',
      desc: 'Claim events and vehicle milestones are converted into canonical SHA-256 digests and sealed on Hyperledger Fabric ledger blocks (Consortium Test Network). Out-of-band database tampering is flagged instantly by the system integrity auditor. Blockchain verifies data integrity after commitment, establishing tamper-evidence rather than independently proving physical ground truth.'
    },
    {
      icon: Eye,
      title: 'DPDP-Aligned Consent Lifecycle',
      desc: 'No repair invoice or vehicle history record is accessible by external parties without an active, cryptographically recorded consent grant. Policyholders can inspect active permissions and revoke consent instantly.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Security, Privacy & RLS Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl leading-tight">
              Zero-trust data security engineered for financial verification.
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              VeriSure employs defense-in-depth architecture across database access controls, cryptographic ledgers, and identity federation.
            </p>
          </FadeIn>
        </section>

        {/* Security Controls Grid */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityControls.map((item, idx) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={idx}>
                  <div className="h-full p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </SectionReveal>

        {/* Cryptographic Proof Model */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-100 dark:border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Data Sealing Model
              </h2>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
                Canonical SHA-256 Ledger Sealing
              </h3>
            </div>
            <div className="md:col-span-8 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                To guarantee that database records cannot be silently modified by rogue administrators or compromised servers, VeriSure calculates a canonical SHA-256 hash of every critical transaction state:
              </p>
              <div className="bg-zinc-900 text-zinc-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-zinc-800">
                SHA-256(canonical_json(claim_id, policy_number, vehicle_vin, parts_estimate, net_payable, timestamp))
              </div>
              <p>
                This hash is committed to the Hyperledger Fabric channel. When a user or auditor inspects a claim, the system recalculates the live database hash and compares it against the on-chain consortium block hash. Any discrepancy indicates immediate unauthorized state mutation.
              </p>
            </div>
          </div>
        </SectionReveal>
      </main>

      <PublicFooter />
    </div>
  );
}
