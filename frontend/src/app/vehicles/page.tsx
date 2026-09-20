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
  Car,
  Plus,
  ArrowRight,
  ShieldCheck,
  Scale,
  FileSearch,
  Truck,
  Sparkles,
  Calendar,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function VehiclesPage() {
  const router = useRouter();
  const { vehicles, selectedVehicleId, setSelectedVehicleId } = useVehicle();
  const [filter, setFilter] = useState<'all' | 'personal' | 'commercial'>('all');

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'personal') return !v.usage_type || v.usage_type === 'PERSONAL';
    if (filter === 'commercial') return v.usage_type && v.usage_type !== 'PERSONAL';
    return true;
  });

  const personalCount = vehicles.filter((v) => !v.usage_type || v.usage_type === 'PERSONAL').length;
  const commercialCount = vehicles.filter((v) => v.usage_type && v.usage_type !== 'PERSONAL').length;

  const handleSelectAndGo = (v: Vehicle, route: string) => {
    setSelectedVehicleId(v.id);
    router.push(route);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="My Vehicles"
          subtitle="Manage your registered personal and commercial vehicles, active policies, and verified records."
          breadcrumbs={[
            { label: 'Platform', href: '/decision' },
            { label: 'Vehicles' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/decision"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Claim Decision</span>
              </Link>
              <Link
                href="/vehicles/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </Link>
            </div>
          }
        />

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'personal'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Personal Cars ({personalCount})
          </button>
          <button
            onClick={() => setFilter('commercial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'commercial'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Commercial & Fleet ({commercialCount})</span>
          </button>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => {
            const isCommercial = v.usage_type && v.usage_type !== 'PERSONAL';
            const isCurrentlySelected = v.id === selectedVehicleId;

            return (
              <FadeIn key={v.id}>
                <div
                  className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white dark:bg-zinc-900/70 shadow-xs hover:shadow-md ${
                    isCurrentlySelected
                      ? 'border-sky-500/60 ring-2 ring-sky-500/20'
                      : 'border-zinc-200/80 dark:border-zinc-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            {v.make} {v.model}
                          </h3>
                          {v.variant && (
                            <span className="text-xs text-zinc-500 font-medium">
                              {v.variant}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                            {v.registration_number}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {v.manufacture_year} • {v.fuel_type || 'Petrol'}
                          </span>
                        </div>
                      </div>

                      {/* Usage & Demo Tag */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isCommercial ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            {v.usage_type?.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Personal
                          </span>
                        )}

                        {v.is_demo && (
                          <span className="text-[9px] uppercase font-semibold text-amber-600 dark:text-amber-400">
                            Sample Demo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Commercial Context Details */}
                    {isCommercial && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 grid grid-cols-2 gap-2 text-xs">
                        {v.permit_info && (
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                              Permit
                            </span>
                            <span className="text-zinc-800 dark:text-zinc-200 truncate block text-[11px]">
                              {v.permit_info}
                            </span>
                          </div>
                        )}
                        {v.downtime_cost_per_day && (
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                              Downtime Impact
                            </span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400 text-[11px]">
                              {formatINR(v.downtime_cost_per_day)}/day
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Policy Summary Info */}
                  <div className="px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Active Policy</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {v.has_zero_dep ? 'Zero-Depreciation' : 'Comprehensive'}
                      </span>
                    </div>

                    {v.idv && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Insured Declared Value</span>
                        <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                          {formatINR(v.idv)}
                        </span>
                      </div>
                    )}

                    {v.ncb_percentage !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Current No-Claim Bonus</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {v.ncb_percentage}% NCB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSelectAndGo(v, `/vehicles/${v.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                    >
                      <span>Vehicle History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleSelectAndGo(v, `/decision?vehicle_id=${v.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white transition-colors shadow-2xs"
                      title="Calculate whether to claim or pay for repairs yourself"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Check Claim</span>
                    </button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Add Another Vehicle Callout */}
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 sm:p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3">
            <Car className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Have another vehicle or commercial carrier?
          </h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
            Register your two-wheelers, passenger cars, delivery vans, or fleet vehicles to organize
            policies, compare claim math, and preserve verified records in one place.
          </p>
          <Link
            href="/vehicles/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Vehicle</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
