'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle } from '@/context/VehicleContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { TrustBadge } from '@/components/common/TrustBadge';
import { DecisionJourney, DecisionJourneyData } from '@/components/visualizations/DecisionJourney';
import { YourMoneyComparison, YourMoneyData } from '@/components/visualizations/YourMoneyComparison';
import { VeriSureExplains } from '@/components/visualizations/VeriSureExplains';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatPercent, truncateHash } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';
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
  Sliders,
  ChevronDown
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
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3 dark:border-zinc-100" />
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
  const { vehicles, selectedVehicle, selectedVehicleId, setSelectedVehicleId } = useVehicle();

  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [committedClaim, setCommittedClaim] = useState<CommittedLedgerClaim | null>(null);
  const [fromExtract, setFromExtract] = useState(false);
  const [docDetails, setDocDetails] = useState<{ vehicleReg?: string; insurer?: string; policyNum?: string }>({});

  const [formData, setFormData] = useState({
    vehicleAge: '3',
    idv: '650000',
    deductible: '2000',
    ncb: '25',
    repairCost: '45000',
    partCategory: 'metal',
    basePremium: '15000',
    zeroDep: 'false',
  });

  useEffect(() => {
    if (searchParams && searchParams.get('vehicle_id')) {
      const vId = searchParams.get('vehicle_id')!;
      setSelectedVehicleId(vId);
      const found = vehicles.find((v) => v.id === vId);
      if (found) {
        setFormData((prev) => ({
          ...prev,
          vehicleAge: (new Date().getFullYear() - found.manufacture_year).toString(),
          idv: (found.idv || 650000).toString(),
          ncb: (found.ncb_percentage !== undefined ? found.ncb_percentage : 25).toString(),
          zeroDep: found.has_zero_dep ? 'true' : 'false',
          repairCost: searchParams.get('repair_cost') || (found.downtime_cost_per_day ? '35000' : '45000'),
        }));
        return;
      }
    }

    if (searchParams) {
      const isFromExtract = searchParams.get('from_extract') === 'true';
      setFromExtract(isFromExtract);

      const reg = searchParams.get('vehicle_reg');
      const insurer = searchParams.get('insurer');
      const policyNum = searchParams.get('policy_num');
      if (reg || insurer || policyNum) {
        setDocDetails({ vehicleReg: reg || undefined, insurer: insurer || undefined, policyNum: policyNum || undefined });
      }

      if (searchParams.get('idv') || searchParams.get('repair_cost')) {
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
        return;
      }
    }

    if (selectedVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleAge: (new Date().getFullYear() - selectedVehicle.manufacture_year).toString(),
        idv: (selectedVehicle.idv || 650000).toString(),
        ncb: (selectedVehicle.ncb_percentage !== undefined ? selectedVehicle.ncb_percentage : 25).toString(),
        zeroDep: selectedVehicle.has_zero_dep ? 'true' : 'false',
      }));
    }
  }, [searchParams, selectedVehicle, setSelectedVehicleId, vehicles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/financial/analyze-claim`, {
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
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Decision calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Initial calculation on mount or vehicle switch
  useEffect(() => {
    calculate();
  }, [calculate]);

  const commitToLedger = async () => {
    if (!result) return;
    setCommitting(true);
    try {
      const currentVehId = selectedVehicle?.id || 'V-REAL-101';
      const res = await fetch(`${API_BASE_URL}/api/v1/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-policyholder',
        },
        body: JSON.stringify({
          vehicle_id: currentVehId,
          policy_id: selectedVehicle?.policy_number || 'POL-REAL-101',
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

  // Convert backend calculation result to DecisionJourneyData format
  const journeyData: DecisionJourneyData | null = result
    ? {
        vehicleName: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Hyundai Creta',
        registrationNumber: selectedVehicle?.registration_number || 'MH-02-CB-1234',
        vehicleAge: parseFloat(formData.vehicleAge) || 3,
        insurerName: docDetails.insurer || 'Comprehensive Insurer',
        ncbPercentage: parseInt(formData.ncb) || 25,
        hasZeroDep: formData.zeroDep === 'true',
        totalRepairCost: result.total_estimate,
        depreciationDeduction: result.depreciation_deduction,
        deductibleDeduction: result.deductible_deduction,
        estimatedPayout: result.estimated_payout,
        immediateOutOfPocket: result.depreciation_deduction + result.deductible_deduction,
        futureNcbImpact: result.future_ncb_impact,
        effectiveClaimCost: result.effective_claim_cost,
        selfPayCost: result.self_pay_cost,
        estimatedSaving: result.estimated_saving,
        recommendation: result.recommendation,
        ruleVersion: 'MOTOR_INDIA_2026_V1',
      }
    : null;

  // Convert backend calculation result to YourMoneyData format
  const moneyData: YourMoneyData | null = result
    ? {
        totalRepairCost: result.total_estimate,
        estimatedPayout: result.estimated_payout,
        deductibleDeduction: result.deductible_deduction,
        immediateOutOfPocket: result.depreciation_deduction + result.deductible_deduction,
        futureNcbImpact: result.future_ncb_impact,
        effectiveClaimCost: result.effective_claim_cost,
        selfPayCost: result.self_pay_cost,
        estimatedSaving: result.estimated_saving,
        recommendation: result.recommendation,
        simulation3Year: result.simulation_3_year,
      }
    : null;

  return (
    <AppShell>
      <PageHeader
        title="Should I claim or pay myself?"
        description="Evaluate out-of-pocket repair costs against your estimated insurance payout and 3-year No-Claim Bonus (NCB) impact."
        breadcrumbs={[
          { label: 'Platform', href: '/decision' },
          { label: 'Claim Decision' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/decision/extract')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            >
              <FileSearch className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Upload Policy / Bill</span>
            </button>
          </div>
        }
      />

      {/* Provenance Alert if from Document Extraction */}
      {fromExtract && (
        <FadeIn className="mb-6">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl flex items-center justify-between text-sky-900 dark:text-sky-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <p className="font-semibold text-xs flex items-center gap-2">
                  <span>Parameters Extracted from Document</span>
                  <TrustBadge source="DOCUMENT_EXTRACTED" compact />
                </p>
                <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">
                  Vehicle: <strong className="font-mono">{docDetails.vehicleReg || 'MH02CB1234'}</strong> • Insurer:{' '}
                  <strong>{docDetails.insurer || 'HDFC ERGO'}</strong> • Policy:{' '}
                  <strong className="font-mono">{docDetails.policyNum || '2311/2004/99812/00/000'}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/decision/extract')}
              className="text-xs font-semibold px-3 py-1 bg-white dark:bg-zinc-900 border border-sky-300 dark:border-sky-800 rounded-md hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Re-Upload
            </button>
          </div>
        </FadeIn>
      )}

      {/* CORE DECISION JOURNEY VISUALIZATION */}
      {journeyData && (
        <SlideUp delay={0.1} className="mb-8">
          <DecisionJourney data={journeyData} />
        </SlideUp>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Parameter Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>Claim Parameters</span>
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Deterministic Indian Motor Tariff model
                </p>
              </div>
              <TrustBadge source="COMPUTED_RESULT" label="Tariff GR.8/9" />
            </div>

            {/* Vehicle Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Vehicle Profile
                </label>
                <Link
                  href="/onboarding"
                  className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                >
                  + Add Vehicle
                </Link>
              </div>
              <select
                value={selectedVehicleId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVehicleId(val);
                  const found = vehicles.find((v) => v.id === val);
                  if (found) {
                    setFormData((prev) => ({
                      ...prev,
                      vehicleAge: (new Date().getFullYear() - found.manufacture_year).toString(),
                      idv: (found.idv || 650000).toString(),
                      ncb: (found.ncb_percentage !== undefined ? found.ncb_percentage : 25).toString(),
                      zeroDep: found.has_zero_dep ? 'true' : 'false',
                      repairCost: found.downtime_cost_per_day ? '35000' : prev.repairCost,
                    }));
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:ring-1 focus:ring-zinc-900"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.registration_number}) {v.is_demo ? '[DEMO]' : '[MY VEHICLE]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Workshop Repair Estimate (₹)
                  </label>
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {formatINR(Number(formData.repairCost) || 0)}
                  </span>
                </div>
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
                  Dominant Damaged Part Category
                </label>
                <select
                  name="partCategory"
                  value={formData.partCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="metal">Metal (Age-based Depreciation 0%–50%)</option>
                  <option value="plastic">Plastic / Rubber (Fixed 50% Depreciation)</option>
                  <option value="glass">Glass (0% Depreciation)</option>
                  <option value="fiberglass">Fiberglass (Fixed 30% Depreciation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Insured Declared Value (₹)
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
                    Compulsory Deductible (₹)
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
                    Zero-Depreciation Addon
                  </label>
                  <select
                    name="zeroDep"
                    value={formData.zeroDep}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="false">No (Standard Tariff Dep)</option>
                    <option value="true">Yes (Zero Dep Active)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Motor Tariff Math...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Re-Calculate Comparison</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Notice on External Authority */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">External Authority Notice</p>
            <p className="leading-relaxed">
              VeriSure models financial outcomes based on Indian Motor Tariff GR.8/GR.9 schedules. The final settlement or claim approval remains with your authorized insurer/surveyor.
            </p>
          </div>
        </div>

        {/* Right Column: Comparative Visualizations & Explanations */}
        <div className="lg:col-span-8 space-y-6">
          {!result || !moneyData ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <Scale className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Awaiting Parameter Input
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Configure your repair estimate and current policy schedule on the left to view the deterministic comparison.
              </p>
            </div>
          ) : (
            <FadeIn className="space-y-6">
              {/* SIDE-BY-SIDE YOUR MONEY COMPARISON BARS */}
              <YourMoneyComparison data={moneyData} loading={loading} />

              {/* VERISURE EXPLAINS PROGRESSIVE DISCLOSURE */}
              <VeriSureExplains
                totalRepairCost={result.total_estimate}
                estimatedPayout={result.estimated_payout}
                deductible={result.deductible_deduction}
                depreciationDeduction={result.depreciation_deduction}
                ncbPercentage={parseInt(formData.ncb) || 20}
                futureNcbImpact={result.future_ncb_impact}
                recommendation={result.recommendation}
                ruleVersion="MOTOR_INDIA_2026_V1"
                txId={committedClaim?.blockchain_tx_id}
                canonicalHash={committedClaim?.canonical_hash}
              />

              {/* 3-Year Projection Sensitivity Chart */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      3-Year Estimated Financial Impact Trajectory
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Comparing future renewal premiums: NCB reset after claim vs cumulative discount intact
                    </p>
                  </div>
                  <TrustBadge source="COMPUTED_RESULT" label="Multi-Year Model" />
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
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Record Verification Commitment Box */}
              <div className="rounded-2xl border border-sky-200 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Anchor Decision Calculation to Consortium Ledger
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Commit a SHA-256 state fingerprint to the Hyperledger Fabric dual-peer consortium for tamper-evident record verification.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={commitToLedger}
                    disabled={committing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    {committing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{committing ? 'Verifying on Fabric...' : 'Commit to Private Ledger'}</span>
                  </button>
                </div>

                {committedClaim && (
                  <FadeIn className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-sky-200 dark:border-sky-800 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Record Verified & Committed
                      </span>
                      <TrustBadge source="BLOCKCHAIN_RECORD" txId={committedClaim.blockchain_tx_id} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg">
                      <div>
                        <span className="text-zinc-400">Record ID:</span> {committedClaim.id}
                      </div>
                      <div>
                        <span className="text-zinc-400">Verification Tx:</span>{' '}
                        {truncateHash(committedClaim.blockchain_tx_id, 8, 8)}
                      </div>
                      <div className="sm:col-span-2 truncate">
                        <span className="text-zinc-400">Fingerprint (SHA-256):</span> {committedClaim.canonical_hash}
                      </div>
                    </div>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => router.push(`/verification?claimId=${committedClaim.id}`)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Inspect in Verification Console</span>
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
