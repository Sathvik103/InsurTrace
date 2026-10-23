'use client';

import React from 'react';
import Link from 'next/link';
import { useSystemStatus } from '@/lib/useSystemStatus';

/**
 * Live status of the integrity ledger as reported by the backend. Never
 * hardcoded: if the status cannot be fetched, it says so.
 */
export function LedgerStatusBadge({ className = '' }: { className?: string }) {
  const { status, error, loading } = useSystemStatus();
  const fabric = status?.components?.hyperledger_fabric?.status;

  let label = 'Checking system status…';
  let dot = 'bg-zinc-400';
  if (!loading && (error || !status)) {
    label = 'System status unavailable';
    dot = 'bg-zinc-400';
  } else if (fabric === 'CONNECTED') {
    label = 'Integrity ledger connected';
    dot = 'bg-emerald-500 animate-pulse';
  } else if (fabric === 'DEGRADED') {
    label = 'Integrity ledger degraded';
    dot = 'bg-amber-500';
  } else if (fabric) {
    label = 'Integrity ledger offline';
    dot = 'bg-amber-500';
  }

  return (
    <Link href="/settings?tab=status" className={`inline-flex items-center gap-1.5 hover:underline ${className}`} aria-live="polite">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
