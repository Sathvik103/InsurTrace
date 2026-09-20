'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { formatINR } from '@/lib/formatters';
import {
  Truck,
  Car,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Scale,
  Calendar,
  DollarSign,
  TrendingDown,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function FleetPage() {
  const router = useRouter();
  const { vehicles, setSelectedVehicleId } = useVehicle();

  // Filter commercial vehicles
  const commercialVehicles = vehicles.filter((v) => v.usage_type && v.usage_type !== 'PERSONAL');

  // Downtime Simulator State
  const [selectedSimVehicleId, setSelectedSimVehicleId] = useState<string>(
    commercialVehicles[0]?.id || 'V-COMM-201'
  );
  const [repairDaysClaim, setRepairDaysClaim] = useState<number>(10);
  const [repairDaysFastTrack, setRepairDaysFastTrack] = useState<number>(2);
  const [repairEstimate, setRepairEstimate] = useState<number>(35000);

  const activeSimVehicle =
    vehicles.find((v) => v.id === selectedSimVehicleId) || commercialVehicles[0] || vehicles[0];

  const dailyRate = activeSimVehicle?.downtime_cost_per_day || 3000;
  const downtimeLossClaim = repairDaysClaim * dailyRate;
  const downtimeLossFastTrack = repairDaysFastTrack * dailyRate;

  // Total Fleet Stats
  const totalFleetDowntimeDaily = commercialVehicles.reduce(
    (sum, v) => sum + (v.downtime_cost_per_day || 0),
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Fleet & Commercial Management"
          subtitle="Real-time oversight of commercial carriers, daily downtime financial impact, and regulatory permits."
          breadcrumbs={[
            { label: 'Platform', href: '/decision' },
            { label: 'Fleet' },
          ]}
          actions={
            <Link
              href="/vehicles/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Commercial Vehicle</span>
            </Link>
          }
        />

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Commercial Fleet</span>
              <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {commercialVehicles.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Cabs, Goods Carriers, Passenger</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Policies</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {commercialVehicles.filter((v) => v.policy_number).length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Commercial Package & Zero-Dep</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Daily Downtime Exposure</span>
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {formatINR(totalFleetDowntimeDaily)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Total revenue loss if entire fleet halted</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Permits & Fitness</span>
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              100%
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">All vehicles compliant with RTO dates</p>
          </div>
        </div>

        {/* Commercial Downtime Calculator / Simulator */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Business Impact Analysis
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Commercial Downtime vs Claim Payout
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                When a commercial vehicle waits 7-12 days in a workshop for insurance approval, lost
                daily revenue frequently exceeds the insurance payout.
              </p>
            </div>

            <select
              value={selectedSimVehicleId}
              onChange={(e) => setSelectedSimVehicleId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              {commercialVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Estimated Repair Bill (₹)
                </label>
                <input
                  type="number"
                  value={repairEstimate}
                  onChange={(e) => setRepairEstimate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Days in Workshop for Claim (Inspection + Approval)
                </label>
                <input
                  type="number"
                  value={repairDaysClaim}
                  onChange={(e) => setRepairDaysClaim(parseInt(e.target.value) || 1)}
                  min="1"
                  max="30"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Typically 7 to 14 business days</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Days for Fast-Track Self-Pay Repair
                </label>
                <input
                  type="number"
                  value={repairDaysFastTrack}
                  onChange={(e) => setRepairDaysFastTrack(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Direct garage turnover: 1 to 3 days</p>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Claim Path */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Path A: Insurance Claim
                  </span>
                  <div className="text-xl font-extrabold font-mono text-rose-700 dark:text-rose-300 mt-1">
                    {formatINR(downtimeLossClaim + 2500)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Deductible + Revenue Lost during {repairDaysClaim} days downtime
                  </div>

                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Business Downtime:</span>
                      <span className="font-mono font-semibold text-rose-700 dark:text-rose-400">
                        {formatINR(downtimeLossClaim)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Compulsory Deductible:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">₹2,500</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300">
                  ⚠️ Prolonged repair cycle halts commercial earning.
                </div>
              </div>

              {/* Option B: Fast Track Self-Pay */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Path B: Fast-Track Self-Pay
                  </span>
                  <div className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatINR(repairEstimate + downtimeLossFastTrack)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Full repair paid + only {repairDaysFastTrack} days downtime
                  </div>

                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Repair Cost:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {formatINR(repairEstimate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Downtime Loss:</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatINR(downtimeLossFastTrack)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Preserved NCB:</span>
                      <span className="font-semibold text-emerald-600">Saved for next year</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ Back on road in {repairDaysFastTrack} days earning revenue.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Fleet Table */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Registered Commercial Vehicles
              </h3>
              <p className="text-xs text-zinc-500">
                Regulatory certificates, permit statuses, and direct actions
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">{commercialVehicles.length} Units</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-700/60">
                <tr>
                  <th className="px-5 py-3 font-semibold">Vehicle & Model</th>
                  <th className="px-5 py-3 font-semibold">Registration</th>
                  <th className="px-5 py-3 font-semibold">Usage Category</th>
                  <th className="px-5 py-3 font-semibold">Permit Details</th>
                  <th className="px-5 py-3 font-semibold">Fitness Validity</th>
                  <th className="px-5 py-3 font-semibold">Downtime Loss</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {commercialVehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div>
                        {v.make} {v.model}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        {v.variant || `${v.manufacture_year} • ${v.fuel_type}`}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {v.registration_number}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                        {v.usage_type?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {v.permit_info || 'State Permit Active'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{v.fitness_valid_until || 'Valid 2027'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {v.downtime_cost_per_day ? `${formatINR(v.downtime_cost_per_day)}/day` : '—'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            router.push(`/decision?vehicle_id=${v.id}`);
                          }}
                          className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                        >
                          Check Claim
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            router.push(`/vehicles/${v.id}`);
                          }}
                          className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
