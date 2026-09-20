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

const SEED_VEHICLES = [
  {
    id: 'V-REAL-101',
    reg: 'MH-02-CB-1234',
    name: 'Hyundai Creta SX',
    type: 'Midsize SUV',
    age: 3,
    idv: 500000,
    ncb: 20,
    defaultRepair: 42500,
    depRate: 0.20,
    deductible: 2000,
    ncbLoss3Yr: 8400,
    txId: 'e14646ae...b7488f'
  },
  {
    id: 'V-REAL-102',
    reg: 'DL-01-EV-4321',
    name: 'Tata Nexon EV Max',
    type: 'Electric Vehicle',
    age: 1,
    idv: 1450000,
    ncb: 25,
    defaultRepair: 68000,
    depRate: 0.0, // Zero-dep active
    deductible: 2500,
    ncbLoss3Yr: 15750,
    txId: '99e1428f...348123'
  },
  {
    id: 'V-REAL-103',
    reg: 'KA-03-MG-7890',
    name: 'Maruti Suzuki Swift',
    type: 'Hatchback',
    age: 5,
    idv: 480000,
    ncb: 35,
    defaultRepair: 12500,
    depRate: 0.40, // 5-yr plastic/metal
    deductible: 1000,
    ncbLoss3Yr: 11200,
    txId: '7c92ae49...ca91b8'
  },
  {
    id: 'V-REAL-104',
    reg: 'TS-09-FA-5678',
    name: 'Honda City ZX',
    type: 'Sedan',
    age: 2,
    idv: 950000,
    ncb: 50,
    defaultRepair: 84500,
    depRate: 0.10,
    deductible: 1500,
    ncbLoss3Yr: 28500,
    txId: 'f8205104...ab1409'
  }
];

export default function HomePage() {
  const [selectedVehicle, setSelectedVehicle] = useState(SEED_VEHICLES[0]);
  const [sliderRepairCost, setSliderRepairCost] = useState(SEED_VEHICLES[0].defaultRepair);

  const handleSelectVehicle = (veh: typeof SEED_VEHICLES[0]) => {
    setSelectedVehicle(veh);
    setSliderRepairCost(veh.defaultRepair);
  };

  // Dynamic interactive calculation based on standard Indian Motor Tariff rules
  const depreciation = Math.round(sliderRepairCost * selectedVehicle.depRate);
  const deductible = selectedVehicle.deductible;
  const admissibleClaim = Math.max(0, sliderRepairCost - depreciation - deductible);
  const ncbLoss3Year = selectedVehicle.ncbLoss3Yr;
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
                  <span>Hyperledger Fabric-Backed Verification</span>
                </div>
              </FadeIn>

              <SlideUp delay={0.2} distance={24}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.12]">
                  Insurance decisions,{' '}
                  <span className="text-sky-600 dark:text-sky-400 font-bold">made clearer</span>.
                </h1>
                <p className="mt-3 text-lg sm:text-xl text-zinc-700 dark:text-zinc-300 font-medium">
                  Understand your vehicle, insurance, claims, and verified records in one place.
                </p>
              </SlideUp>

              <SlideUp delay={0.3} distance={20}>
                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
                  Should you file an insurance claim or pay out-of-pocket? VeriSure provides deterministic financial math—accounting for deductibles, parts depreciation schedules, and multi-year No-Claim Bonus (NCB) loss—sealed with cryptographic record verification.
                </p>
              </SlideUp>

              <SlideUp delay={0.4} distance={16}>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/decision"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-all"
                  >
                    <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Check a Claim</span>
                  </Link>
                </div>
              </SlideUp>

              <FadeIn delay={0.5}>
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Indian Motor Tariff Guidelines</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Consortium Test Network Active</span>
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
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{selectedVehicle.reg}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{selectedVehicle.name} • {selectedVehicle.age} Years Old</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Tx: {selectedVehicle.txId}
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
                          <p className="text-[10px] text-zinc-500">IDV: {formatINR(selectedVehicle.idv)} • NCB: {selectedVehicle.ncb}%</p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{formatINR(selectedVehicle.deductible)} Ded.</span>
                    </div>

                    {/* Node 2: Workshop Estimate */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Workshop Estimate</p>
                          <p className="text-[10px] text-zinc-500">Parts & Labor Assessment</p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{formatINR(sliderRepairCost)}</span>
                    </div>

                    {/* Node 3: Mathematical Outcome */}
                    <div className="p-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-950 dark:border dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Calculated Admissible Claim</span>
                        <span className="font-mono font-bold text-emerald-400">{formatINR(admissibleClaim)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">3-Year NCB Step-back Loss</span>
                        <span className="font-mono text-amber-400">-{formatINR(ncbLoss3Year)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-300">Net Financial Advantage</span>
                        <span className={`font-mono font-bold text-sm ${netAdvantage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {netAdvantage >= 0 ? `+${formatINR(netAdvantage)}` : `-${formatINR(Math.abs(netAdvantage))}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resolved Decision Pill */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Engine Recommendation:</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      shouldClaim 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                    }`}>
                      {shouldClaim ? 'FILE A CLAIM' : 'PAY OUT OF POCKET'}
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
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Opaque Historical Event Logs</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Accident dossiers and repair estimates can be altered across internal databases. VeriSure anchors canonical records to Hyperledger Fabric for tamper-evident verification. (Blockchain proves data integrity after commitment; it does not independently verify physical ground truth).
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Section: Live Interactive Financial Decision Showcase with 4 Seed Vehicles */}
      <SectionReveal className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Interactive Decision Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Evaluate Claim vs Self-Pay with realistic vehicle profiles
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Select any of the 4 verified seed vehicles from the consortium ledger to simulate claim payout against 3-year NCB penalties under standard Indian motor tariff guidelines.
            </p>
          </div>

          {/* Vehicle Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {SEED_VEHICLES.map((veh) => {
              const isSelected = selectedVehicle.id === veh.id;
              return (
                <button
                  key={veh.id}
                  onClick={() => handleSelectVehicle(veh)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{veh.id}</span>
                    <span className="text-[10px] font-semibold text-emerald-600">{veh.ncb}% NCB</span>
                  </div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">{veh.name}</div>
                  <div className="text-[10px] text-zinc-500">{veh.reg} • {veh.type}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400">Simulated Repair Estimate</span>
                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50">{formatINR(sliderRepairCost)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="120000"
                  step="2500"
                  value={sliderRepairCost}
                  onChange={(e) => setSliderRepairCost(Number(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>₹5,000 (Minor scratch)</span>
                  <span>₹60,000</span>
                  <span>₹1,20,000 (Major rebuild)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/decision?vehicle_age=${selectedVehicle.age}&idv=${selectedVehicle.idv}&ncb=${selectedVehicle.ncb}&deductible=${selectedVehicle.deductible}&repair_cost=${sliderRepairCost}`}
                  className="inline-flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-colors"
                >
                  <span>Open Full Decision Workspace for {selectedVehicle.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/vehicles/${selectedVehicle.id}`}
                  className="inline-flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <span>Inspect On-Chain Dossier ({selectedVehicle.reg})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Live Comparative Ledger Table */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Comparative Financial Outcome</h3>
                    <p className="text-[11px] text-zinc-500">{selectedVehicle.name} • Depreciation {Math.round(selectedVehicle.depRate * 100)}%</p>
                  </div>
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
                      <span className="text-zinc-500">Compulsory Excess:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{formatINR(deductible)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Part Depreciation:</span>
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
                      <span className="text-zinc-500">NCB Progression:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">Preserved</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Renewal Savings:</span>
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
              Every accident record, policy extraction, and repair estimate is deterministically hashed with SHA-256 and committed to a dual-peer Hyperledger Fabric ledger with Raft consensus (Consortium Test Network).
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
                Committed via Node.js Gateway to dual-peer Org1/Org2 consortium with Raft consensus.
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
                Relational record stored with Fabric transaction reference ID and Row-Level Security isolation.
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
                Real-time cryptographic hash comparison detects database tampering immediately.
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
              Each stakeholder accesses an intentional, purpose-built interface enforcing Row-Level Security (RLS) and DPDP-aligned consent patterns.
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
                Audit active claims queue, inspect full Claim Dossiers with itemized parts admissibility, and verify cryptographically sealed ledger status.
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
