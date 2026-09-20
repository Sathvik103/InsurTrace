'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, ArrowRight, CheckCircle2, ChevronRight, Car, FileText, 
  Database, UploadCloud, Key, ShieldCheck, Lock, Activity, Scale, 
  HelpCircle, Eye, Sparkles, RefreshCw, BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { 
  FadeIn, SlideUp, SectionReveal, StaggerContainer, StaggerItem 
} from '@/components/motion/MotionPrimitives';
import { formatINR } from '@/lib/formatters';

export default function HomePage() {
  const [sliderRepairCost, setSliderRepairCost] = useState(42500);

  // Dynamic interactive calculation based on standard Indian Motor Tariff rules
  // 3-year old vehicle, metal part (20% dep), 2000 deductible, 20% NCB on 15k base premium
  const depreciation = Math.round(sliderRepairCost * 0.20);
  const deductible = 2000;
  const admissibleClaim = Math.max(0, sliderRepairCost - depreciation - deductible);
  const ncbLoss3Year = 8400; // 3-year projected NCB stepback
  const effectiveClaimCost = deductible + ncbLoss3Year;
  const netAdvantage = admissibleClaim - ncbLoss3Year;
  const shouldClaim = netAdvantage > 0;

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-50">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>VeriSure Infrastructure 2.0</span>
                  <span className="text-zinc-400">•</span>
                  <span>Hyperledger Fabric Verified</span>
                </div>
              </FadeIn>

              <SlideUp delay={0.2} distance={24}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.12]">
                  Insurance decisions backed by{' '}
                  <span className="text-zinc-600 dark:text-zinc-400 font-bold">evidence</span>,{' '}
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">financial clarity</span>, and{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">verified vehicle history</span>.
                </h1>
              </SlideUp>

              <SlideUp delay={0.3} distance={20}>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
                  VeriSure unifies policy terms, itemized garage estimates, depreciation mathematics, and immutable blockchain records into one transparent decision workspace for vehicle owners, insurers, surveyors, and workshops.
                </p>
              </SlideUp>

              <SlideUp delay={0.4} distance={16}>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href="/decision"
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
                  >
                    <span>Explore Decision Engine</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="#architecture"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-all"
                  >
                    <span>See How It Works</span>
                  </Link>
                </div>
              </SlideUp>

              <FadeIn delay={0.5}>
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>IRDAI Tariff Compliant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Dual-Peer Raft Blockchain</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Zero Fabricated Data</span>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Hero Interactive Visual Assembly */}
            <div className="lg:col-span-5">
              <SlideUp delay={0.3} distance={24}>
                <div className="relative mx-auto max-w-md rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                  {/* Visual Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">MH-02-CB-1234</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Hyundai Creta SX • 3 Years Old</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                      <ShieldCheck className="w-3 h-3" />
                      Ledger Verified
                    </span>
                  </div>

                  {/* Assembled Data Nodes */}
                  <div className="space-y-3.5 py-4 text-xs">
                    {/* Node 1: Policy */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Comprehensive Policy</p>
                          <p className="text-[10px] text-zinc-500">IDV: ₹5,00,000 • NCB: 20%</p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">₹1,000 Ded.</span>
                    </div>

                    {/* Node 2: Workshop Estimate */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Workshop Estimate</p>
                          <p className="text-[10px] text-zinc-500">Front Bumper & Fender (Metal 20%)</p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">₹42,500</span>
                    </div>

                    {/* Node 3: Mathematical Outcome */}
                    <div className="p-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-950 dark:border dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Calculated Admissible Claim</span>
                        <span className="font-mono font-bold text-emerald-400">₹32,000</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">3-Year NCB Step-back Loss</span>
                        <span className="font-mono text-amber-400">-₹8,400</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-300">Net Financial Advantage</span>
                        <span className="font-mono font-bold text-sm text-emerald-400">+₹23,600</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolved Decision Pill */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Engine Recommendation:</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                      FILE A CLAIM
                    </span>
                  </div>
                </div>
              </SlideUp>
            </div>

          </div>
        </div>
      </section>

      {/* Section: The Problem VeriSure Solves */}
      <SectionReveal className="py-20 bg-zinc-50/60 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Information Asymmetry in Indian Motor Claims
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Why motor insurance decisions are difficult today
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Motorists, insurers, and body shops routinely operate with disconnected data, leading to predatory repair estimates, opaque depreciation penalties, and unexpected out-of-pocket costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white border border-zinc-200/80 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Opaque Depreciation Math</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Indian Motor Tariff rules mandate up to 50% depreciation on plastic, rubber, and aging metal parts. Policyholders rarely realize how little will be paid out until the final settlement arrives.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-zinc-200/80 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/50">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Uncounted Future NCB Loss</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Filing a minor ₹15,000 claim can reset a 50% No Claim Bonus to 0%, quietly increasing renewals by ₹18,000+ over the next three years. Without calculation, policyholders lose money by claiming.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-zinc-200/80 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Unverified Vehicle Records</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Accident dossiers and repair estimates are easily manipulated or altered across internal databases. VeriSure anchors canonical records to Hyperledger Fabric for cryptographic auditability.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Section: Live Interactive Financial Decision Showcase */}
      <SectionReveal className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Deterministic Financial Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Evaluate Claim vs Self-Pay instantly
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                Move the repair estimate slider to watch the engine mathematically simulate admissible claim payout against deductible deductions and 3-year projected NCB step-back penalties in real time.
              </p>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400">Simulated Repair Estimate</span>
                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50">{formatINR(sliderRepairCost)}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="2500"
                  value={sliderRepairCost}
                  onChange={(e) => setSliderRepairCost(Number(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>₹10,000 (Minor repair)</span>
                  <span>₹50,000</span>
                  <span>₹1,00,000 (Major overhaul)</span>
                </div>
              </div>

              <div>
                <Link
                  href="/decision"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                >
                  <span>Launch full decision workspace with custom policy upload</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Live Comparative Ledger Table */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Comparative Financial Outcome</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    shouldClaim 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {shouldClaim ? 'CLAIM RECOMMENDED' : 'SELF-PAY RECOMMENDED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                  {/* Option 1: Claim */}
                  <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
                    <p className="font-bold text-xs uppercase tracking-wider text-zinc-500">Option A: File a Claim</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Estimated Payout:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatINR(admissibleClaim)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Compulsory Deductible:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{formatINR(deductible)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Depreciation (20% Metal):</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{formatINR(depreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">3-Yr NCB Penalty:</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400">+{formatINR(ncbLoss3Year)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700 flex justify-between font-bold text-zinc-900 dark:text-zinc-50">
                      <span>Effective Claim Cost:</span>
                      <span className="font-mono">{formatINR(effectiveClaimCost)}</span>
                    </div>
                  </div>

                  {/* Option 2: Self-Pay */}
                  <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
                    <p className="font-bold text-xs uppercase tracking-wider text-zinc-500">Option B: Pay Out-of-Pocket</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Immediate Workshop Bill:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatINR(sliderRepairCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Insurance Payout:</span>
                      <span className="font-mono text-zinc-400">₹0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">NCB Retention (Progression):</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">Preserved</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Renewal Premium Savings:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">-{formatINR(ncbLoss3Year)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700 flex justify-between font-bold text-zinc-900 dark:text-zinc-50">
                      <span>Total Net Outlay:</span>
                      <span className="font-mono">{formatINR(sliderRepairCost - ncbLoss3Year)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-100/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {shouldClaim
                        ? `Filing a claim yields a net financial benefit of ${formatINR(netAdvantage)} over 3 years.`
                        : `Paying out of pocket avoids resetting your NCB, saving ${formatINR(Math.abs(netAdvantage))} over 3 years.`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </SectionReveal>

      {/* Section: Architecture & Cryptographic Flow */}
      <section id="architecture" className="py-20 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              VeriSure Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Records should be verifiable, not merely stored
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Every accident record, policy extraction, and repair estimate is deterministically hashed with SHA-256 and committed to a dual-peer Hyperledger Fabric ledger with Raft consensus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 01</span>
              <div className="w-8 h-8 rounded-lg bg-blue-900/40 text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Document Ingestion</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Genuine Indian motor policies & workshop bills parsed with field-level provenance metadata.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 02</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-900/40 text-indigo-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Canonical State Hash</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Deterministic SHA-256 state fingerprint created from vehicle, timestamp, and line item costs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 03</span>
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 text-purple-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Fabric Transaction</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Committed via Node.js REST Gateway to dual-peer Org1/Org2 consortium with Raft consensus.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 04</span>
              <div className="w-8 h-8 rounded-lg bg-amber-900/40 text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">PostgreSQL RLS Storage</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Encrypted database record stored with Fabric transaction reference ID and tenant isolation.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 05</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-900/40 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Integrity Audit</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Real-time cryptographic hash verification detects database tampering immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Role-Based Operational Ecosystem */}
      <SectionReveal className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Role-Tailored Workspaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Engineered for the entire insurance lifecycle
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Each stakeholder accesses an intentional, purpose-built interface enforcing Row-Level Security (RLS) and DPDP consent permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Policyholder */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Policyholder</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Financial Clarity</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Claim Decision Workspace</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Evaluate Claim vs Self-Pay mathematics, upload policy PDFs, manage data sharing consents, and review chronological vehicle lifecycle events.
              </p>
              <Link href="/decision" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 pt-2">
                <span>Enter Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Insurer */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Insurer Desk</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Underwriting</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Claims Command Center</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Audit active claims queue, inspect full Claim Dossiers with itemized parts admissibility, and verify immutable blockchain transaction status.
              </p>
              <Link href="/dashboards/insurer" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 pt-2">
                <span>Enter Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Surveyor */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Motor Surveyor</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Assessment</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Inspection & Evidence</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Manage assigned damage inspections, verify parts depreciation according to physical wear, and upload SHA-256 hashed photographic evidence.
              </p>
              <Link href="/dashboards/surveyor" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 pt-2">
                <span>Enter Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Garage */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Body Workshop</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Service Desk</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Repair Estimate Builder</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Generate structured, itemized repair estimates categorized by material (metal, plastic, glass, labour) and synchronize estimates with insurers.
              </p>
              <Link href="/dashboards/garage" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 pt-2">
                <span>Enter Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* CTA Pre-Footer */}
      <section className="py-16 bg-zinc-900 text-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to evaluate claim financial intelligence?
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Experience the deterministic decision engine, inspect real-time blockchain verification, or explore role-specific workflows in the sandbox.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            <Link
              href="/decision"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <span>Launch Decision Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <span>Explore Role Sandbox</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
