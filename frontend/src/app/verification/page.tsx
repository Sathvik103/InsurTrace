'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, Clock, FlaskConical, HelpCircle, RefreshCw, Search, ShieldAlert, ShieldCheck, ShieldQuestion, X } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { apiFetch, describeApiError } from '@/lib/api';
import { useSystemStatus } from '@/lib/useSystemStatus';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { useAssistant } from '@/context/AssistantContext';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { rupees } from '@/lib/claimCheck';

const EASE = [0.16, 1, 0.3, 1] as const;

interface VerifyResponse {
  status: string;
  network_mode?: string;
  message?: string;
  transaction_id?: string | null;
  hash?: string;
  database_hash?: string;
  ledger_hash?: string | null;
  original_cost?: number;
  error?: string;
}

interface ClaimOption {
  id: string;
  claim_number?: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  created_at?: string;
  ledger?: { sync_status: string };
}

export default function VerificationPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="vs-shimmer mx-auto h-96 max-w-3xl rounded-[28px]" />}>
        <VerifyContent />
      </Suspense>
    </AppShell>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { role } = useAuth();
  const { vehicles } = useVehicle();
  const { open } = useAssistant();
  const { status: system } = useSystemStatus();

  const [claims, setClaims] = useState<ClaimOption[]>([]);
  const [claimId, setClaimId] = useState(params.get('claimId') || '');
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [originalCost, setOriginalCost] = useState<number | null>(null);

  const verify = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([
        apiFetch<VerifyResponse>(`/api/v1/admin/verify-claim/${encodeURIComponent(id)}`, { timeoutMs: 60000 }),
        new Promise((r) => setTimeout(r, reduce ? 0 : 700)),
      ]);
      setResult(data);
      if (data.original_cost && data.status === 'VERIFIED') setOriginalCost(data.original_cost);
    } catch (e) {
      setResult(null);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiFetch<ClaimOption[]>('/api/v1/claims')
      .then((rows) => {
        setClaims(rows);
        const initial = params.get('claimId') || rows.find((r) => r.ledger?.sync_status === 'COMMITTED')?.id || rows[0]?.id;
        if (initial) {
          setClaimId(initial);
          verify(initial);
        }
      })
      .catch(setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tamperDemoAllowed = role?.toLowerCase() === 'admin' && system?.environment !== 'production';

  const simulate = async (kind: 'tamper' | 'restore') => {
    setActing(true);
    try {
      const path =
        kind === 'tamper'
          ? `/api/v1/admin/tamper-claim/${encodeURIComponent(claimId)}`
          : `/api/v1/admin/restore-claim/${encodeURIComponent(claimId)}?original_cost=${originalCost ?? 0}`;
      await apiFetch(path, { method: 'POST' });
      await verify(claimId);
    } catch (e) {
      toast.error('Simulation unavailable', { description: describeApiError(e).message });
    } finally {
      setActing(false);
    }
  };

  const label = (c: ClaimOption) => {
    const v = vehicles.find((x) => x.id === c.vehicle_id);
    return `${v ? `${v.make} ${v.model}` : 'Vehicle'} · ${c.claim_number || c.id.slice(0, 8)} · ${rupees(c.estimated_repair_cost)}`;
  };

  const fabric = system?.components?.hyperledger_fabric as { status?: string; mode?: string } | undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <span className="vs-chip"><ShieldCheck className="h-3.5 w-3.5 text-steel-600" /> Verify a record</span>
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Has this record been changed?</h1>
        <p className="text-base text-navy-600">
          When you save a claim check, VeriSure anchors its fingerprint on a ledger. Checking it again shows whether the record is still exactly as it was saved.
        </p>
      </header>

      <section className="vs-surface space-y-4 p-6">
        <label htmlFor="claim" className="text-sm font-medium text-navy-800">Which record?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {claims.length > 0 ? (
            <select id="claim" value={claimId} onChange={(e) => setClaimId(e.target.value)} className="vs-input flex-1 py-3 text-sm">
              {claims.map((c) => (
                <option key={c.id} value={c.id}>{label(c)}{c.ledger?.sync_status === 'COMMITTED' ? '' : ' (not anchored yet)'}</option>
              ))}
            </select>
          ) : (
            <input id="claim" value={claimId} onChange={(e) => setClaimId(e.target.value.trim())} placeholder="Record ID" className="vs-input flex-1 py-3 text-sm" />
          )}
          <button type="button" onClick={() => verify(claimId)} disabled={!claimId || loading} className="vs-btn-primary">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Check now
          </button>
        </div>
        <p className="flex items-center gap-2 text-xs text-navy-500">
          <span className={`h-1.5 w-1.5 rounded-full ${fabric?.status === 'CONNECTED' ? 'bg-gain' : 'bg-amber-500'}`} />
          Ledger {fabric?.status === 'CONNECTED' ? 'connected' : fabric ? 'not connected right now' : 'status loading'}
          {fabric?.mode ? ` · ${fabric.mode}` : ''} ·{' '}
          <Link href="/settings?tab=status" className="font-medium text-steel-700 hover:underline">details</Link>
        </p>
      </section>

      {error != null && <ApiErrorNotice error={error} onRetry={() => verify(claimId)} />}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="vs-surface flex flex-col items-center gap-4 p-12 text-center" role="status">
            <motion.div animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-navy-100 border-t-navy-900" />
            <p className="font-medium text-navy-800">Recomputing the fingerprint and asking the ledger…</p>
          </motion.div>
        ) : result ? (
          <motion.div key={`${claimId}-${result.status}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="space-y-5">
            <Verdict result={result} />
            {(result.database_hash || result.hash) && <HashCompare current={result.database_hash || result.hash!} anchored={result.ledger_hash ?? null} />}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="vs-surface p-6">
          <p className="flex items-center gap-2 font-semibold text-navy-900"><CheckCircle2 className="h-5 w-5 text-gain" /> What this proves</p>
          <p className="mt-2 text-sm leading-relaxed text-navy-600">The saved record (repair cost, estimate, decision) is byte-for-byte the same as when its fingerprint was anchored.</p>
        </div>
        <div className="vs-surface p-6">
          <p className="flex items-center gap-2 font-semibold text-navy-900"><X className="h-5 w-5 text-loss" /> What it doesn’t prove</p>
          <p className="mt-2 text-sm leading-relaxed text-navy-600">That the accident or damage really happened, or what an insurer will pay. That is for your insurer and surveyor.</p>
        </div>
      </section>
      <button type="button" onClick={() => open('What does blockchain verification mean?')} className="inline-flex items-center gap-2 text-sm font-medium text-steel-700 hover:underline">
        <HelpCircle className="h-4 w-4" /> How does this work?
      </button>

      {tamperDemoAllowed && claimId && (
        <section className="rounded-[28px] border border-dashed border-navy-200 p-6">
          <p className="flex items-center gap-2 font-semibold text-navy-900"><FlaskConical className="h-5 w-5 text-steel-600" /> Tamper demonstration (development only)</p>
          <p className="mt-1 text-sm text-navy-600">Changes the repair cost directly in the database, without updating the ledger, to show that verification catches it. Hidden in production.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => simulate('tamper')} disabled={acting} className="vs-btn-secondary py-2.5 text-loss">Alter the record</button>
            <button type="button" onClick={() => simulate('restore')} disabled={acting || originalCost === null} className="vs-btn-secondary py-2.5">Restore original</button>
          </div>
        </section>
      )}
    </div>
  );
}

function Verdict({ result }: { result: VerifyResponse }) {
  const reduce = useReducedMotion();
  const s = result.status;
  const conf =
    s === 'VERIFIED' || s === 'MOCK_VERIFIED'
      ? { Icon: ShieldCheck, tone: 'from-gain-soft to-white ring-gain/25', color: 'text-gain', title: s === 'MOCK_VERIFIED' ? 'Unchanged (development mock, no real ledger)' : 'Unchanged since it was saved', body: 'The record’s fingerprint matches the one anchored on Hyperledger Fabric.' }
      : s === 'INTEGRITY_VERIFICATION_FAILED'
        ? { Icon: ShieldAlert, tone: 'from-loss-soft to-white ring-loss/25', color: 'text-loss', title: 'This record was changed after it was saved', body: 'Its current fingerprint does not match the anchored one. Treat its figures with caution.' }
        : s === 'PENDING' || s === 'FAILED' || s === 'NO_LEDGER_RECORD' || s === 'RETRY'
          ? { Icon: Clock, tone: 'from-amber-50 to-white ring-amber-500/25', color: 'text-amber-700', title: 'Saved, but not anchored yet', body: 'This record has no fingerprint on the ledger yet, so it can’t be verified. Anchor it from the claim check when the ledger is connected.' }
          : { Icon: ShieldQuestion, tone: 'from-navy-50 to-white ring-navy-200', color: 'text-navy-600', title: 'Can’t check right now', body: result.message || 'The ledger could not be reached, so integrity can’t be confirmed at the moment. This is not a sign of tampering.' };
  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br p-7 ring-1 ${conf.tone}`}>
      <div className="flex items-start gap-4">
        <motion.span initial={reduce ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 }} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${conf.color}`}>
          <conf.Icon className="h-7 w-7" />
        </motion.span>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-navy-900">{conf.title}</h2>
          <p className="text-navy-600">{conf.body}</p>
          {result.transaction_id && <p className="font-mono text-xs text-navy-500">Ledger transaction {result.transaction_id.slice(0, 12)}…{result.transaction_id.slice(-8)}</p>}
        </div>
      </div>
    </div>
  );
}

/** Two fingerprints side by side; characters that differ are highlighted. */
function HashCompare({ current, anchored }: { current: string; anchored: string | null }) {
  const reduce = useReducedMotion();
  return (
    <div className="vs-surface space-y-4 p-6">
      <p className="text-sm font-semibold text-navy-900">Fingerprints (SHA-256)</p>
      {[
        { label: 'Record as it is now', value: current },
        { label: 'Anchored on the ledger', value: anchored },
      ].map((row, r) => (
        <div key={row.label}>
          <p className="text-xs text-navy-500">{row.label}</p>
          {row.value ? (
            <p className="mt-1 break-all rounded-2xl bg-navy-50 p-3 font-mono text-[12px] leading-relaxed">
              {row.value.split('').map((ch, i) => {
                const differs = anchored && current[i] !== anchored[i];
                return (
                  <motion.span
                    key={i}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: r * 0.25 + i * 0.006 }}
                    className={differs ? 'rounded-sm bg-loss/15 text-loss' : 'text-navy-700'}
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </p>
          ) : (
            <p className="mt-1 rounded-2xl bg-navy-50 p-3 text-sm text-navy-500">Not available: the ledger wasn’t queried.</p>
          )}
        </div>
      ))}
    </div>
  );
}
