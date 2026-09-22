'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR } from '@/lib/formatters';
import { 
  Car, 
  Shield, 
  Wrench, 
  Percent, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  Scale, 
  ChevronDown, 
  ChevronUp, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface DecisionJourneyData {
  vehicleName: string;
  registrationNumber: string;
  vehicleAge: number;
  insurerName?: string;
  ncbPercentage: number;
  hasZeroDep: boolean;
  totalRepairCost: number;
  depreciationDeduction: number;
  deductibleDeduction: number;
  estimatedPayout: number;
  immediateOutOfPocket: number;
  futureNcbImpact: number;
  effectiveClaimCost: number;
  selfPayCost: number;
  estimatedSaving: number;
  recommendation: string; // "CLAIM", "SELF-PAY", "BORDERLINE"
  ruleVersion?: string;
}

interface DecisionJourneyProps {
  data: DecisionJourneyData;
  className?: string;
}

export function DecisionJourney({ data, className = '' }: DecisionJourneyProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const toggleStep = (idx: number) => {
    setActiveStep((prev) => (prev === idx ? null : idx));
  };

  const isClaimBetter = data.recommendation.toUpperCase() === 'CLAIM';
  const isSelfPayBetter = data.recommendation.toUpperCase() === 'SELF-PAY';

  const steps = [
    {
      id: 'vehicle',
      stepNum: 1,
      title: 'Your Vehicle',
      summary: `${data.vehicleName} (${data.vehicleAge} yrs)`,
      icon: Car,
      color: 'sky',
      details: [
        { label: 'Vehicle Model', value: data.vehicleName },
        { label: 'Registration', value: data.registrationNumber || 'Not provided' },
        { label: 'Vehicle Age', value: `${data.vehicleAge} year(s)` },
        { label: 'Depreciation Tier', value: `${data.vehicleAge > 4 ? '40-50%' : data.vehicleAge > 2 ? '20-30%' : '5-15%'} standard tariff rate` },
      ],
      plainExplanation: `Your vehicle age (${data.vehicleAge} years) directly governs the depreciation percentage applied to replacement parts under standard Indian Motor Tariff guidelines.`,
    },
    {
      id: 'policy',
      stepNum: 2,
      title: 'Your Policy',
      summary: `${data.ncbPercentage}% NCB • ${data.hasZeroDep ? 'Zero Dep Active' : 'Standard Policy'}`,
      icon: Shield,
      color: 'blue',
      details: [
        { label: 'Insurance Provider', value: data.insurerName || 'Active Insurer' },
        { label: 'Current NCB', value: `${data.ncbPercentage}%` },
        { label: 'Zero-Depreciation Add-on', value: data.hasZeroDep ? 'Active (0% depreciation on parts)' : 'None (Standard depreciation applies)' },
        { label: 'Compulsory Deductible', value: formatINR(data.deductibleDeduction) },
      ],
      plainExplanation: data.hasZeroDep 
        ? 'Because you have a Zero-Depreciation add-on, insurance covers parts at full cost without depreciation cuts.'
        : `Without zero-depreciation, parts are subject to age-based depreciation deductions before insurance payout.`,
    },
    {
      id: 'repair',
      stepNum: 3,
      title: 'Repair Cost',
      summary: formatINR(data.totalRepairCost),
      icon: Wrench,
      color: 'amber',
      details: [
        { label: 'Estimated Repair Total', value: formatINR(data.totalRepairCost) },
        { label: 'Source', value: 'Repair estimate / entered items' },
      ],
      plainExplanation: 'The total estimated invoice amount from the workshop to repair the damaged panels and components.',
    },
    {
      id: 'coverage',
      stepNum: 4,
      title: 'What Insurance May Cover',
      summary: `−${formatINR(data.depreciationDeduction + data.deductibleDeduction)} in deductions`,
      icon: Percent,
      color: 'purple',
      details: [
        { label: 'Parts Depreciation Deduction', value: `−${formatINR(data.depreciationDeduction)}` },
        { label: 'Compulsory Policy Deductible', value: `−${formatINR(data.deductibleDeduction)}` },
        { label: 'Net Admissible Base', value: formatINR(Math.max(0, data.totalRepairCost - data.depreciationDeduction)) },
      ],
      plainExplanation: `Insurance does not reimburse 100% of an estimate. The compulsory policy deductible (${formatINR(data.deductibleDeduction)}) and parts depreciation (${formatINR(data.depreciationDeduction)}) are deducted first.`,
    },
    {
      id: 'payout',
      stepNum: 5,
      title: 'Estimated Insurance Payout',
      summary: formatINR(data.estimatedPayout),
      icon: DollarSign,
      color: 'emerald',
      details: [
        { label: 'Net Payout by Insurer', value: formatINR(data.estimatedPayout) },
        { label: 'Status', value: 'Subject to surveyor survey and claim approval' },
      ],
      plainExplanation: `This is the estimated amount the insurance company would disburse to the garage or to your bank account after all deductions.`,
    },
    {
      id: 'out_of_pocket',
      stepNum: 6,
      title: 'Your Out-of-Pocket Cost',
      summary: `${formatINR(data.immediateOutOfPocket)} today`,
      icon: Wallet,
      color: 'indigo',
      details: [
        { label: 'Compulsory Deductible', value: formatINR(data.deductibleDeduction) },
        { label: 'Depreciation / Non-Covered', value: formatINR(data.depreciationDeduction) },
        { label: 'Total Payable by You Today', value: formatINR(data.immediateOutOfPocket) },
      ],
      plainExplanation: `If you file a claim, you pay only your out-of-pocket share (${formatINR(data.immediateOutOfPocket)}) at the workshop today. The insurer pays the remaining ${formatINR(data.estimatedPayout)}.`,
    },
    {
      id: 'impact_3yr',
      stepNum: 7,
      title: '3-Year Estimated Financial Impact',
      summary: `+${formatINR(data.futureNcbImpact)} future NCB premium loss`,
      icon: TrendingUp,
      color: 'rose',
      details: [
        { label: 'Immediate Out-of-Pocket', value: formatINR(data.immediateOutOfPocket) },
        { label: 'Future NCB Premium Loss (3 Yrs)', value: `+${formatINR(data.futureNcbImpact)}` },
        { label: 'Total Cost of Claiming', value: formatINR(data.effectiveClaimCost) },
        { label: 'Total Cost of Self-Pay', value: formatINR(data.selfPayCost) },
      ],
      plainExplanation: `Claiming resets your ${data.ncbPercentage}% No-Claim Bonus to 0% upon next renewal, increasing your renewal premiums by approximately ${formatINR(data.futureNcbImpact)} over the next 3 years.`,
    },
    {
      id: 'result',
      stepNum: 8,
      title: 'Financial Comparison',
      summary: isClaimBetter
        ? `Claiming may save ~${formatINR(Math.abs(data.estimatedSaving))}`
        : isSelfPayBetter
        ? `Self-pay may save ~${formatINR(Math.abs(data.estimatedSaving))}`
        : 'Borderline comparison',
      icon: Scale,
      color: isClaimBetter ? 'emerald' : isSelfPayBetter ? 'sky' : 'amber',
      details: [
        { label: 'Which Option Makes More Sense?', value: isClaimBetter ? 'Filing a claim' : isSelfPayBetter ? 'Paying out-of-pocket' : 'Either option is close' },
        { label: 'Net Difference over 3 Years', value: formatINR(Math.abs(data.estimatedSaving)) },
        { label: 'Tariff Rule Engine', value: data.ruleVersion || 'MOTOR_INDIA_2026_V1' },
      ],
      plainExplanation: isClaimBetter
        ? `Filing a claim is estimated to save you ${formatINR(Math.abs(data.estimatedSaving))} over 3 years, even after factoring in the future NCB premium increase.`
        : isSelfPayBetter
        ? `Paying ${formatINR(data.totalRepairCost)} out-of-pocket is estimated to save you ${formatINR(Math.abs(data.estimatedSaving))} over 3 years because you preserve your ${data.ncbPercentage}% No-Claim Bonus.`
        : 'The financial difference between claiming and self-paying is marginal. Factor in workshop convenience and repair turnaround time.',
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              How VeriSure Worked This Out
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              Interactive Decision Flow
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Click any step to inspect the exact values and deterministic tariff rules used.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Recommendation:</span>
          <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
            isClaimBetter
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : isSelfPayBetter
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          }`}>
            {isClaimBetter ? 'Claim May Make More Financial Sense' : isSelfPayBetter ? 'Paying Yourself May Make More Sense' : 'Borderline Outcome'}
          </span>
        </div>
      </div>

      {/* Desktop Horizontal Flow / Mobile Vertical Timeline */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isOpen = activeStep === idx;
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="relative flex flex-col">
                {/* Step Card */}
                <button
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-full ${
                    isOpen
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 shadow-sm ring-2 ring-sky-500/20'
                      : isLast
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Step # */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isLast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        0{step.stepNum}
                      </span>
                    </div>

                    {/* Step Title */}
                    <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {step.title}
                    </div>

                    {/* Step Summary Value */}
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 leading-snug line-clamp-2">
                      {step.summary}
                    </div>
                  </div>

                  {/* Toggle Indicator */}
                  <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{isOpen ? 'Close' : 'Details'}</span>
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Expanded Drawer Details (Responsive Full-Width Panel below) */}
        <AnimatePresence>
          {activeStep !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-xl border border-sky-200 dark:border-sky-900/70 bg-sky-50/40 dark:bg-sky-950/20 p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-900/50 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    Step {steps[activeStep].stepNum}: {steps[activeStep].title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(null)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  ✕ Close
                </button>
              </div>

              {/* Plain Language Explanation First */}
              <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 mb-4 bg-white/70 dark:bg-zinc-900/70 p-3 rounded-lg border border-sky-100 dark:border-sky-900/40">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {steps[activeStep].plainExplanation}
                </p>
              </div>

              {/* Exact Technical Numbers Table Second */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {steps[activeStep].details.map((detail, dIdx) => (
                  <div key={dIdx} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {detail.label}
                    </div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {detail.value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
