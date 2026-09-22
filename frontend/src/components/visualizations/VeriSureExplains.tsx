'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Code, ShieldCheck, Cpu, Info } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface VeriSureExplainsProps {
  totalRepairCost: number;
  estimatedPayout: number;
  deductible: number;
  depreciationDeduction: number;
  ncbPercentage: number;
  futureNcbImpact: number;
  recommendation: string;
  ruleVersion?: string;
  txId?: string;
  canonicalHash?: string;
  className?: string;
}

export function VeriSureExplains({
  totalRepairCost,
  estimatedPayout,
  deductible,
  depreciationDeduction,
  ncbPercentage,
  futureNcbImpact,
  recommendation,
  ruleVersion = 'MOTOR_INDIA_2026_V1',
  txId,
  canonicalHash,
  className = '',
}: VeriSureExplainsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const isClaim = recommendation.toUpperCase() === 'CLAIM';

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden ${className}`}>
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              VeriSure Explains: Why this recommendation?
            </span>
            <span className="text-[10px] text-zinc-500 ml-2 hidden sm:inline">
              Click to view step-by-step reasoning
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span>{isOpen ? 'Hide' : 'Explain'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Content with Progressive Disclosure */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800 space-y-4 text-xs">
          {/* Level 1: Simple Plain-Language Summary */}
          <div className="space-y-2 pt-2">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200">
              Plain-Language Summary:
            </div>
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-sky-500 font-bold">•</span>
                <span>The total estimated repair cost is <strong>{formatINR(totalRepairCost)}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-500 font-bold">•</span>
                <span>
                  After compulsory deductible (<strong>{formatINR(deductible)}</strong>) and parts depreciation (<strong>{formatINR(depreciationDeduction)}</strong>), estimated insurance payout is <strong>{formatINR(estimatedPayout)}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-500 font-bold">•</span>
                <span>
                  Claiming resets your <strong>{ncbPercentage}% No-Claim Bonus</strong>, increasing your renewal premiums by approximately <strong>{formatINR(futureNcbImpact)}</strong> over the next 3 years.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-500 font-bold">•</span>
                <span>
                  {isClaim ? (
                    <>
                      Because the insurance payout ({formatINR(estimatedPayout)}) exceeds the 3-year NCB impact ({formatINR(futureNcbImpact)}), <strong>filing a claim saves you money overall</strong>.
                    </>
                  ) : (
                    <>
                      Because the 3-year NCB savings ({formatINR(futureNcbImpact)}) exceed or closely match the net payout, <strong>paying yourself preserves long-term policy value</strong>.
                    </>
                  )}
                </span>
              </li>
            </ul>
          </div>

          {/* Level 2: Advanced Technical Metadata (Toggleable) */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showTechnical ? 'Hide Technical Metadata' : 'View Technical Calculation & Hash Details'}</span>
            </button>

            {showTechnical && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tariff Engine Version:</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{ruleVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Calculation Method:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">Deterministic Indian Motor Tariff</span>
                </div>
                {canonicalHash && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-500">Input Hash:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]" title={canonicalHash}>
                      {canonicalHash.slice(0, 16)}...{canonicalHash.slice(-8)}
                    </span>
                  </div>
                )}
                {txId && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-500">Fabric Transaction:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]" title={txId}>
                      {txId.slice(0, 16)}...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
