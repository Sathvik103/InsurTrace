'use client';

import React from 'react';
import { formatINR } from '@/lib/formatters';
import { Scale, ArrowRight, ShieldCheck, Wallet, TrendingUp, AlertCircle } from 'lucide-react';

export interface YourMoneyData {
  totalRepairCost: number;
  estimatedPayout: number;
  deductibleDeduction: number;
  immediateOutOfPocket: number;
  futureNcbImpact: number;
  effectiveClaimCost: number;
  selfPayCost: number;
  estimatedSaving: number;
  recommendation: string; // "CLAIM" | "SELF-PAY" | "BORDERLINE"
  simulation3Year?: Array<{
    year: number;
    claim_premium: number;
    self_pay_premium: number;
    difference: number;
  }>;
}

interface YourMoneyComparisonProps {
  data: YourMoneyData;
  className?: string;
  loading?: boolean;
}

export function YourMoneyComparison({
  data,
  className = '',
  loading = false,
}: YourMoneyComparisonProps) {
  const isClaimBetter = data.recommendation.toUpperCase() === 'CLAIM';
  const isSelfPayBetter = data.recommendation.toUpperCase() === 'SELF-PAY';

  // Difference today (Cash out of pocket today)
  const differenceToday = Math.abs(data.selfPayCost - data.immediateOutOfPocket);
  // Difference over 3 years
  const difference3Yr = Math.abs(data.estimatedSaving);

  // Maximum value for proportional visual bar scaling
  const maxTodayCost = Math.max(data.selfPayCost, data.immediateOutOfPocket, 1);
  const claimTodayPct = Math.max(8, Math.round((data.immediateOutOfPocket / maxTodayCost) * 100));
  const selfPayTodayPct = Math.max(8, Math.round((data.selfPayCost / maxTodayCost) * 100));

  const max3YrCost = Math.max(data.effectiveClaimCost, data.selfPayCost, 1);
  const claim3YrPct = Math.max(8, Math.round((data.effectiveClaimCost / max3YrCost) * 100));
  const selfPay3YrPct = Math.max(8, Math.round((data.selfPayCost / max3YrCost) * 100));

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 ${className}`}>
      {/* Top Header & Summary Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Your Money: Side-by-Side Financial Comparison</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real deterministic calculation comparing cash outlay today versus total 3-year impact.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium animate-pulse">
            <div className="w-3 h-3 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <span>Updating calculation...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isClaimBetter
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : isSelfPayBetter
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}>
              {isClaimBetter ? 'Claim Recommended' : isSelfPayBetter ? 'Self-Pay Recommended' : 'Borderline Outcome'}
            </span>
          </div>
        )}
      </div>

      {/* Visual Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horizon 1: Today (Out-of-Pocket Cash) */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Cash Out-of-Pocket Today
            </div>
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded">
              Difference: {formatINR(differenceToday)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Claim Bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-zinc-700 dark:text-zinc-300">If you Claim</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatINR(data.immediateOutOfPocket)}
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${claimTodayPct}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Deductible ({formatINR(data.deductibleDeduction)}) + parts depreciation
              </div>
            </div>

            {/* Self-Pay Bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-zinc-700 dark:text-zinc-300">If you Pay Yourself</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatINR(data.selfPayCost)}
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-500 dark:bg-zinc-400 rounded-full transition-all duration-300"
                  style={{ width: `${selfPayTodayPct}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Full repair invoice paid out-of-pocket
              </div>
            </div>
          </div>
        </div>

        {/* Horizon 2: Over 3 Years (Net True Financial Cost) */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Total 3-Year Financial Cost
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              isClaimBetter 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
            }`}>
              Net Savings: {formatINR(difference3Yr)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Claim Total 3-Yr */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-zinc-700 dark:text-zinc-300">Claim (Total 3 Yrs)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatINR(data.effectiveClaimCost)}
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isClaimBetter ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${claim3YrPct}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Out-of-pocket today ({formatINR(data.immediateOutOfPocket)}) + future NCB premium loss ({formatINR(data.futureNcbImpact)})
              </div>
            </div>

            {/* Self-Pay Total 3-Yr */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-zinc-700 dark:text-zinc-300">Self-Pay (Total 3 Yrs)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatINR(data.selfPayCost)}
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isSelfPayBetter ? 'bg-emerald-500' : 'bg-zinc-500 dark:bg-zinc-400'
                  }`}
                  style={{ width: `${selfPay3YrPct}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Repair cost today, preserving your NCB discount on upcoming renewals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Bottom Line Insight */}
      <div className="mt-5 p-3.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-500" />
          <span className="text-zinc-700 dark:text-zinc-300">
            {isClaimBetter ? (
              <>
                Difference today: <strong>{formatINR(differenceToday)}</strong> less out-of-pocket. Over 3 years, claiming is estimated to save <strong>{formatINR(difference3Yr)}</strong> overall.
              </>
            ) : isSelfPayBetter ? (
              <>
                Difference today: <strong>{formatINR(differenceToday)}</strong> more upfront. Over 3 years, paying yourself is estimated to save <strong>{formatINR(difference3Yr)}</strong> by keeping your NCB bonus.
              </>
            ) : (
              <>
                Both options have nearly identical 3-year net costs (within <strong>{formatINR(difference3Yr)}</strong>). Choose based on workshop convenience.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
