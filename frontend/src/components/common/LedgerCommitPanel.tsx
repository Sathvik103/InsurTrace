'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Clock, Lock, RefreshCw, Save, ShieldAlert, ShieldCheck } from 'lucide-react';
import { apiFetch, describeApiError } from '@/lib/api';
import { truncateHash } from '@/lib/formatters';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { FadeIn } from '@/components/motion/MotionPrimitives';

export type LedgerSyncStatus = 'COMMITTED' | 'PENDING' | 'FAILED' | 'RETRY' | 'NOT_COMMITTED';

export interface LedgerView {
  sync_status: LedgerSyncStatus;
  blockchain_tx_id: string | null;
  network_mode: 'REAL_FABRIC' | 'MOCK' | 'UNAVAILABLE' | null;
  canonical_hash?: string;
  last_error?: string | null;
}

export interface SavedClaim {
  id: string;
  claim_number: string;
  vehicle_id: string;
  ledger: LedgerView;
}

interface LedgerCommitPanelProps {
  /** Builds the POST /api/v1/claims body from the analysis on screen. */
  buildPayload: () => Record<string, unknown>;
  disabled?: boolean;
  /** Called whenever the saved claim or its ledger status changes. */
  onSaved?: (claim: SavedClaim) => void;
}

/**
 * Saves the reviewed analysis as a claim record, then shows the separate,
 * retryable outcome of anchoring its fingerprint on the Fabric ledger.
 * A ledger outage never hides the fact that the record itself was saved.
 */
export function LedgerCommitPanel({ buildPayload, disabled, onSaved }: LedgerCommitPanelProps) {
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [claim, setClaim] = useState<SavedClaim | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await apiFetch<SavedClaim>('/api/v1/claims', { method: 'POST', body: buildPayload(), timeoutMs: 60000 });
      setClaim(saved);
      onSaved?.(saved);
      if (saved.ledger.sync_status === 'COMMITTED') toast.success('Claim record saved and anchored on the ledger.');
      else toast.message('Claim record saved.', { description: 'Ledger anchoring is pending.' });
    } catch (e) {
      setError(e);
      toast.error(describeApiError(e).title);
    } finally {
      setSaving(false);
    }
  };

  const retry = async () => {
    if (!claim) return;
    setRetrying(true);
    try {
      const res = await apiFetch<{ ledger: LedgerView }>(`/api/v1/claims/${claim.id}/ledger/retry`, { method: 'POST', timeoutMs: 60000 });
      const updated = { ...claim, ledger: res.ledger };
      setClaim(updated);
      onSaved?.(updated);
      if (res.ledger.sync_status === 'COMMITTED') toast.success('Fingerprint anchored on the ledger.');
      else toast.message('The ledger is still not reachable.', { description: 'Your record remains saved. Try again later.' });
    } catch (e) {
      toast.error(describeApiError(e).title, { description: describeApiError(e).message });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-navy-100 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-950 text-signal">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold text-navy-950">Save this claim record</h4>
            <p className="mt-0.5 text-sm leading-relaxed text-navy-500">
              Saves the repair estimate and this calculation to your vehicle history in ClearClaim, then anchors a SHA-256
              fingerprint on the Hyperledger Fabric ledger so later changes can be detected. It is <strong>not</strong> sent to your insurer.
            </p>
          </div>
        </div>
        {!claim && (
          <button
            type="button"
            onClick={save}
            disabled={saving || disabled}
            className="vs-btn-primary shrink-0 py-2.5"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{saving ? 'Saving…' : 'Save claim record'}</span>
          </button>
        )}
      </div>

      {error != null && !claim && <ApiErrorNotice error={error} onRetry={save} retrying={saving} />}

      {claim && (
        <FadeIn className="mt-2 space-y-3 rounded-2xl bg-[#f6f5f0] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-950">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Claim record {claim.claim_number} saved
          </div>
          <LedgerStatusRow ledger={claim.ledger} onRetry={retry} retrying={retrying} />
          <Link
            href={`/verification?claimId=${claim.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-950 underline-offset-2 hover:underline"
          >
            View integrity details <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </FadeIn>
      )}
    </div>
  );
}

export function LedgerStatusRow({ ledger, onRetry, retrying }: { ledger: LedgerView; onRetry?: () => void; retrying?: boolean }) {
  const { sync_status: status, network_mode: mode } = ledger;

  if (status === 'COMMITTED') {
    return (
      <div className="space-y-2 text-xs">
        <p className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
          <ShieldCheck className="h-4 w-4 text-signal-700" aria-hidden="true" />
          {mode === 'MOCK' ? 'Development mock: not recorded on a ledger' : 'Fingerprint anchored on Hyperledger Fabric'}
        </p>
        <dl className="grid grid-cols-1 gap-1 rounded-lg bg-zinc-50 p-2.5 font-mono text-[11px] text-zinc-600 sm:grid-cols-2 dark:bg-zinc-950 dark:text-zinc-400">
          <div><dt className="inline text-zinc-400">Transaction: </dt><dd className="inline">{truncateHash(ledger.blockchain_tx_id || '', 8, 8)}</dd></div>
          {ledger.canonical_hash && (
            <div className="truncate"><dt className="inline text-zinc-400">SHA-256: </dt><dd className="inline">{truncateHash(ledger.canonical_hash, 8, 8)}</dd></div>
          )}
        </dl>
        <p className="leading-relaxed text-zinc-500 dark:text-zinc-400">
          This proves the saved record has not changed since it was anchored. It does not prove that the reported damage occurred.
        </p>
      </div>
    );
  }

  const failed = status === 'FAILED';
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-start dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      {failed ? <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{failed ? 'The ledger did not accept the fingerprint' : 'Ledger not connected: anchoring pending'}</p>
        <p className="leading-relaxed opacity-90">
          {failed
            ? 'Your record is saved. The ledger returned an error, so integrity is not yet anchored.'
            : 'Your record is saved. The integrity ledger is not reachable from this deployment right now, so its fingerprint is queued.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying ? 'Retrying…' : 'Retry anchoring'}
        </button>
      )}
    </div>
  );
}
