'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, FileText, Lock, Printer, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/lib/api';
import { useSystemStatus } from '@/lib/useSystemStatus';
import { rupees } from '@/lib/claimCheck';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { BrandLogo } from '@/components/brand/Logo';

const EASE = [0.16, 1, 0.3, 1] as const;

interface TimelineEvent {
  date: string;
  event_type: string;
  title: string;
  description: string;
  provenance_type: string;
  blockchain_verified: boolean;
  blockchain_tx_id?: string | null;
  claim_id?: string;
}

const PROVENANCE: Record<string, string> = {
  DEMO_RECORD: 'Demo record',
  USER_PROVIDED_RECORD: 'Entered by owner',
  DATABASE_RECORD: 'ClearClaim record',
};

export default function PassportPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="vs-shimmer h-96 rounded-[28px]" />}>
        <Passport />
      </Suspense>
    </AppShell>
  );
}

function Passport() {
  const reduce = useReducedMotion();
  const params = useSearchParams();
  const { vehicles, selectedVehicleId, setSelectedVehicleId } = useVehicle();
  const { status: system } = useSystemStatus();
  const [picked, setPicked] = useState<string>(params.get('vehicle_id') || '');
  const vehicleId = picked || selectedVehicleId || vehicles[0]?.id || '';
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [generatedAt] = useState(() => new Date());

  useEffect(() => {
    if (!vehicleId) return;
    let alive = true;
    apiFetch<{ timeline: TimelineEvent[] }>(`/api/v1/vehicles/${encodeURIComponent(vehicleId)}/timeline`)
      .then((d) => {
        if (!alive) return;
        setEvents(d.timeline);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setEvents([]);
        setError(e);
      });
    return () => {
      alive = false;
    };
  }, [vehicleId]);

  const anchored = (events || []).filter((e) => e.blockchain_verified).length;
  const ledgerStatus = system?.components?.hyperledger_fabric?.status;

  const exportJson = () => {
    if (!vehicle) return;
    // Only data actually on record; missing fields stay null rather than being filled in.
    const passport = {
      format: 'verisure-vehicle-passport/v2',
      generated_at: generatedAt.toISOString(),
      is_demo: !!vehicle.is_demo,
      vehicle: {
        id: vehicle.id,
        registration_number: vehicle.registration_number,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant ?? null,
        manufacture_year: vehicle.manufacture_year,
        fuel_type: vehicle.fuel_type ?? null,
        vin: vehicle.vin ?? null,
        usage_type: vehicle.usage_type ?? null,
      },
      policy_summary_entered_by_owner: {
        policy_number: vehicle.policy_number ?? null,
        idv: vehicle.idv ?? null,
        ncb_percentage: vehicle.ncb_percentage ?? null,
        zero_depreciation: vehicle.has_zero_dep ?? null,
        renewal_date: vehicle.policy_expiry ?? null,
      },
      events: (events || []).map((e) => ({
        date: e.date,
        type: e.event_type,
        title: e.title,
        description: e.description,
        source: e.provenance_type,
        ledger_anchored: e.blockchain_verified,
        ledger_transaction_id: e.blockchain_tx_id ?? null,
      })),
      integrity: {
        records: (events || []).length,
        ledger_anchored_records: anchored,
        note: 'Anchored records have a SHA-256 fingerprint committed to Hyperledger Fabric; this proves they are unchanged since anchoring, not that the underlying events occurred. Policy details are entered by the owner and are not insurer-verified.',
      },
    };
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verisure-passport-${vehicle.registration_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2 print:hidden">
        <span className="vs-chip"><FileText className="h-3.5 w-3.5 text-steel-600" /> Vehicle passport</span>
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">A history report you can share</h1>
        <p className="text-navy-600">Useful when selling the car, renewing with a new insurer, or visiting a workshop. Print it, save it as PDF, or download the data.</p>
      </header>

      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {vehicles.map((v) => (
            <button key={v.id} type="button" onClick={() => { setPicked(v.id); setSelectedVehicleId(v.id); setEvents(null); }} aria-pressed={vehicleId === v.id} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${vehicleId === v.id ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white text-navy-700 hover:border-navy-300'}`}>
              {v.make} {v.model}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => window.print()} className="vs-btn-secondary py-2.5"><Printer className="h-4 w-4" /> Print / PDF</button>
          <button type="button" onClick={exportJson} disabled={!vehicle || events === null} className="vs-btn-primary py-2.5"><Download className="h-4 w-4" /> Download data</button>
        </div>
      </div>

      {error != null && <div className="print:hidden"><ApiErrorNotice error={error} /></div>}

      {vehicle && (
        <motion.article key={vehicle.id} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="vs-surface overflow-hidden print:rounded-none print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/50 px-8 py-5">
            <BrandLogo size="sm" />
            <p className="text-xs text-navy-500">Generated {generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div className="space-y-8 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Vehicle passport</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">{vehicle.make} {vehicle.model}{vehicle.variant ? ` ${vehicle.variant}` : ''}</h2>
                <p className="mt-1 font-mono text-sm text-navy-600">{vehicle.registration_number}{vehicle.vin ? ` · VIN ${vehicle.vin}` : ''}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {vehicle.is_demo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Demo record: fictional</span>}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${anchored ? 'bg-gain-soft text-gain' : 'bg-navy-50 text-navy-600'}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {events === null ? 'Checking records…' : `${anchored} of ${events.length} records ledger-anchored`}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Year', String(vehicle.manufacture_year)],
                ['Fuel', vehicle.fuel_type || 'Not recorded'],
                ['Use', vehicle.usage_type && vehicle.usage_type !== 'PERSONAL' ? 'Commercial' : 'Personal'],
                ['Added to ClearClaim', vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Not recorded'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-navy-50/70 p-4">
                  <dt className="text-xs text-navy-500">{k}</dt>
                  <dd className="mt-1 font-semibold text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-sm font-semibold text-navy-900">Policy summary <span className="font-normal text-navy-500">(entered by the owner, not verified with an insurer)</span></h3>
              <dl className="mt-3 grid gap-4 sm:grid-cols-4">
                {[
                  ['IDV', vehicle.idv ? rupees(vehicle.idv) : 'Not added'],
                  ['No-Claim Bonus', vehicle.ncb_percentage !== undefined ? `${vehicle.ncb_percentage}%` : 'Not added'],
                  ['Zero-dep cover', vehicle.has_zero_dep === undefined ? 'Not added' : vehicle.has_zero_dep ? 'Yes' : 'No'],
                  ['Policy number', vehicle.policy_number || 'Not added'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-navy-500">{k}</dt>
                    <dd className="mt-0.5 font-medium text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-navy-900">History</h3>
              {events === null ? (
                <div className="mt-3 space-y-2">{[0, 1, 2].map((k) => <div key={k} className="vs-shimmer h-12 rounded-xl" />)}</div>
              ) : events.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">No records yet.</p>
              ) : (
                <ol className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100">
                  {events.map((e, i) => (
                    <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900">{e.title}</p>
                        <p className="text-sm text-navy-600">{e.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <span className="text-navy-500">{e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-navy-600">{PROVENANCE[e.provenance_type] || 'Record'}</span>
                        {e.blockchain_verified && <span className="rounded-full bg-gain-soft px-2 py-0.5 font-semibold text-gain">Anchored</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <p className="rounded-2xl bg-navy-50 p-4 text-xs leading-relaxed text-navy-600">
              “Anchored” records have a SHA-256 fingerprint on a Hyperledger Fabric ledger, which shows they are unchanged since they were saved. It does not prove that events happened, and policy details are not verified with any insurer.
              {ledgerStatus && ledgerStatus !== 'CONNECTED' ? ' The ledger is not connected to this deployment right now.' : ''} ClearClaim is not connected to VAHAN or insurer systems.
            </p>
          </div>
        </motion.article>
      )}

      <p className="flex items-center gap-2 text-sm text-navy-500 print:hidden">
        <Lock className="h-4 w-4" /> Want a workshop or insurer to see this online instead?{' '}
        <Link href="/decision/consent" className="font-semibold text-steel-700 hover:underline">Give them time-limited access</Link>
      </p>
    </div>
  );
}
