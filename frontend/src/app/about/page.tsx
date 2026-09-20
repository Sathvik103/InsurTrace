'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SlideUp, SectionReveal, StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';
import { Shield, CheckCircle2, Lock, ArrowRight, Scale, FileText, Cpu, Database } from 'lucide-react';

export default function AboutPage() {
  const principles = [
    {
      icon: Scale,
      title: 'Deterministic Over Speculative',
      description: 'Insurance financial math must never be left to probabilistic guessing or generative language models. Every rupee of deductible, depreciation, and No-Claim Bonus (NCB) loss in VeriSure is calculated through deterministic, audited arithmetic grounded in standard Indian motor tariff guidelines.'
    },
    {
      icon: Lock,
      title: 'Cryptographic State Integrity',
      description: 'Trust in multi-party insurance workflows cannot rely on database honor systems. Every milestone—from workshop estimate upload to surveyor assessment and claim settlement—is canonically hashed using SHA-256 and committed to a Hyperledger Fabric ledger (consortium test network).'
    },
    {
      icon: Shield,
      title: 'DPDP-Aligned Consent Architecture',
      description: 'Vehicle data, claim histories, and repair documents belong to the policyholder. Built with DPDP-aligned consent patterns, data sharing across insurers, garages, and surveyors requires explicit, time-bounded consent grants.'
    },
    {
      icon: FileText,
      title: 'Document Provenance & Transparency',
      description: 'Every extracted value from policy schedules and garage estimates preserves its provenance. The platform transparently tracks whether a figure was extracted by optical parsing, verified by an assessor, or computed by the financial engine.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Our Purpose & Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl leading-tight">
              Rebuilding trust in motor insurance with verifiable intelligence.
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              VeriSure is engineered to eliminate the information asymmetry between vehicle owners, insurance underwriters, licensed surveyors, and authorized repair workshops.
            </p>
          </FadeIn>
        </section>

        {/* The Problem Narrative */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-100 dark:border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                The Core Problem
              </h2>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
                Why motor insurance decisions are broken today
              </h3>
            </div>
            <div className="md:col-span-8 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                When a vehicle suffers damage in India, policyholders face an agonizing dilemma: should they file an insurance claim or pay out of pocket? Filing a claim provides immediate repair reimbursement, but often results in the permanent forfeiture of an accumulated No-Claim Bonus (NCB)—frequently leading to higher premium penalties over consecutive renewal years than the immediate reimbursement value.
              </p>
              <p>
                Simultaneously, insurance underwriters struggle with exaggerated repair estimates and lack of historical damage visibility, while workshops struggle with opaque part depreciation rules and prolonged claim settlement cycles.
              </p>
              <p>
                VeriSure bridges this divide by providing an objective, deterministic financial modeling engine paired with a tamper-evident Hyperledger Fabric ledger that cryptographically records transaction milestones across participating nodes.
              </p>
            </div>
          </div>
        </SectionReveal>

        {/* Core Principles Grid */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Foundational Principles
            </h2>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
              How VeriSure operates
            </h3>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={idx}>
                  <div className="h-full p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </SectionReveal>

        {/* Engineering Rigor Banner */}
        <SectionReveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>MOTOR TARIFF GUIDELINES & MATHEMATICAL CERTAINTY</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Explore the technical architecture
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Review the dual-peer Hyperledger Fabric consensus model, canonical SHA-256 state hashing, and PostgreSQL Row-Level Security isolation.
              </p>
            </div>
            <Link
              href="/technology"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
            >
              <span>View Tech Specs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </SectionReveal>
      </main>

      <PublicFooter />
    </div>
  );
}
