'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatPercent, truncateHash } from '@/lib/formatters';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Database,
  RefreshCw,
  FileSearch,
  Scale,
  Lock,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type SimulationYear = {
  year: number;
  claim_ncb: number;
  self_pay_ncb: number;
  claim_premium: number;
  self_pay_premium: number;
  difference: number;
};

type SensitivityPoint = {
  repair_cost: number;
  recommendation: string;
};

type CalculationResult = {
  total_estimate: number;
  admissible_amount: number;
  depreciation_deduction: number;
  deductible_deduction: number;
  estimated_payout: number;
  future_ncb_impact: number;
  effective_claim_cost: number;
  self_pay_cost: number;
  estimated_saving: number;
  recommendation: string;
  break_even_threshold: number;
  explanations: string[];
  simulation_3_year: SimulationYear[];
  sensitivity_analysis: SensitivityPoint[];
};

type CommittedLedgerClaim = {
  id: string;
  vehicle_id: string;
  canonical_hash: string;
  blockchain_tx_id: string;
  sync_status: string;
  network_mode: string;
};

export default function ClaimDecisionPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-12 text-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Initializing Financial Engine...</p>
          </div>
        </AppShell>
      }
    >
      <ClaimDecisionContent />
    </Suspense>
  );
}

function ClaimDecisionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [committedClaim, setCommittedClaim] = useState<CommittedLedgerClaim | null>(null);
  const [fromExtract, setFromExtract] = useState(false);
  const [docDetails, setDocDetails] = useState<{ vehicleReg?: string; insurer?: string; policyNum?: string }>({});

  const [formData, setFormData] = useState({
    vehicleAge: '3',
    idv: '500000',
    deductible: '2000',
    ncb: '20',
    repairCost: '45000',
    partCategory: 'metal',
    basePremium: '15000',
    zeroDep: 'false',
  });

  useEffect(() => {
    if (searchParams) {
      const isFromExtract = searchParams.get('from_extract') === 'true';
      setFromExtract(isFromExtract);

      const reg = searchParams.get('vehicle_reg');
      const insurer = searchParams.get('insurer');
      const policyNum = searchParams.get('policy_num');
      if (reg || insurer || policyNum) {
        setDocDetails({ vehicleReg: reg || undefined, insurer: insurer || undefined, policyNum: policyNum || undefined });
      }

      setFormData((prev) => ({
        vehicleAge: searchParams.get('vehicle_age') || prev.vehicleAge,
        idv: searchParams.get('idv') || prev.idv,
        deductible: searchParams.get('deductible') || prev.deductible,
        ncb: searchParams.get('ncb') || prev.ncb,
        repairCost: searchParams.get('repair_cost') || prev.repairCost,
        partCategory: searchParams.get('part_category') || prev.partCategory,
        basePremium: prev.basePremium,
        zeroDep: prev.zeroDep,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/financial/analyze-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: { age_years: parseFloat(formData.vehicleAge) || 3.0 },
          policy: {
            idv: parseFloat(formData.idv) || 500000,
            deductible: parseFloat(formData.deductible) || 1000,
            ncb_percentage: parseInt(formData.ncb) || 20,
            zero_depreciation_addon: formData.zeroDep === 'true',
            policy_start_date: new Date().toISOString().split('T')[0],
            rule_version: 'MOTOR_INDIA_2026_V1',
          },
          repair_items: [
            { category: formData.partCategory, cost: parseFloat(formData.repairCost) || 0 },
          ],
          estimated_base_premium_next_year: parseFloat(formData.basePremium) || 15000,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Decision calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const commitToLedger = async () => {
    if (!result) return;
    setCommitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-policyholder',
        },
        body: JSON.stringify({
          policy_id: 'POL-REAL-101',
          accident_id: 'ACC-' + Date.now().toString().slice(-6),
          estimated_repair_cost: parseFloat(formData.repairCost) || 45000,
          status: 'PENDING_SURVEY',
        }),
      });
      if (!res.ok) throw new Error('Failed to record claim');
      const claimData = await res.json();
      setCommittedClaim(claimData);
    } catch (err) {
      console.error('Ledger commit error:', err);
      alert('Failed to commit claim to ledger. Verify backend connection.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Claim vs Self-Pay Decision Terminal"
        description="Deterministic financial simulation evaluating instant claim recovery against multi-year NCB forfeiture and future premium surcharges."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Decision Engine' },
        ]}
        actions={
          <button
            onClick={() => router.push('/decision/extract')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Auto-Extract from Policy / Bill</span>
          </button>
        }
      />

      {/* Provenance Alert from Document Extraction */}
      {fromExtract && (
        <FadeIn className="mb-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-xs">Parameters Auto-Populated from Verified Documents</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Vehicle: <strong className="font-mono">{docDetails.vehicleReg || 'MH02CB1234'}</strong> • Insurer:{' '}
                  <strong>{docDetails.insurer || 'HDFC ERGO'}</strong> • Policy:{' '}
                  <strong className="font-mono">{docDetails.policyNum || '2311/2004/99812/00/000'}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/decision/extract')}
              className="text-xs font-semibold px-3 py-1 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 rounded-md hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Re-Upload
            </button>
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Parameter Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Simulation Parameters
                </h2>
                <p className="text-[11px] text-zinc-500">
                  IRDAI Tariff Schedule V1 (2026)
                </p>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                DETERMINISTIC
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Workshop Repair Estimate (₹)
                </label>
                <input
                  name="repairCost"
                  type="number"
                  value={formData.repairCost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Dominant Part Category
                </label>
                <select
                  name="partCategory"
                  value={formData.partCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="metal">Metal (Age-based Depreciation 0-50%)</option>
                  <option value="plastic">Plastic / Nylon (Fixed 50% Depreciation)</option>
                  <option value="glass">Glass (0% Depreciation)</option>
                  <option value="fiberglass">Fiberglass (Fixed 30% Depreciation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Insured Value / IDV (₹)
                  </label>
                  <input
                    name="idv"
                    type="number"
                    value={formData.idv}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Deductible (₹)
                  </label>
                  <input
                    name="deductible"
                    type="number"
                    value={formData.deductible}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Current NCB (%)
                  </label>
                  <input
                    name="ncb"
                    type="number"
                    value={formData.ncb}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Base OD Premium (₹)
                  </label>
                  <input
                    name="basePremium"
                    type="number"
                    value={formData.basePremium}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Vehicle Age (Years)
                  </label>
                  <input
                    name="vehicleAge"
                    type="number"
                    step="0.5"
                    value={formData.vehicleAge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Zero-Dep Addon
                  </label>
                  <select
                    name="zeroDep"
                    value={formData.zeroDep}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="false">No (Standard Dep)</option>
                    <option value="true">Yes (Zero Dep Active)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing IRDAI Equations...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Calculate Financial Decision</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Comparative Ledger & Analysis */}
        <div className="lg:col-span-8 space-y-6">
          {!result ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <Scale className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Awaiting Parameter Input
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Configure your repair estimate and current policy schedule on the left, then execute the calculation to view the deterministic comparison.
              </p>
            </div>
          ) : (
            <FadeIn className="space-y-6">
              {/* Institutional Recommendation Highlight Banner */}
              <div
                className={`rounded-xl border p-6 ${
                  result.recommendation === 'CLAIM'
                    ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Recommendation Engine Output
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span
                        className={`text-xl font-extrabold px-3 py-1 rounded-lg font-mono ${
                          result.recommendation === 'CLAIM'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {result.recommendation === 'CLAIM' ? 'FILE CLAIM' : 'SELF-PAY WORKSHOP'}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          result.recommendation === 'CLAIM'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        Net Advantage: {formatINR(Math.abs(result.estimated_saving))}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                      Dynamic Break-even Threshold: Repairs exceeding{' '}
                      <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                        {formatINR(result.break_even_threshold)}
                      </strong>{' '}
                      justify filing a claim under your current NCB and deductible structure.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase">Effective Claim Cost</div>
                      <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {formatINR(result.effective_claim_cost)}
                      </div>
                      <div className="text-[9px] text-zinc-400">Deductible + 3y NCB Loss</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase">Self-Pay Cost</div>
                      <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {formatINR(result.self_pay_cost)}
                      </div>
                      <div className="text-[9px] text-zinc-400">Direct Repair Charge</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparative Ledger Table */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Deterministic Cost Breakdown
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">AUDITABLE SCHEDULE</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  <div className="grid grid-cols-3 p-3 text-zinc-500 font-semibold bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div>Financial Parameter</div>
                    <div className="text-right">Option A: Claim</div>
                    <div className="text-right">Option B: Self-Pay</div>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <div>Gross Repair Estimate</div>
                    <div className="text-right font-mono">{formatINR(result.total_estimate)}</div>
                    <div className="text-right font-mono">{formatINR(result.total_estimate)}</div>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <div>Parts Depreciation Deduction</div>
                    <div className="text-right font-mono text-rose-600 dark:text-rose-400">
                      -{formatINR(result.depreciation_deduction)}
                    </div>
                    <div className="text-right font-mono text-zinc-400">—</div>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <div>Compulsory / Voluntary Deductible</div>
                    <div className="text-right font-mono text-rose-600 dark:text-rose-400">
                      -{formatINR(result.deductible_deduction)}
                    </div>
                    <div className="text-right font-mono text-zinc-400">—</div>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-zinc-50/30 dark:bg-zinc-900/20 font-semibold">
                    <div>Immediate Insurer Payout</div>
                    <div className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatINR(result.estimated_payout)}
                    </div>
                    <div className="text-right font-mono text-zinc-400">₹0</div>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <div>Cumulative 3-Year Future NCB Loss</div>
                    <div className="text-right font-mono text-rose-600 dark:text-rose-400">
                      +{formatINR(result.future_ncb_impact)}
                    </div>
                    <div className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                      ₹0 (Bonus Preserved)
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-zinc-100/60 dark:bg-zinc-800/40 font-bold text-zinc-900 dark:text-zinc-100">
                    <div>Net Economic Cost to You</div>
                    <div className="text-right font-mono">{formatINR(result.effective_claim_cost)}</div>
                    <div className="text-right font-mono">{formatINR(result.self_pay_cost)}</div>
                  </div>
                </div>
              </div>

              {/* 3-Year Projection Sensitivity Chart */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      3-Year Compound Premium Trajectory
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Illustrating NCB reset penalty vs cumulative renewal discount growth
                    </p>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.simulation_3_year} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} className="text-xs font-mono" />
                      <YAxis className="text-xs font-mono" tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value: any) => formatINR(value)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        name="If Claim Registered"
                        dataKey="claim_premium"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="If Self-Paid (NCB Intact)"
                        dataKey="self_pay_premium"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Blockchain Seal Commitment Box */}
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Cryptographic Verification on Hyperledger Fabric
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Anchor this calculation and policy snapshot permanently to the consortium ledger.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={commitToLedger}
                    disabled={committing}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {committing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{committing ? 'Committing Block...' : 'Commit Claim to Ledger'}</span>
                  </button>
                </div>

                {committedClaim && (
                  <FadeIn className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-indigo-200 dark:border-indigo-800 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sealed to Hyperledger Fabric Channel
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {committedClaim.network_mode || 'REAL_FABRIC'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded">
                      <div>
                        <span className="text-zinc-400">Claim ID:</span> {committedClaim.id}
                      </div>
                      <div>
                        <span className="text-zinc-400">Tx ID:</span>{' '}
                        {truncateHash(committedClaim.blockchain_tx_id, 8, 8)}
                      </div>
                      <div className="sm:col-span-2 truncate">
                        <span className="text-zinc-400">Canonical SHA-256:</span> {committedClaim.canonical_hash}
                      </div>
                    </div>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => router.push(`/verification?claimId=${committedClaim.id}`)}
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Audit in Verification Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </FadeIn>
                )}
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </AppShell>
  );
}
