'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, FileText, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { apiFetch } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';

interface Ledger {
  sync_status?: string;
  blockchain_tx_id?: string | null;
  network_mode?: string | null;
  canonical_hash?: string | null;
  current_hash?: string;
  last_error?: string | null;
  anchored_at?: string | null;
}

interface ClaimRow {
  id: string;
  claim_number?: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  calculated_payout?: number | null;
  status?: string;
  created_at?: string;
  ledger?: Ledger;
}

interface Dossier {
  claim: ClaimRow & { incident_description?: string | null };
  policy: { policy_number?: string; idv?: number; compulsory_deductible?: number; ncb_percentage?: number; has_zero_dep?: boolean };
  vehicle: { registration_number?: string; make?: string; model?: string; manufacture_year?: number };
  ledger: Ledger;
  documents: { id: string; file_name?: string; document_type?: string }[];
}

const date = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const words = (s?: string) => (s ? s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : 'Saved');

function LedgerPill({ status, mode }: { status?: string; mode?: string | null }) {
  if (status === 'COMMITTED' && mode === 'MOCK')
    return <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-600">Sample · no ledger</span>;
  const ok = status === 'COMMITTED';
  const failed = status === 'FAILED';
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${ok ? 'bg-gain-soft text-gain' : failed ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
      {ok ? <ShieldCheck className="h-3.5 w-3.5" /> : failed ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {ok ? 'Anchored' : failed ? 'Anchoring failed' : 'Not anchored yet'}
    </span>
  );
}

/** Insurers and surveyors: records owners chose to share, with an integrity check. Read-only by design. */
export default function ReviewPage() {
  const [rows, setRows] = useState<ClaimRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [dossierError, setDossierError] = useState<unknown>(null);

  const fetchRows = useCallback(
    () =>
      apiFetch<ClaimRow[]>('/api/v1/claims')
        .then((r) => {
          setError(null);
          setRows(r);
        })
        .catch((e) => {
          setError(e);
          setRows([]);
        }),
    []
  );
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  const load = () => {
    setRows(null);
    fetchRows();
  };

  const open = (id: string) => {
    setOpenId(id);
    setDossier(null);
    setDossierError(null);
    apiFetch<Dossier>(`/api/v1/claims/${encodeURIComponent(id)}`).then(setDossier).catch(setDossierError);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter((r) => !q || [r.claim_number, r.id, r.vehicle_id].some((x) => x?.toLowerCase().includes(q)));
  }, [rows, query]);

  const anchored = (rows || []).filter((r) => r.ledger?.sync_status === 'COMMITTED' && r.ledger?.network_mode !== 'MOCK').length;

  return (
    <OrgShell
      title="Shared records"
      subtitle="Claim records that vehicle owners shared with your organisation, or on vehicles your organisation insures. ClearClaim does not decide claims: figures are rule-based estimates for your own review."
      actions={
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      }
    >
      {error != null && <ApiErrorNotice error={error} onRetry={load} className="mb-4" />}

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Records', value: rows?.length ?? '...' },
          { label: 'Anchored on ledger', value: rows ? anchored : '...' },
          { label: 'Not anchored', value: rows ? rows.length - anchored : '...' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-4">
            <p className="text-xs font-medium text-ink-500">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink-950">{s.value}</p>
          </div>
        ))}
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5">
        <Search className="h-4 w-4 text-ink-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by record number" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400" />
      </label>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {rows === null ? (
          <div className="vs-shimmer h-40" />
        ) : list.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-ink-900">{rows.length ? 'No records match your search.' : 'Nothing shared with you yet.'}</p>
            {!rows.length && <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">Records appear here when a vehicle owner grants your organisation access, or when the vehicle is insured by your organisation.</p>}
          </div>
        ) : (
          <ul className="divide-y divide-ink-50">
            {list.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => open(r.id)} className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-ink-50/50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{r.claim_number || r.id.slice(0, 8)}</p>
                    <p className="text-xs text-ink-500">
                      {date(r.created_at)} · quote {rupees(r.estimated_repair_cost)}
                      {r.calculated_payout != null ? ` · estimated insurer share ${rupees(r.calculated_payout)}` : ''}
                    </p>
                  </div>
                  <LedgerPill status={r.ledger?.sync_status} mode={r.ledger?.network_mode} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {openId && (
          <>
            <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenId(null)} className="fixed inset-0 z-50 bg-ink-950/40" />
            <motion.aside
              key="panel"
              role="dialog"
              aria-label="Record details"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
                <p className="font-semibold text-ink-950">Record details</p>
                <button type="button" onClick={() => setOpenId(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-ink-50"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-5 p-5">
                {dossierError != null ? <ApiErrorNotice error={dossierError} onRetry={() => open(openId)} /> : !dossier ? <div className="vs-shimmer h-64 rounded-2xl" /> : <DossierBody d={dossier} />}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </OrgShell>
  );
}

function DossierBody({ d }: { d: Dossier }) {
  const { claim, policy, vehicle, ledger, documents } = d;
  const anchoredHash = ledger.canonical_hash;
  const unchanged = !!anchoredHash && anchoredHash === ledger.current_hash;
  const facts: [string, string | undefined][] = [
    ['Vehicle', vehicle.registration_number ? `${vehicle.registration_number} · ${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() : undefined],
    ['Manufactured', vehicle.manufacture_year ? String(vehicle.manufacture_year) : undefined],
    ['Policy', policy.policy_number],
    ['IDV', policy.idv != null ? rupees(policy.idv) : undefined],
    ['Deductible', policy.compulsory_deductible != null ? rupees(policy.compulsory_deductible) : undefined],
    ['No-Claim Bonus', policy.ncb_percentage != null ? `${policy.ncb_percentage}%` : undefined],
    ['Repair quote', rupees(claim.estimated_repair_cost)],
    ['Estimated insurer share', claim.calculated_payout != null ? rupees(claim.calculated_payout) : undefined],
    ['Record status', words(claim.status)],
    ['Saved on', date(claim.created_at)],
  ];

  return (
    <>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{claim.claim_number || claim.id}</p>
        {claim.incident_description && <p className="mt-1 text-sm text-ink-700">{claim.incident_description}</p>}
      </div>

      <dl className="divide-y divide-ink-50 rounded-2xl border border-ink-100">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-ink-500">{k}</dt>
            <dd className={`text-right font-medium ${v ? 'text-ink-900' : 'text-ink-300'}`}>{v || 'Not provided'}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-ink-100 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink-900">Integrity check</p>
          <LedgerPill status={ledger.sync_status} mode={ledger.network_mode} />
        </div>
        {anchoredHash ? (
          <p className={`mt-3 flex items-start gap-2 text-sm ${unchanged ? 'text-gain' : 'text-red-700'}`}>
            {unchanged ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {unchanged ? 'The record matches the fingerprint taken when it was saved.' : 'The record has changed since its fingerprint was taken. Ask the owner why before relying on it.'}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-500">No fingerprint was anchored for this record, so changes since saving cannot be ruled out.</p>
        )}
        {ledger.network_mode === 'MOCK' && <p className="mt-2 text-xs text-ink-500">Sample record: its fingerprint is kept by ClearClaim only, not on a ledger.</p>}
        {ledger.blockchain_tx_id && <p className="mt-2 break-all font-mono text-[11px] text-ink-400">Transaction {ledger.blockchain_tx_id}</p>}
        <Link href={`/verification?claimId=${encodeURIComponent(claim.id)}`} className="mt-3 inline-flex text-sm font-medium text-forest-700 hover:underline">Open full verification</Link>
      </section>

      <section className="rounded-2xl border border-ink-100 p-4">
        <p className="font-medium text-ink-900">Documents</p>
        {documents.length ? (
          <ul className="mt-2 space-y-1.5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 text-sm text-ink-700"><FileText className="h-4 w-4 text-ink-400" />{doc.file_name || words(doc.document_type) || 'Document'}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-500">No documents attached.</p>
        )}
      </section>

      <p className="text-xs leading-relaxed text-ink-400">Estimates follow standard motor-insurance depreciation and deductible rules. Your own survey and policy terms decide the settlement.</p>
    </>
  );
}
