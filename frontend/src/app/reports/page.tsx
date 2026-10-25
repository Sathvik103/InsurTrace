'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, Lock, Printer } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/lib/api';
import { useSystemStatus } from '@/lib/useSystemStatus';
import { rupees } from '@/lib/claimCheck';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { BrandMark } from '@/components/brand/Logo';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { NumberPlate } from '@/components/vehicle/NumberPlate';

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
  DEMO_RECORD: 'Demo',
  USER_PROVIDED_RECORD: 'Owner',
  DATABASE_RECORD: 'ClearClaim',
};

/** Stable, human-readable document number derived from the vehicle id. */
function docNumber(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  return `CC-${h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7)}`;
}

export default function PassportPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="vs-shimmer h-96 rounded-2xl" />}>
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
      format: 'clearclaim-vehicle-passport/v2',
      document_number: docNumber(vehicle.id),
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
    a.download = `clearclaim-passport-${vehicle.registration_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const commercial = !!vehicle?.usage_type && vehicle.usage_type !== 'PERSONAL';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-steel-700">Vehicle passport</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-navy-950 sm:text-5xl">A history you can hand over.</h1>
          <p className="mt-3 max-w-lg text-navy-500">For selling the car, switching insurer or visiting a workshop. Print it, save it as PDF, or download the data.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => window.print()} className="vs-btn-secondary py-2.5"><Printer className="h-4 w-4" /> Print / PDF</button>
          <button type="button" onClick={exportJson} disabled={!vehicle || events === null} className="vs-btn-primary py-2.5"><Download className="h-4 w-4" /> Data</button>
        </div>
      </header>

      {/* Vehicle picker */}
      {vehicles.length > 1 && (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 print:hidden">
          {vehicles.map((v) => {
            const on = vehicleId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setPicked(v.id);
                  setSelectedVehicleId(v.id);
                  setEvents(null);
                }}
                aria-pressed={on}
                className={`w-44 shrink-0 rounded-xl border p-3 text-left transition duration-300 ${on ? 'border-navy-950 bg-navy-950 text-white' : 'border-navy-100 bg-white hover:-translate-y-0.5 hover:border-navy-300'}`}
              >
                <div className={`rounded-xl px-2 pt-1 ${on ? 'bg-white/[0.07]' : 'bg-[#f6f5f0]'}`}>
                  <CarSilhouette vehicle={v} className="h-12 w-full" />
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{v.make} {v.model}</p>
                <p className={`font-mono text-[11px] ${on ? 'text-white/50' : 'text-navy-400'}`}>{v.registration_number}</p>
              </button>
            );
          })}
        </div>
      )}

      {error != null && <div className="print:hidden"><ApiErrorNotice error={error} /></div>}

      {vehicle && (
        <motion.article
          key={vehicle.id}
          initial={reduce ? false : { opacity: 0, y: 24, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ transformPerspective: 1400 }}
          className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_40px_80px_-40px_rgba(20,19,16,0.35)] print:rounded-none print:border-0 print:shadow-none"
        >
          {/* Cover */}
          <div className="vs-grain relative overflow-hidden bg-navy-950 px-7 pb-8 pt-6 text-white print:bg-white print:text-navy-950 sm:px-10">
            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BrandMark size={26} />
                <span className="font-display font-semibold">Clear<span className="text-signal print:text-navy-950">Claim</span></span>
              </span>
              <span className="text-right font-mono text-[11px] leading-relaxed text-white/50 print:text-navy-500">
                No. {docNumber(vehicle.id)}
                <br />
                {generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="relative mt-8 grid items-end gap-6 sm:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal print:text-navy-500">Vehicle passport</p>
                <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">{vehicle.make} {vehicle.model}{vehicle.variant ? ` ${vehicle.variant}` : ''}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/60 print:text-navy-600">
                  <NumberPlate value={vehicle.registration_number} commercial={commercial} />
                  <span>{BODY_LABEL[bodyTypeOf(vehicle)]} · {vehicle.manufacture_year}{vehicle.vin ? ` · VIN ${vehicle.vin}` : ''}</span>
                </div>
                {vehicle.is_demo && <span className="mt-4 inline-block rounded-md bg-amber-300 px-3 py-1 text-xs font-semibold text-navy-950">Demo record: fictional</span>}
              </div>
              <CarSilhouette vehicle={vehicle} className="w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)] print:drop-shadow-none" />
            </div>

            {/* Integrity seal */}
            {events !== null && (
              <motion.div
                initial={reduce ? false : { scale: 1.6, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: -12, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 14 }}
                className={`absolute right-6 top-20 hidden h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-dashed text-center sm:flex ${anchored ? 'border-signal text-signal' : 'border-white/30 text-white/50'} print:border-navy-400 print:text-navy-500`}
              >
                <span className="font-display text-2xl font-semibold leading-none">{anchored}/{events.length}</span>
                <span className="mt-1 font-mono text-[9px] uppercase leading-tight tracking-wider">records<br />anchored</span>
              </motion.div>
            )}
          </div>

          <div className="space-y-9 p-7 sm:p-10">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                ['Year', String(vehicle.manufacture_year)],
                ['Fuel', vehicle.fuel_type || 'Not recorded'],
                ['Use', commercial ? 'Commercial' : 'Personal'],
                ['On ClearClaim since', vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Not recorded'],
              ].map(([k, v]) => (
                <div key={k} className="border-l-2 border-navy-100 pl-3">
                  <dt className="text-[11px] uppercase tracking-wide text-navy-400">{k}</dt>
                  <dd className="mt-1 font-semibold text-navy-950">{v}</dd>
                </div>
              ))}
            </dl>

            <section className="rounded-xl bg-[#f6f5f0] p-5 print:bg-white print:p-0">
              <h3 className="flex flex-wrap items-baseline gap-2 font-display text-lg font-semibold text-navy-950">
                Policy summary <span className="font-sans text-xs font-normal text-navy-500">entered by the owner, not verified with an insurer</span>
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ['IDV', vehicle.idv ? rupees(vehicle.idv) : 'Not added'],
                  ['No-Claim Bonus', vehicle.ncb_percentage != null ? `${vehicle.ncb_percentage}%` : 'Not added'],
                  ['Zero-dep cover', vehicle.has_zero_dep == null ? 'Not added' : vehicle.has_zero_dep ? 'Yes' : 'No'],
                  ['Policy number', vehicle.policy_number || 'Not added'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-wide text-navy-400">{k}</dt>
                    <dd className={`mt-0.5 break-all font-medium ${v === 'Not added' ? 'text-navy-300' : 'text-navy-950'}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h3 className="font-display text-lg font-semibold text-navy-950">History</h3>
              {events === null ? (
                <div className="mt-4 space-y-2">{[0, 1, 2].map((k) => <div key={k} className="vs-shimmer h-14 rounded-xl" />)}</div>
              ) : events.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">No records yet.</p>
              ) : (
                <ol className="relative mt-5 space-y-6 pl-8">
                  <motion.span
                    aria-hidden="true"
                    className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-navy-200"
                    initial={reduce ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                  {events.map((e, i) => (
                    <motion.li key={i} initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07, ease: EASE }} className="relative">
                      <span className={`absolute -left-8 top-1 h-[15px] w-[15px] rounded-full border-[3px] border-white ${e.blockchain_verified ? 'bg-signal-600' : 'bg-navy-300'} shadow-[0_0_0_1px_rgba(20,19,16,0.1)]`} />
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="min-w-0">
                          <p className="font-medium text-navy-950">{e.title}</p>
                          <p className="text-sm text-navy-500">{e.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs text-navy-400">{e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                          <span className="rounded-md bg-navy-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-navy-600">{PROVENANCE[e.provenance_type] || 'Record'}</span>
                          {e.blockchain_verified && <span className="rounded-md bg-navy-950 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-signal">Anchored</span>}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              )}
            </section>

            <p className="border-t border-navy-100 pt-5 text-xs leading-relaxed text-navy-500">
              “Anchored” records have a SHA-256 fingerprint on a Hyperledger Fabric ledger, which shows they are unchanged since they were saved. It does not prove that events happened, and policy details are not verified with any insurer.
              {ledgerStatus && ledgerStatus !== 'CONNECTED' ? ' The ledger is not connected to this deployment right now.' : ''} ClearClaim is not connected to VAHAN or insurer systems.
            </p>
          </div>
        </motion.article>
      )}

      <p className="flex items-center gap-2 text-sm text-navy-500 print:hidden">
        <Lock className="h-4 w-4" /> Want a workshop or insurer to see this online instead?{' '}
        <Link href="/decision/consent" className="font-semibold text-navy-950 underline-offset-2 hover:underline">Give them time-limited access</Link>
      </p>
    </div>
  );
}
