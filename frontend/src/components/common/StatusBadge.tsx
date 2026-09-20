'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { truncateHash } from '@/lib/formatters';

export type StatusType =
  | 'APPROVED'
  | 'SETTLED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SURVEY_PENDING'
  | 'REJECTED'
  | 'TAMPERED'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'DRAFT';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  SETTLED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  VERIFIED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: ShieldCheck,
  },
  SUBMITTED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: Clock,
  },
  UNDER_REVIEW: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    icon: Clock,
  },
  SURVEY_PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20',
    icon: AlertCircle,
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20',
    icon: XCircle,
  },
  TAMPERED: {
    bg: 'bg-red-500/15',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/30',
    icon: ShieldAlert,
  },
  ACTIVE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  DRAFT: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-700 dark:text-zinc-400',
    border: 'border-zinc-500/20',
    icon: Clock,
  },
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || 'DRAFT').toUpperCase();
  const config = STATUS_STYLES[normalized] || STATUS_STYLES.DRAFT;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{normalized.replace('_', ' ')}</span>
    </span>
  );
}

export function VerificationBadge({
  isVerified,
  fabricTxId,
}: {
  isVerified: boolean;
  fabricTxId?: string | null;
}) {
  if (isVerified) {
    return (
      <span
        title={fabricTxId ? `Fabric Tx ID: ${fabricTxId}` : 'Ledger State Matches Canonical Hash'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-help"
      >
        <ShieldCheck className="w-3 h-3 shrink-0" />
        <span>SEALED ON-CHAIN {fabricTxId ? `(${truncateHash(fabricTxId, 4, 4)})` : ''}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
      <Clock className="w-3 h-3 shrink-0" />
      <span>PENDING LEDGER COMMIT</span>
    </span>
  );
}
