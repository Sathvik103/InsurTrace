'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Car, Clock, FileSearch, FileText, Lock, Plus, ScrollText, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { rupees, NCB_STEPS } from '@/lib/claimCheck';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';

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
  ledger?: { sync_status: string; blockchain_tx_id?: string | null };
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

export default function VehiclesPage() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const { vehicles, setSelectedVehicleId } = useVehicle();
  const { activePersona, user } = useAuth();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [claimsError, setClaimsError] = useState<unknown>(null);

  const loadClaims = async () => {
    setClaimsError(null);
    try {
      setClaims(await apiFetch<ClaimRow[]>('/api/v1/claims'));
    } catch (e) {
      setClaimsError(e);
      setClaims([]);
    }
  };
  useEffect(() => {
    apiFetch<ClaimRow[]>('/api/v1/claims')
      .then(setClaims)
      .catch((e) => {
        setClaimsError(e);
        setClaims([]);
      });
  }, []);

  const firstName = (activePersona?.name || user?.email || '').replace(/\(.*\)/, '').split(/[\s@]/)[0];
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
      <div className="space-y-10">
        {/* Greeting + primary action */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-navy-900 via-navy-800 to-steel-800 p-8 text-white"
          >
            <div className="vs-grid-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <motion.div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-steel-500/30 blur-3xl"
              animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative space-y-4">
              <p className="text-sm text-navy-200">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
              <h1 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">Had an accident or got a repair quote?</h1>
              <p className="max-w-md text-navy-200">Find out in two minutes whether claiming or paying yourself costs less, with every number explained.</p>
              <Link href="/decision" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-navy-900 transition hover:bg-navy-50">
                Check a claim <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-3">
            {[
              { href: '/decision/extract', icon: FileSearch, title: 'Read my policy or estimate', body: 'Upload a PDF and check the extracted details' },
              { href: '/decision/consent', icon: Lock, title: 'Share with a workshop or insurer', body: 'Time-limited access you can revoke anytime' },
              { href: '/reports', icon: FileText, title: 'Vehicle passport', body: 'A verifiable history report for resale or renewal' },
            ].map((a, i) => (
              <motion.div key={a.href} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: EASE }}>
                <Link href={a.href} className="vs-surface group flex items-center gap-4 p-4 transition duration-300 hover:-translate-y-0.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-steel-50 text-steel-700"><a.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy-900">{a.title}</span>
                    <span className="block truncate text-sm text-navy-500">{a.body}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-navy-700" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Cars */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">Your cars</h2>
              <p className="text-sm text-navy-500">{vehicles.length} {vehicles.length === 1 ? 'car' : 'cars'}{vehicles.some((v) => v.is_demo) ? ' · sample cars are marked Demo' : ''}</p>
            </div>
            <Link href="/onboarding" className="vs-btn-secondary py-2.5"><Plus className="h-4 w-4" /> Add a car</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v, i) => {
              const ncbIdx = Math.max(0, (NCB_STEPS as readonly number[]).indexOf(v.ncb_percentage ?? 0));
              const days = daysUntil(v.policy_expiry);
              const commercial = v.usage_type && v.usage_type !== 'PERSONAL';
              return (
                <motion.article
                  key={v.id}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}
                  className="vs-surface group flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(17,26,49,0.3)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 transition group-hover:bg-navy-900 group-hover:text-white">
                      {commercial ? <Truck className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-navy-900">{v.make} {v.model}</h3>
                      <p className="text-xs text-navy-500">{v.registration_number} · {v.manufacture_year}{v.fuel_type ? ` · ${v.fuel_type}` : ''}</p>
                    </div>
                    {v.is_demo && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">Demo</span>}
                    {v.is_local_only && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy-600">This browser only</span>}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-navy-50/70 p-3">
                      <dt className="text-[11px] text-navy-500">IDV (cover)</dt>
                      <dd className="tabular font-semibold text-navy-900">{v.idv ? rupees(v.idv) : 'Not added'}</dd>
                    </div>
                    <div className="rounded-2xl bg-navy-50/70 p-3">
                      <dt className="text-[11px] text-navy-500">No-Claim Bonus</dt>
                      <dd className="font-semibold text-navy-900">{v.ncb_percentage !== undefined ? `${v.ncb_percentage}%` : 'Not added'}</dd>
                      <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
                        {NCB_STEPS.slice(1).map((_, k) => (
                          <motion.span key={k} className={`h-1 flex-1 rounded-full ${k < ncbIdx ? 'bg-gain' : 'bg-navy-200'}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 + k * 0.06 }} style={{ originX: 0 }} />
                        ))}
                      </div>
                    </div>
                  </dl>

                  {days !== null && (
                    <p className={`mt-3 flex items-center gap-1.5 text-xs ${days < 30 ? 'text-loss' : 'text-navy-500'}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {days < 0 ? `Policy expired ${Math.abs(days)} days ago` : `Policy renews in ${days} days`}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => go(v, `/decision?vehicle_id=${v.id}`)} className="rounded-xl bg-navy-900 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">Check a claim</button>
                    <button type="button" onClick={() => go(v, `/vehicles/${v.id}`)} className="rounded-xl border border-navy-100 py-2.5 text-sm font-semibold text-navy-800 transition hover:bg-navy-50">History</button>
                  </div>
                </motion.article>
              );
            })}
            <Link href="/onboarding" className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-navy-200 p-6 text-center transition hover:border-navy-400 hover:bg-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-600"><Plus className="h-5 w-5" /></span>
              <span className="font-semibold text-navy-900">Add your car</span>
              <span className="text-sm text-navy-500">Registration and policy details take about a minute</span>
            </Link>
          </div>
        </section>

        {/* Saved claim records */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-navy-900">Saved claim checks</h2>
            <p className="text-sm text-navy-500">Results you saved to your vehicles’ history. They are not sent to any insurer.</p>
          </div>
          {claimsError != null && <ApiErrorNotice error={claimsError} onRetry={loadClaims} />}
          {claims === null ? (
            <div className="space-y-2">{[0, 1].map((k) => <div key={k} className="vs-shimmer h-16 rounded-2xl" />)}</div>
          ) : claims.length === 0 && claimsError == null ? (
            <div className="vs-surface flex flex-col items-center gap-2 p-10 text-center">
              <ScrollText className="h-8 w-8 text-navy-300" />
              <p className="font-semibold text-navy-900">No saved checks yet</p>
              <p className="text-sm text-navy-500">Run a claim check and press “Save claim record” to keep it here.</p>
            </div>
          ) : (
            <ul className="vs-surface divide-y divide-navy-50 overflow-hidden">
              {claims.map((c, i) => {
                const anchored = c.ledger?.sync_status === 'COMMITTED';
                return (
                  <motion.li key={c.id} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/verification?claimId=${encodeURIComponent(c.id)}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-navy-50/60 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-navy-900">{vehicleName(c.vehicle_id)} <span className="text-navy-400">· {c.claim_number || c.id.slice(0, 8)}</span></p>
                        <p className="text-xs text-navy-500">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · Repair {rupees(c.estimated_repair_cost)}
                          {c.calculated_payout != null ? ` · Insurer might pay ${rupees(c.calculated_payout)}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${anchored ? 'bg-gain-soft text-gain' : 'bg-amber-50 text-amber-800'}`}>
                        {anchored ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {anchored ? 'Anchored on ledger' : c.ledger?.sync_status === 'FAILED' ? 'Anchoring failed' : 'Anchoring pending'}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
