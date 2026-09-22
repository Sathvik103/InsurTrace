'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, ArrowRight, CheckCircle2, ChevronRight, Car, FileText, 
  Database, UploadCloud, Key, ShieldCheck, Lock, Activity, Scale, 
  HelpCircle, Eye, Sparkles, RefreshCw, BarChart2, Plus, ArrowUpRight,
  Calculator, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { TrustBadge } from '@/components/common/TrustBadge';
import { useVehicle } from '@/context/VehicleContext';
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
    idv: 650000,
    ncb: 25,
    defaultRepair: 42500,
    depRate: 0.20,
    deductible: 2000,
    ncbLoss3Yr: 8400,
    txId: 'e14646ae...b7488f',
    is_demo: true
  },
  {
    id: 'V-REAL-102',
    reg: 'KA-01-MJ-5678',
    name: 'Tata Nexon EV Max',
    type: 'Electric Vehicle',
    age: 1,
    idv: 1450000,
    ncb: 25,
    defaultRepair: 68000,
    depRate: 0.0, // Zero-dep active
    deductible: 2500,
    ncbLoss3Yr: 15750,
    txId: '99e1428f...348123',
    is_demo: true
  },
  {
    id: 'V-REAL-103',
    reg: 'DL-08-AB-9012',
    name: 'Maruti Suzuki Swift',
    type: 'Hatchback',
    age: 5,
    idv: 420000,
    ncb: 35,
    defaultRepair: 14500,
    depRate: 0.40, // 5-yr plastic/metal
    deductible: 1000,
    ncbLoss3Yr: 11200,
    txId: '7c92ae49...ca91b8',
    is_demo: true
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
    txId: 'f8205104...ab1409',
    is_demo: true
  }
];

export default function HomePage() {
  const { vehicles, setSelectedVehicleId } = useVehicle();
  const [selectedSimVehicle, setSelectedSimVehicle] = useState(SEED_VEHICLES[0]);
  const [sliderRepairCost, setSliderRepairCost] = useState(SEED_VEHICLES[0].defaultRepair);

  // Dynamic interactive calculation based on standard Indian Motor Tariff rules
  const depreciation = Math.round(sliderRepairCost * selectedSimVehicle.depRate);
  const deductible = selectedSimVehicle.deductible;
  const estimatedPayout = Math.max(0, sliderRepairCost - depreciation - deductible);
  const estimatedOutOfPocketOnClaim = depreciation + deductible;
  const ncbLoss3Year = selectedSimVehicle.ncbLoss3Yr;
  const claim3YearTotal = estimatedOutOfPocketOnClaim + ncbLoss3Year;
  const selfPay3YearTotal = sliderRepairCost; // No insurance payout, but keeps NCB
  const netDifference = selfPay3YearTotal - claim3YearTotal;
  const isClaimAdvantageous = netDifference > 0;

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-50">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">VeriSure 2.0</span>
                  <span className="text-zinc-400">•</span>
                  <span>Hyperledger Fabric Consortium Active</span>
                </div>
              </FadeIn>

              <SlideUp delay={0.2} distance={24}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.12]">
                  Insurance decisions,{' '}
                  <span className="text-sky-600 dark:text-sky-400 font-bold">made clearer</span>.
                </h1>
                <p className="mt-3 text-lg sm:text-xl text-zinc-700 dark:text-zinc-300 font-medium">
                  Know your numbers before filing a motor claim in India.
                </p>
              </SlideUp>

              <SlideUp delay={0.3} distance={20}>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
                  Should you file an insurance claim or pay out-of-pocket? VeriSure calculates your estimated insurance payout, out-of-pocket costs, and 3-year NCB step-back impact using deterministic Indian Motor Tariff rules—sealed with cryptographic record integrity.
                </p>
              </SlideUp>

              <SlideUp delay={0.4} distance={16}>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href="/decision"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
                  >
                    <Scale className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                    <span>Check a Claim</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-all"
                  >
                    <Plus className="w-4 h-4 text-zinc-500" />
                    <span>Add Your Vehicle</span>
                  </Link>

                  <Link
                    href="#vehicles-section"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span>View Demo Vehicles</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </SlideUp>

              <FadeIn delay={0.5}>
                <div className="pt-3 flex flex-wrap items-center gap-5 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Indian Motor Tariff (GR.8 & GR.9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Dual-Peer Consortium Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Zero Fabricated External Scores</span>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Hero Interactive Preview Card */}
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
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{selectedSimVehicle.reg}</p>
                          <TrustBadge source="DEMO_RECORD" />
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{selectedSimVehicle.name} • {selectedSimVehicle.age} Years Old</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Tx: {selectedSimVehicle.txId}
                    </span>
                  </div>

                  {/* Assembled Data Nodes */}
                  <div className="space-y-3 py-4 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Policy Profile</p>
                          <p className="text-[10px] text-zinc-500">IDV: {formatINR(selectedSimVehicle.idv)} • {selectedSimVehicle.ncb}% Current NCB</p>
                        </div>
                      </div>
                      <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px]">{formatINR(selectedSimVehicle.deductible)} Deductible</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Workshop Estimate</p>
                          <p className="text-[10px] text-zinc-500">Parts + Labour Assessment</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatINR(sliderRepairCost)}</span>
                    </div>

                    {/* Calculated Outcome */}
                    <div className="p-3.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-950 dark:border dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Estimated Insurance Payout:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatINR(estimatedPayout)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Estimated Out-of-Pocket:</span>
                        <span className="font-mono text-zinc-300">{formatINR(estimatedOutOfPocketOnClaim)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">3-Year NCB Step-back Impact:</span>
                        <span className="font-mono text-amber-400">+{formatINR(ncbLoss3Year)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-300">Financial Comparison:</span>
                        <span className={`font-mono font-bold ${isClaimAdvantageous ? 'text-emerald-400' : 'text-sky-400'}`}>
                          {isClaimAdvantageous ? `Claim saves ${formatINR(netDifference)}` : `Self-pay saves ${formatINR(Math.abs(netDifference))}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footnote on external authority */}
                  <div className="pt-2 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                    <span>Deterministic tariff calculation</span>
                    <Link href={`/decision?vehicle_age=${selectedSimVehicle.age}&idv=${selectedSimVehicle.idv}&ncb=${selectedSimVehicle.ncb}&repair_cost=${sliderRepairCost}`} className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5">
                      Open full wizard <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </SlideUp>
            </div>

          </div>
        </div>
      </section>

      {/* Action-First Grid: "How can VeriSure help you today?" */}
      <section className="py-16 bg-zinc-50/70 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Clear Pathways
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              How can VeriSure help you today?
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Select an action below to begin your analysis or inspect verifiable records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Should I file this claim? */}
            <Link 
              href="/decision"
              className="group p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 dark:bg-sky-950/50 dark:border-sky-800">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Should I file this claim?
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Calculate your estimated insurance payout versus paying out-of-pocket before contacting your insurer. We account for parts depreciation and 3-year NCB loss.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                <span>Start claim check</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Check vehicle history */}
            <Link 
              href="/vehicles"
              className="group p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:bg-indigo-950/50 dark:border-indigo-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Check vehicle history
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Review chronological accident dossiers, repair estimates, and insurance milestones verified with SHA-256 state fingerprints on Hyperledger Fabric.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>View vehicle history</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Verify a document */}
            <Link 
              href="/decision/extract"
              className="group p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Verify a document
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Upload an insurance policy or body shop estimate PDF. Review extracted line items and check parts depreciation against official tariff schedules.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Verify document</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Vehicle Data Passport */}
            <Link 
              href="/reports"
              className="group p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 dark:bg-amber-950/50 dark:border-amber-800">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Vehicle Data Passport
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Generate a cryptographically verifiable vehicle record. Useful for private resale, comprehensive policy renewals, or workshop audits.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>View reports</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Your Vehicles Section */}
      <section id="vehicles-section" className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Vehicle Fleet & Sandbox
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                Your Registered Vehicles
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Explore pre-loaded consortium sandbox vehicles or add your own vehicle for live analysis.
              </p>
            </div>

            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {v.registration_number}
                    </span>
                    <TrustBadge source={v.is_demo ? 'DEMO_RECORD' : 'MY_VEHICLE'} />
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {v.make} {v.model}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {v.variant || 'Standard'} • {v.manufacture_year} • {v.fuel_type || 'Petrol'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Insured Declared Value:</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">{formatINR(v.idv || 0)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>No-Claim Bonus:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{v.ncb_percentage || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/vehicles/${v.id}`}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
                  >
                    <span>Command Center</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/decision?vehicle_id=${v.id}`}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 inline-flex items-center gap-1"
                  >
                    <span>Evaluate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Quick Add Card */}
            <Link
              href="/onboarding"
              className="p-5 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col items-center justify-center text-center p-8 space-y-2 group transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Add another vehicle</p>
              <p className="text-[11px] text-zinc-500 max-w-[180px]">Enter vehicle details or upload your policy copy</p>
            </Link>
          </div>
        </div>
      </section>

      {/* "How VeriSure Works" 6-Step Visual Pipeline */}
      <section className="py-20 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              End-to-End Transparency
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How VeriSure Works
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Every step is deterministic, auditable, and clearly attributed to its origin. VeriSure provides financial intelligence; the final insurer decision remains external.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 01</span>
                <TrustBadge source="USER_PROVIDED" label="User / Document" />
              </div>
              <h4 className="font-bold text-sm text-white">Your Data</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You enter your vehicle parameters or upload a policy/estimate PDF. No automated scraping without your authorization.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 02</span>
                <TrustBadge source="COMPUTED_RESULT" label="Extraction" />
              </div>
              <h4 className="font-bold text-sm text-white">VeriSure Analysis</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Line-item extraction parses parts into metal, plastic, rubber, and glass categories with exact labor schedule breakdowns.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 03</span>
                <TrustBadge source="COMPUTED_RESULT" label="Tariff Rules" />
              </div>
              <h4 className="font-bold text-sm text-white">Tariff Rules</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Standard Indian Motor Tariff GR.8 (depreciation based on vehicle age) and GR.9 (compulsory excess) are applied deterministically.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 04</span>
                <TrustBadge source="ML_ESTIMATE" label="Data-Limited" />
              </div>
              <h4 className="font-bold text-sm text-white">Optional ML Signals</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Computer vision damage localization and fraud pattern detection provide advisory flags. Clearly marked as data-limited signals.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 05</span>
                <TrustBadge source="BLOCKCHAIN_RECORD" label="Fabric Consortium" />
              </div>
              <h4 className="font-bold text-sm text-white">Private Consortium Ledger</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A SHA-256 state fingerprint is anchored to the dual-peer Hyperledger Fabric ledger, establishing tamper-evident provenance.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-500">STEP 06</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                  Empowerment
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">Your Decision</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You receive a clear 3-year financial comparison: claim vs self-pay. You decide how to proceed with full clarity on the true cost.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Note: Blockchain proves data integrity after commitment; it does not independently verify physical ground truth.</span>
            <Link href="/technology" className="text-sky-400 hover:underline shrink-0 ml-4 inline-flex items-center gap-1">
              Read technical design <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Interactive Financial Simulator */}
      <SectionReveal className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Interactive Financial Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Simulate Claim vs Self-Pay with realistic vehicle profiles
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Select any of the consortium test vehicles to simulate estimated insurance payout versus 3-year NCB penalties.
            </p>
          </div>

          {/* Vehicle Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {SEED_VEHICLES.map((veh) => {
              const isSelected = selectedSimVehicle.id === veh.id;
              return (
                <button
                  key={veh.id}
                  onClick={() => {
                    setSelectedSimVehicle(veh);
                    setSliderRepairCost(veh.defaultRepair);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{veh.id}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{veh.ncb}% NCB</span>
                  </div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">{veh.name}</div>
                  <div className="text-[10px] text-zinc-500">{veh.reg} • {veh.type}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400">Simulated Repair Estimate</span>
                  <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-50">{formatINR(sliderRepairCost)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="120000"
                  step="2500"
                  value={sliderRepairCost}
                  onChange={(e) => setSliderRepairCost(Number(e.target.value))}
                  className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>₹5,000 (Minor touch-up)</span>
                  <span>₹60,000</span>
                  <span>₹1,20,000 (Major rebuild)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 dark:bg-sky-950/30 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-300 space-y-1">
                <p className="font-bold">Tariff Depreciation Rate: {Math.round(selectedSimVehicle.depRate * 100)}%</p>
                <p className="text-[11px] text-sky-700/80 dark:text-sky-300/80">
                  Based on vehicle age ({selectedSimVehicle.age} years) under Indian Motor Tariff Schedule of Depreciation for partial losses.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/decision?vehicle_age=${selectedSimVehicle.age}&idv=${selectedSimVehicle.idv}&ncb=${selectedSimVehicle.ncb}&deductible=${selectedSimVehicle.deductible}&repair_cost=${sliderRepairCost}`}
                  className="inline-flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <span>Launch Guided Decision Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/vehicles/${selectedSimVehicle.id}`}
                  className="inline-flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <span>Inspect On-Chain Dossier ({selectedSimVehicle.reg})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Live Comparative Ledger Table */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Financial Comparison</h3>
                    <p className="text-[11px] text-zinc-500">{selectedSimVehicle.name} • Depreciation {Math.round(selectedSimVehicle.depRate * 100)}%</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    isClaimAdvantageous 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300'
                  }`}>
                    {isClaimAdvantageous ? 'CLAIM IS FINANCIALLY ADVANTAGEOUS' : 'SELF-PAY IS FINANCIALLY ADVANTAGEOUS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
                  {/* Option 1: File Claim */}
                  <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
                    <p className="font-bold text-xs uppercase tracking-wider text-zinc-500">Option A: File a Claim</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Estimated Insurance Payout:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatINR(estimatedPayout)}</span>
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
                      <span className="text-zinc-500">Estimated Out-of-Pocket:</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatINR(estimatedOutOfPocketOnClaim)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">3-Yr NCB Step-back Loss:</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400">+{formatINR(ncbLoss3Year)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700 flex justify-between font-bold text-zinc-900 dark:text-zinc-50">
                      <span>3-Year Estimated Financial Impact:</span>
                      <span className="font-mono">{formatINR(claim3YearTotal)}</span>
                    </div>
                  </div>

                  {/* Option 2: Pay Out-of-Pocket */}
                  <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
                    <p className="font-bold text-xs uppercase tracking-wider text-zinc-500">Option B: Pay Out-of-Pocket</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Immediate Workshop Bill:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatINR(sliderRepairCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Estimated Insurance Payout:</span>
                      <span className="font-mono text-zinc-400">₹0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">NCB Status:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">Preserved ({selectedSimVehicle.ncb}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Renewal Savings:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">-{formatINR(ncbLoss3Year)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700 flex justify-between font-bold text-zinc-900 dark:text-zinc-50">
                      <span>3-Year Estimated Financial Impact:</span>
                      <span className="font-mono">{formatINR(sliderRepairCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-100/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isClaimAdvantageous
                        ? `Filing a claim yields a net 3-year advantage of ${formatINR(netDifference)}.`
                        : `Paying out of pocket avoids resetting your NCB, saving ${formatINR(Math.abs(netDifference))} over 3 years.`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </SectionReveal>

      {/* Role-Based Workspaces */}
      <SectionReveal className="py-20 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Role-Tailored Workspaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Engineered for the Indian motor insurance lifecycle
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Each stakeholder accesses an intentional interface enforcing Row-Level Security (RLS) and cryptographic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Policyholder */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Policyholder</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">Financial Clarity</span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <span>Launch Decision Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
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
