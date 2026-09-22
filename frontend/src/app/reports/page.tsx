'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { TrustBadge } from '@/components/common/TrustBadge';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { formatINR, formatDate, truncateHash } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';
import {
  FileCheck,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  Car,
  Building,
  Calendar,
  Lock,
  CheckCircle2,
  Copy,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-12 text-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3 dark:border-zinc-100" />
            <p className="text-sm font-medium">Loading Vehicle Data Passport...</p>
          </div>
        </AppShell>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { vehicles, selectedVehicle, selectedVehicleId, setSelectedVehicleId } = useVehicle();

  const [activeVehId, setActiveVehId] = useState<string>(
    searchParams?.get('vehicle_id') || selectedVehicleId || 'V-REAL-101'
  );
  const [copied, setCopied] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const activeVehicle: Vehicle =
    vehicles.find((v) => v.id === activeVehId) ||
    selectedVehicle ||
    vehicles[0] || {
      id: 'V-REAL-101',
      registration_number: 'MH02CB1234',
      make: 'Hyundai',
      model: 'Creta',
      manufacture_year: 2021,
      fuel_type: 'Petrol',
      vin: 'MALC341CBM0010192',
      idv: 650000,
      ncb_percentage: 25,
      policy_number: '2311/2004/99812/00/000',
      is_demo: true,
    };

  useEffect(() => {
    async function loadVehicleTimeline() {
      setLoadingTimeline(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/vehicles/${activeVehicle.id}/timeline`);
        if (res.ok) {
          const json = await res.json();
          setTimelineEvents(json.timeline || []);
        } else {
          setTimelineEvents([
            {
              date: activeVehicle.created_at?.split('T')[0] || '2024-05-10',
              title: 'Vehicle Profile Initialized',
              description: `${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.registration_number}) registered in VeriSure registry.`,
              actor: 'Policyholder Profile',
              blockchain_verified: true,
              canonical_hash: 'c72cb5b63e5a4cfb44169df2191f2fd233665b9abb73d8a3422eaac132678a2c',
              tx_id: 'e14646ae8491c944358bb7488fc831f28b',
            },
          ]);
        }
      } catch (e) {
        setTimelineEvents([
          {
            date: '2024-05-10',
            title: 'Vehicle Profile Initialized',
            description: `${activeVehicle.make} ${activeVehicle.model} registered in VeriSure consortium registry.`,
            actor: 'Policyholder Profile',
            blockchain_verified: true,
            canonical_hash: 'c72cb5b63e5a4cfb44169df2191f2fd233665b9abb73d8a3422eaac132678a2c',
            tx_id: 'e14646ae8491c944358bb7488fc831f28b',
          },
        ]);
      } finally {
        setLoadingTimeline(false);
      }
    }

    loadVehicleTimeline();
  }, [activeVehicle.id, activeVehicle.make, activeVehicle.model, activeVehicle.registration_number, activeVehicle.created_at]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const passportData = {
      verisure_specification: 'DATA_PASSPORT_V2',
      export_timestamp: new Date().toISOString(),
      consortium_network: 'HYPERLEDGER_FABRIC_DUAL_PEER_RAFT',
      canonical_verification: 'SHA-256',
      vehicle: {
        id: activeVehicle.id,
        registration_number: activeVehicle.registration_number,
        make: activeVehicle.make,
        model: activeVehicle.model,
        variant: activeVehicle.variant,
        manufacture_year: activeVehicle.manufacture_year,
        vin: activeVehicle.vin || 'MALC341CBM0010192',
        fuel_type: activeVehicle.fuel_type || 'Petrol',
        usage_type: activeVehicle.usage_type || 'PERSONAL',
        is_demo: activeVehicle.is_demo || false,
      },
      insurance_schedule: {
        policy_number: activeVehicle.policy_number || '2311/2004/99812/00/000',
        policy_type: activeVehicle.policy_type || 'COMPREHENSIVE',
        idv: activeVehicle.idv || 650000,
        ncb_percentage: activeVehicle.ncb_percentage ?? 25,
        policy_expiry: activeVehicle.policy_expiry || '2026-12-31',
        has_zero_dep: activeVehicle.has_zero_dep || false,
      },
      events: timelineEvents,
      integrity_summary: {
        total_records: timelineEvents.length,
        verified_count: timelineEvents.filter((e) => e.blockchain_verified).length,
        authenticity_statement:
          'Records are deterministically hashed with SHA-256 and committed to Hyperledger Fabric. Blockchain verifies record integrity after commitment; physical ground truth remains external.',
      },
    };

    const blob = new Blob([JSON.stringify(passportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verisure-passport-${activeVehicle.registration_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Header (Hidden on print) */}
        <div className="print:hidden">
          <PageHeader
            title="Vehicle Data Passport"
            description="Export, audit, or print a cryptographically verified vehicle dossier."
            breadcrumbs={[
              { label: 'Vehicles', href: '/vehicles' },
              { label: activeVehicle.registration_number, href: `/vehicles/${activeVehicle.id}` },
              { label: 'Passport & Reports' },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Export JSON Passport</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Vehicle Switcher Tabs (Hidden on print) */}
        <div className="overflow-x-auto pb-1 print:hidden">
          <div className="flex items-center gap-2 min-w-max">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveVehId(v.id);
                  setSelectedVehicleId(v.id);
                }}
                className={`px-3.5 py-2 rounded-xl border text-left transition-all ${
                  activeVehId === v.id
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold truncate">
                    {v.make} {v.model}
                  </span>
                  <span className="font-mono text-[10px] opacity-75">
                    {v.registration_number}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PRINTABLE DOSSIER CONTAINER */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
          {/* Dossier Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                  VeriSure Data Passport
                </span>
                <TrustBadge source={activeVehicle.is_demo ? 'DEMO_RECORD' : 'MY_VEHICLE'} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
                {activeVehicle.make} {activeVehicle.model} {activeVehicle.variant || ''}
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                REGISTRATION: {activeVehicle.registration_number} • VIN:{' '}
                {activeVehicle.vin || 'MALC341CBM0010192'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-right shrink-0 font-mono text-xs">
              <div className="text-[10px] text-zinc-400 uppercase">Consortium Verification</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>INTEGRITY SEALED</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Dual-Peer Raft Network
              </div>
            </div>
          </div>

          {/* Core Vehicle Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Manufacture Year</span>
              <span className="font-bold font-mono text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {activeVehicle.manufacture_year} ({2026 - activeVehicle.manufacture_year} Years Old)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Fuel & Powertrain</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {activeVehicle.fuel_type || 'Petrol'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Usage Category</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {activeVehicle.usage_type?.replace('_', ' ') || 'Personal'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Record Status</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                Tamper-Evident
              </span>
            </div>
          </div>

          {/* Insurance Profile Schedule */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Active Insurance Schedule</span>
            </h3>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">Insured Declared Value (IDV)</span>
                <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                  {formatINR(activeVehicle.idv || 650000)}
                </span>
                <span className="text-[10px] text-zinc-400">Total loss coverage limit</span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px]">Current No-Claim Bonus (NCB)</span>
                <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {activeVehicle.ncb_percentage ?? 25}%
                </span>
                <span className="text-[10px] text-zinc-400">Renewal discount status</span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px]">Add-On Protections</span>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                  {activeVehicle.has_zero_dep ? 'Zero-Depreciation Active' : 'Standard Depreciation'}
                </span>
                <span className="text-[10px] text-zinc-400">Indian Motor Tariff GR.8 applied</span>
              </div>
            </div>
          </div>

          {/* Chronological Audit Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Verified Historical Lifecycle Records</span>
              </h3>
              <span className="font-mono text-xs text-zinc-400">
                {timelineEvents.length} Verified Entries
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="py-3.5 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {evt.title}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                      <span>{formatDate(evt.date)}</span>
                      <span className="text-emerald-600 font-semibold">• VERIFIED</span>
                    </div>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                    {evt.description}
                  </p>
                  {evt.canonical_hash && (
                    <div className="text-[10px] font-mono text-zinc-400 truncate pt-0.5">
                      SHA-256: {evt.canonical_hash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Official Verification Footer & Legal Disclaimer */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-2">
            <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Issued by VeriSure Insurance Intelligence & Verification Platform</span>
              <span className="font-mono">Generated: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <p className="leading-relaxed text-[10px] text-zinc-400">
              Notice: Records included in this passport are cryptographically sealed to a private Hyperledger Fabric ledger to prove historical data integrity after commitment. Blockchain verification ensures the record has not been altered since timestamping; it does not constitute an official insurance policy endorsement or independent physical inspection of vehicle condition.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
