'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState, SkeletonCard } from '@/components/common/EmptyState';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatDate } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';
import {
  Wrench,
  CheckSquare,
  UploadCloud,
  RefreshCw,
  FileText,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Send,
  Lock,
} from 'lucide-react';

type GarageJob = {
  id: string;
  policy_id: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
};

type EstimatePartItem = {
  name: string;
  category: 'metal' | 'plastic' | 'glass' | 'fiberglass';
  cost: number;
};

export default function GarageDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<GarageJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Itemized Estimate Builder State
  const [parts, setParts] = useState<EstimatePartItem[]>([
    { name: 'Front Bumper Assembly', category: 'plastic', cost: 14500 },
    { name: 'Right Headlight Cluster', category: 'glass', cost: 8200 },
    { name: 'Right Fender Panel', category: 'metal', cost: 12500 },
  ]);
  const [laborCost, setLaborCost] = useState(9800);
  const [targetPolicy, setTargetPolicy] = useState('POL-REAL-101');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/claims`, {
        headers: { Authorization: 'Bearer dev-garage' },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch garage repair jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const addPartRow = () => {
    setParts([...parts, { name: '', category: 'metal', cost: 0 }]);
  };

  const removePartRow = (idx: number) => {
    setParts(parts.filter((_, i) => i !== idx));
  };

  const updatePart = (idx: number, field: keyof EstimatePartItem, val: any) => {
    const updated = [...parts];
    updated[idx] = { ...updated[idx], [field]: val };
    setParts(updated);
  };

  const totalPartsCost = parts.reduce((acc, p) => acc + (Number(p.cost) || 0), 0);
  const subtotal = totalPartsCost + Number(laborCost);
  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;

  const submitEstimate = async () => {
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-garage',
        },
        body: JSON.stringify({
          policy_id: targetPolicy,
          accident_id: 'EST-' + Date.now().toString().slice(-6),
          estimated_repair_cost: grandTotal,
          status: 'ESTIMATE_SUBMITTED',
        }),
      });
      if (!res.ok) throw new Error('Failed to record garage estimate');
      setSuccessMessage('Itemized estimate transmitted to insurer desk and recorded.');
      await fetchJobs();
    } catch (e) {
      console.error(e);
      alert('Failed to submit estimate. Verify backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Garage Workshop Portal"
        description="Authorized network bodyworks: build itemized parts & labour repair estimates, apply standard IRDAI material schedules, and sync estimates with insurer claims desks."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Enterprise Roles' },
          { label: 'Garage Workshop' },
        ]}
        actions={
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Jobs</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Repair Jobs"
          value={jobs.length}
          subtext="In-progress workshop orders"
          icon={Wrench}
        />
        <StatCard
          label="Workshop ID"
          value="ORG-0003"
          subtext="Quality Bodyworks • Cashless"
          icon={ShieldCheck}
        />
        <StatCard
          label="Parts Admissibility"
          value="IRDAI V1"
          subtext="Auto Depreciation Split"
          icon={FileText}
        />
        <StatCard
          label="Ledger Integration"
          value="ACTIVE"
          subtext="Hyperledger Fabric Channel"
          icon={Lock}
          trend={{ value: 'SYNCED', isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Jobs Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Active Workshop Repair Jobs
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {jobs.length} jobs
              </span>
            </div>

            {loading ? (
              <SkeletonCard lines={3} />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No Active Repair Jobs"
                description="Your garage currently has no active claim repair authorizations. Create and submit an estimate on the right."
              />
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {job.id}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Approved Estimate:</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatINR(job.estimated_repair_cost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Policy: {job.policy_id}</span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Itemized Repair Estimate Builder */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Itemized Estimate Builder
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Categorize parts by material for automated IRDAI depreciation computation
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                GST 18% APPLICABLE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Target Vehicle & Policy
                </label>
                <select
                  value={targetPolicy}
                  onChange={(e) => setTargetPolicy(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="POL-REAL-101">POL-REAL-101: Hyundai Creta (MH-02-CB-1234)</option>
                  <option value="POL-REAL-102">POL-REAL-102: Tata Nexon EV (DL-01-EV-4321)</option>
                  <option value="POL-REAL-103">POL-REAL-103: Maruti Swift (KA-03-MG-7890)</option>
                  <option value="POL-REAL-104">POL-REAL-104: Honda City ZX (TS-09-FA-5678)</option>
                </select>
              </div>

              {/* Parts Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Repair & Replacement Parts
                  </span>
                  <button
                    onClick={addPartRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Part</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {parts.map((part, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Part name..."
                        value={part.name}
                        onChange={(e) => updatePart(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <select
                        value={part.category}
                        onChange={(e) => updatePart(idx, 'category', e.target.value)}
                        className="w-28 px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="metal">Metal</option>
                        <option value="plastic">Plastic (50%)</option>
                        <option value="glass">Glass (0%)</option>
                        <option value="fiberglass">Fiberglass (30%)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={part.cost || ''}
                        onChange={(e) => updatePart(idx, 'cost', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        onClick={() => removePartRow(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                        title="Delete part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labour Charges */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Labour Operations Charge (Denting, Painting, Disassembly) (₹)
                </label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Estimate Summary Ledger */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Parts Subtotal:</span>
                  <span>{formatINR(totalPartsCost)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Labour Subtotal:</span>
                  <span>{formatINR(laborCost)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>GST (18% Statutory):</span>
                  <span>{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Total Estimate Amount:</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={submitEstimate}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting & Sealing on Ledger...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmit Estimate to Insurer Desk</span>
                  </>
                )}
              </button>

              {successMessage && (
                <FadeIn className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </FadeIn>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
