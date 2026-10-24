'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, ArrowUpRight, Clock, FileSearch, FileText, Lock, Plus, ScrollText, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { rupees, NCB_STEPS } from '@/lib/claimCheck';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { NumberPlate } from '@/components/vehicle/NumberPlate';

const EASE = [0.16, 1, 0.3, 1] as const;

interface ClaimRow {
  id: string;
  claim_number?: string;
  vehicle_id?: string;
  status: string;
  estimated_repair_cost: number;
  calculated_payout?: number | null;
  recommendation?: string | null;
  created_at?: string;
  ledger?: { sync_status: string; network_mode?: string | null; blockchain_tx_id?: string | null };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function daysUntil(date?: string) {
  if (!date) return null;
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

function LedgerState({ ledger }: { ledger?: ClaimRow['ledger'] }) {
  const s = ledger?.sync_status;
  if (s === 'COMMITTED' && ledger?.network_mode === 'MOCK')
    return <span className="inline-flex w-fit items-center rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-600">Sample · no ledger</span>;
  if (s === 'COMMITTED')
    return <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gain-soft px-2.5 py-1 text-xs font-semibold text-gain"><ShieldCheck className="h-3.5 w-3.5" /> Anchored on ledger</span>;
  if (s === 'FAILED')
    return <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><AlertTriangle className="h-3.5 w-3.5" /> Anchoring failed</span>;
  return <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" /> Anchoring pending</span>;
}

export default function VehiclesPage() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const { vehicles, selectedVehicle, setSelectedVehicleId } = useVehicle();
  const { activePersona, user } = useAuth();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [claimsError, setClaimsError] = useState<unknown>(null);

  const fetchClaims = useCallback(
    () =>
      apiFetch<ClaimRow[]>('/api/v1/claims')
        .then((rows) => {
          setClaimsError(null);
          setClaims(rows);
        })
        .catch((e) => {
          setClaimsError(e);
          setClaims([]);
        }),
    []
  );
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const firstName = (activePersona?.name || user?.email || '').replace(/\(.*\)/, '').split(/[\s@]/)[0];
  const heroCar = selectedVehicle || vehicles[0];
  const go = (v: Vehicle, href: string) => {
    setSelectedVehicleId(v.id);
    router.push(href);
  };
  const vehicleName = (id?: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model}` : 'Vehicle';
  };

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Hero */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="vs-grain relative overflow-hidden rounded-[32px] bg-navy-950 text-white"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-steel-600/30 blur-[100px]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-20%] bottom-[-35%] h-[70%] opacity-40"><div className="vs-floor h-full w-full" /></div>
          <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
                Dent, scrape or quote?
                <br />
                <span className="text-signal">Check before you claim.</span>
              </h1>
              <p className="mt-4 max-w-md text-white/60">Two minutes to see what the insurer pays, what you pay, and which costs less, with every number explained.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/decision" className="vs-btn-signal">Check a claim <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/xray" className="vs-btn-ghost-dark">X-ray a quote</Link>
              </div>
            </div>
            {heroCar && (
              <motion.div
                initial={reduce ? false : { opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: EASE }}
                className="hidden lg:block"
              >
                <CarSilhouette vehicle={heroCar} className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
                <p className="mt-2 text-center font-mono text-xs text-white/40">{heroCar.make} {heroCar.model} · {BODY_LABEL[bodyTypeOf(heroCar)]}</p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Shortcuts */}
        <section className="grid gap-3 md:grid-cols-3">
          {[
            { href: '/decision/extract', icon: FileSearch, title: 'Read a policy or estimate', body: 'Upload a PDF, check what we extracted' },
            { href: '/decision/consent', icon: Lock, title: 'Share with a workshop', body: 'Time-limited, revocable access' },
            { href: '/reports', icon: FileText, title: 'Vehicle passport', body: 'A verifiable history for resale' },
          ].map((a, i) => (
            <motion.div key={a.href} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: EASE }}>
              <Link href={a.href} className="group flex h-full items-center gap-4 rounded-[22px] border border-navy-100 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_18px_36px_-24px_rgba(10,16,34,0.35)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-signal"><a.icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy-950">{a.title}</span>
                  <span className="block truncate text-sm text-navy-500">{a.body}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-navy-300 transition duration-300 group-hover:rotate-45 group-hover:text-navy-950" />
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Cars */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-950">Your garage</h2>
              <p className="mt-1 text-sm text-navy-500">{vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}{vehicles.some((v) => v.is_demo) ? ' · sample vehicles are marked Demo' : ''}</p>
            </div>
            <Link href="/onboarding" className="vs-btn-secondary py-2.5"><Plus className="h-4 w-4" /> Add a car</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((v, i) => {
              const ncbIdx = Math.max(0, (NCB_STEPS as readonly number[]).indexOf(v.ncb_percentage ?? 0));
              const days = daysUntil(v.policy_expiry);
              return (
                <motion.article
                  key={v.id}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.6, ease: EASE }}
                  className="group flex flex-col overflow-hidden rounded-[28px] border border-navy-100 bg-white transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(10,16,34,0.35)]"
                >
                  <div className="relative bg-[#f6f5f0] px-6 pb-3 pt-8">
                    <div className="absolute left-4 top-4 flex gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-700 ring-1 ring-navy-100">{BODY_LABEL[bodyTypeOf(v)]}</span>
                      {v.is_demo && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">Demo</span>}
                      {v.is_local_only && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-600 ring-1 ring-navy-100">This browser only</span>}
                    </div>
                    <CarSilhouette vehicle={v} className="h-28 w-full transition duration-700 ease-out group-hover:translate-x-2" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-semibold tracking-tight text-navy-950">{v.make} {v.model}</h3>
                        <p className="text-xs text-navy-500">{v.manufacture_year}{v.fuel_type ? ` · ${v.fuel_type}` : ''}</p>
                      </div>
                      <NumberPlate value={v.registration_number} commercial={!!v.usage_type && v.usage_type !== 'PERSONAL'} />
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[11px] uppercase tracking-wide text-navy-400">Cover (IDV)</dt>
                        <dd className="tabular mt-0.5 font-semibold text-navy-950">{v.idv ? rupees(v.idv) : 'Not added'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-wide text-navy-400">No-Claim Bonus</dt>
                        <dd className="mt-0.5 font-semibold text-navy-950">{v.ncb_percentage != null ? `${v.ncb_percentage}%` : 'Not added'}</dd>
                        <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
                          {NCB_STEPS.slice(1).map((_, k) => (
                            <motion.span key={k} className={`h-1.5 flex-1 rounded-full ${k < ncbIdx ? 'bg-signal-600' : 'bg-navy-100'}`} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 + k * 0.06 }} style={{ originX: 0 }} />
                          ))}
                        </div>
                      </div>
                    </dl>

                    {days !== null && (
                      <p className={`mt-4 flex items-center gap-1.5 text-xs ${days < 30 ? 'font-medium text-loss' : 'text-navy-500'}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {days < 0 ? `Policy expired ${Math.abs(days)} days ago` : `Policy renews in ${days} days`}
                      </p>
                    )}

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                      <button type="button" onClick={() => go(v, `/decision?vehicle_id=${v.id}`)} className="vs-btn-primary py-2.5">Check a claim</button>
                      <button type="button" onClick={() => go(v, `/vehicles/${v.id}`)} className="vs-btn-secondary py-2.5">History</button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
            <Link href="/onboarding" className="group flex min-h-72 flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-navy-200 p-6 text-center transition hover:border-navy-950 hover:bg-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-950 text-signal transition duration-500 group-hover:rotate-90"><Plus className="h-6 w-6" /></span>
              <span className="font-display text-xl font-semibold text-navy-950">Add a vehicle</span>
              <span className="max-w-[16rem] text-sm text-navy-500">Registration and policy details take about a minute</span>
            </Link>
          </div>
        </section>

        {/* Saved claim records */}
        <section>
          <div className="mb-5">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-950">Saved checks</h2>
            <p className="mt-1 text-sm text-navy-500">Results you saved to your vehicles’ history. They are never sent to an insurer.</p>
          </div>
          {claimsError != null && <ApiErrorNotice error={claimsError} onRetry={fetchClaims} className="mb-3" />}
          {claims === null ? (
            <div className="space-y-2">{[0, 1].map((k) => <div key={k} className="vs-shimmer h-16 rounded-2xl" />)}</div>
          ) : claims.length === 0 && claimsError == null ? (
            <div className="flex flex-col items-center gap-2 rounded-[28px] border border-navy-100 bg-white p-10 text-center">
              <ScrollText className="h-8 w-8 text-navy-300" />
              <p className="font-semibold text-navy-950">No saved checks yet</p>
              <p className="text-sm text-navy-500">Run a claim check and press “Save claim record” to keep it here.</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[28px] border border-navy-100 bg-white">
              {claims.map((c, i) => (
                <motion.li key={c.id} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-navy-50 last:border-0">
                  <Link href={`/verification?claimId=${encodeURIComponent(c.id)}`} className="group flex flex-col gap-2 px-5 py-4 transition hover:bg-[#f6f5f0] sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy-950">{vehicleName(c.vehicle_id)} <span className="font-mono text-xs text-navy-400">· {c.claim_number || c.id.slice(0, 8)}</span></p>
                      <p className="text-xs text-navy-500">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · Repair {rupees(c.estimated_repair_cost)}
                        {c.calculated_payout != null ? ` · Insurer might pay ${rupees(c.calculated_payout)}` : ''}
                      </p>
                    </div>
                    <LedgerState ledger={c.ledger} />
                    <ArrowRight className="hidden h-4 w-4 text-navy-300 transition group-hover:translate-x-1 group-hover:text-navy-950 sm:block" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
