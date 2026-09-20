'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { ShieldCheck, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DPDP Act 2023 Compliance Notice</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Privacy Policy & Data Fiduciary Charter
            </h1>
            <p className="mt-3 text-xs text-zinc-500 font-mono">
              Last revised: September 2026 • Compliant with the Digital Personal Data Protection Act, 2023
            </p>
          </FadeIn>

          <div className="mt-10 space-y-8 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                1. Purpose & Scope
              </h2>
              <p>
                VeriSure operates as a digital decision-support and cryptographic verification system for motor insurance claims. We are committed to safeguarding personal information in strict accordance with the Digital Personal Data Protection (DPDP) Act, 2023 of India.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                2. Information Processed
              </h2>
              <p>
                To provide deterministic financial recommendations and cryptographic proof of vehicle history, the platform processes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vehicle identifiers (VIN, registration number, make, model, variant).</li>
                <li>Policy schedules (IDV, deductible structures, NCB percentage, premium amounts).</li>
                <li>Workshop repair estimates (itemized parts costs, labor charges, GST calculations).</li>
                <li>Surveyor inspection assessments and damage evaluation logs.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                3. Cryptographic Hashing & On-Chain Privacy
              </h2>
              <p>
                VeriSure enforces cryptographic minimization on the Hyperledger Fabric ledger. Personally Identifiable Information (PII), such as full owner names, phone numbers, and physical residential addresses, is never written directly to immutable ledger blocks. Instead, records are transformed into salted canonical SHA-256 state hashes. The underlying data remains in encrypted PostgreSQL tables shielded by Row-Level Security.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                4. Policyholder Consent & Revocation
              </h2>
              <p>
                Under Section 6 of the DPDP Act, data sharing across insurers, garages, and independent surveyors requires active policyholder consent. You retain the absolute right to view all active consent grants and revoke data access privileges at any time via the Consent & Privacy portal.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                5. Data Protection Officer Contact
              </h2>
              <p>
                For privacy inquiries or statutory requests under the DPDP Act, contact the platform maintainer at: <span className="font-mono text-zinc-900 dark:text-zinc-100">sathvikkandukuri202@gmail.com</span>.
              </p>
            </section>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
