'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Car, Check, Clock, FileCheck2, FileText, KeyRound, Lock, Scale, ShieldCheck, UserRound } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { NumberPlate } from '@/components/vehicle/NumberPlate';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';

const EASE = [0.16, 1, 0.3, 1] as const;

interface TimelineEvent {
  date: string;
  event_type: string;
  title: string;
  description: string;
  provenance_type: string;
  actor: string;
  blockchain_verified: boolean;
  blockchain_tx_id?: string | null;
  claim_id?: string;
  ledger_sync_status?: string;
}

interface TimelineResponse {
  total_events: number;
  timeline: TimelineEvent[];
  integrity_notice: string;
}

const EVENT_ICON: Record<string, typeof Car> = {
  REGISTRATION: Car,
  OWNERSHIP: UserRound,
  POLICY_ISSUED: FileCheck2,
  CLAIM_FILED: Scale,
  CONSENT_GRANTED: KeyRound,
};

const PROVENANCE: Record<string, string> = {
  DEMO_RECORD: 'Demo record',
  USER_PROVIDED_RECORD: 'Entered by owner',
  DATABASE_RECORD: 'ClearClaim record',
  COMPUTED_RECORD: 'Calculated',
};

function daysUntil(date?: string) {
  if (!date) return null;
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

export default function VehicleHistoryPage() {
  const reduce = useReducedMotion();
  const params = useParams();
  const id = String(params?.id || '');
  const { vehicles, setSelectedVehicleId } = useVehicle();
  const vehicle = vehicles.find((v) => v.id === id);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = () => {
    setError(null);
    apiFetch<TimelineResponse>(`/api/v1/vehicles/${encodeURIComponent(id)}/timeline`)
      .then(setData)
      .catch(setError);
  };
  useEffect(() => {
    if (!id) return;
    setSelectedVehicleId(id);
    apiFetch<TimelineResponse>(`/api/v1/vehicles/${encodeURIComponent(id)}/timeline`)
      .then(setData)
      .catch(setError);
  }, [id, setSelectedVehicleId]);

  const events = data?.timeline ?? [];
  const anchored = events.filter((e) => e.blockchain_verified).length;
  const claimEvents = events.filter((e) => e.event_type === 'CLAIM_FILED').length;

  const checklist = useMemo(
    () => [
      { label: 'Car details added', done: !!vehicle },
      { label: 'IDV on file', done: !!vehicle?.idv },
      { label: 'No-Claim Bonus on file', done: vehicle?.ncb_percentage != null },
      { label: 'Policy number on file', done: !!vehicle?.policy_number },
      { label: 'A claim check saved', done: claimEvents > 0 },
      { label: 'A record anchored on the ledger', done: anchored > 0 },
    ],
    [vehicle, claimEvents, anchored]
  );
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = doneCount / checklist.length;
  const days = daysUntil(vehicle?.policy_expiry);
  const commercial = vehicle?.usage_type && vehicle.usage_type !== 'PERSONAL';

  if (!vehicle && !data && error == null) {
    return (
      <AppShell>
        <div className="vs-shimmer h-64 rounded-2xl" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Summary */}
        <motion.section initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="vs-surface overflow-hidden">
          <div className="vs-grain relative grid items-center gap-6 overflow-hidden bg-navy-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="relative min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/15 px-2.5 py-0.5 text-xs font-medium text-white/70">{vehicle ? BODY_LABEL[bodyTypeOf(vehicle)] : 'Vehicle'}</span>
                {vehicle?.is_demo && <span className="rounded-md bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">Demo</span>}
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/55">
                {vehicle?.registration_number && <NumberPlate value={vehicle.registration_number} commercial={!!commercial} />}
                <span>{vehicle?.variant ? `${vehicle.variant} · ` : ''}{vehicle?.manufacture_year}{vehicle?.fuel_type ? ` · ${vehicle.fuel_type}` : ''}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/decision?vehicle_id=${encodeURIComponent(id)}`} className="vs-btn-signal py-2.5 text-sm">Check a claim <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/decision/consent" className="vs-btn-ghost-dark py-2.5 text-sm"><Lock className="h-4 w-4" /> Share access</Link>
                <Link href="/reports" className="vs-btn-ghost-dark py-2.5 text-sm"><FileText className="h-4 w-4" /> Passport</Link>
              </div>
            </div>
            {vehicle && (
              <motion.div initial={reduce ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: EASE }} className="relative">
                <CarSilhouette vehicle={vehicle} className="w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]" />
              </motion.div>
            )}
          </div>
          <dl className="grid grid-cols-2 border-t border-navy-100 sm:grid-cols-4">
            {[
              { label: 'IDV (cover)', value: vehicle?.idv ? rupees(vehicle.idv) : 'Not added' },
              { label: 'No-Claim Bonus', value: vehicle?.ncb_percentage != null ? `${vehicle.ncb_percentage}%` : 'Not added' },
              { label: 'Policy renewal', value: days === null ? 'Not added' : days < 0 ? `Expired ${-days}d ago` : `In ${days} days` },
              { label: 'Ledger-anchored records', value: data ? String(anchored) : '...' },
            ].map((s, i) => (
              <div key={s.label} className={`p-5 ${i > 0 ? 'border-l border-navy-100' : ''} ${i === 2 ? 'max-sm:border-l-0 max-sm:border-t' : ''} ${i === 3 ? 'max-sm:border-t' : ''}`}>
                <dt className="text-xs text-navy-500">{s.label}</dt>
                <dd className={`tabular mt-1 text-lg font-semibold ${s.label === 'Policy renewal' && days !== null && days < 30 ? 'text-loss' : 'text-navy-900'}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </motion.section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Timeline */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">History</h2>
              <p className="text-sm text-navy-500">Everything recorded about this car in ClearClaim, newest first.</p>
            </div>
            {error != null && <ApiErrorNotice error={error} onRetry={load} />}
            {!data && error == null && <div className="space-y-3">{[0, 1, 2].map((k) => <div key={k} className="vs-shimmer h-20 rounded-2xl" />)}</div>}
            {data && (
              <ol className="relative space-y-4 pl-8">
                <motion.span className="absolute bottom-4 left-[15px] top-4 w-px bg-navy-200" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.9, ease: EASE }} style={{ originY: 0 }} aria-hidden="true" />
                {events.map((e, i) => {
                  const Icon = EVENT_ICON[e.event_type] || Clock;
                  return (
                    <motion.li key={`${e.event_type}-${i}`} initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease: EASE }} className="relative">
                      <span className={`absolute -left-8 top-4 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${e.blockchain_verified ? 'bg-gain text-white' : 'border border-navy-200 bg-white text-navy-600'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="vs-surface p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-navy-900">{e.title}</p>
                            <p className="text-sm text-navy-600">{e.description}</p>
                          </div>
                          <time className="shrink-0 text-xs text-navy-400">{e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</time>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                          <span className="rounded-md bg-navy-50 px-2 py-0.5 text-navy-600">{PROVENANCE[e.provenance_type] || 'Record'}</span>
                          {e.event_type === 'CLAIM_FILED' &&
                            (e.blockchain_verified ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-gain-soft px-2 py-0.5 text-gain"><ShieldCheck className="h-3 w-3" /> Anchored on ledger</span>
                            ) : (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-800">Anchoring pending</span>
                            ))}
                          {e.claim_id && (
                            <Link href={`/verification?claimId=${encodeURIComponent(e.claim_id)}`} className="text-steel-700 hover:underline">Verify →</Link>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            )}
            {data?.integrity_notice && <p className="rounded-2xl bg-navy-50 p-4 text-xs leading-relaxed text-navy-600">{data.integrity_notice}</p>}
          </section>

          {/* Completeness */}
          <aside className="space-y-4">
            <div className="vs-surface p-6">
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 44 44" className="h-16 w-16 -rotate-90" aria-hidden="true">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#e8e4da" strokeWidth="5" />
                  <motion.circle cx="22" cy="22" r="18" fill="none" stroke="#2f6b4f" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: pct }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }} />
                </svg>
                <div>
                  <p className="text-lg font-semibold text-navy-900">{doneCount} of {checklist.length}</p>
                  <p className="text-sm text-navy-500">Profile completeness</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-sm">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${c.done ? 'bg-gain text-white' : 'border border-navy-200 text-transparent'}`}><Check className="h-3 w-3" strokeWidth={3} /></span>
                    <span className={c.done ? 'text-navy-700' : 'text-navy-500'}>{c.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-navy-500">A complete profile means fewer questions each time you check a claim.</p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
