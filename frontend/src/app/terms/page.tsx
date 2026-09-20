'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <Scale className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Platform Terms</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Terms of Service
            </h1>
            <p className="mt-3 text-xs text-zinc-500 font-mono">
              Effective Date: September 2026
            </p>
          </FadeIn>

          <div className="mt-10 space-y-8 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or utilizing the VeriSure platform, including its decision engines, document intelligence tools, and Hyperledger Fabric verification services, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                2. Nature of the Service
              </h2>
              <p>
                VeriSure provides mathematical decision-support, document analysis, and cryptographic record keeping for motor insurance workflows. The platform does not issue insurance policies, assess physical risk as an underwriter, or directly adjudicate insurance contracts.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                3. User Responsibilities & Data Accuracy
              </h2>
              <p>
                Users are responsible for ensuring that uploaded policy schedules, vehicle inspection images, and workshop estimates are genuine and unaltered. Submitting fraudulent claims or forged garage estimates constitutes grounds for immediate account termination and potential statutory referral under applicable Indian law.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                4. Cryptographic Record Immutability
              </h2>
              <p>
                Users acknowledge that transactions committed to the Hyperledger Fabric ledger are cryptographically sealed. While relational database records may be amended in accordance with statutory rights, on-chain hash checkpoints serve as permanent proofs of state at the time of commitment.
              </p>
            </section>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
