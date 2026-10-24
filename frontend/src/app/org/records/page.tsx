'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';

interface Row {
  id: string;
  claim_number?: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  calculated_payout?: number | null;
  created_at?: string;
  ledger?: { sync_status: string; network_mode?: string | null };
}

export default function OrgRecordsPage() {
  const { vehicles } = useVehicle();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    apiFetch<Row[]>('/api/v1/claims')
      .then(setRows)
      .catch((e) => {
        setError(e);
        setRows([]);
      });
  }, []);
  const name = (id?: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.registration_number} · ${v.make} ${v.model}` : 'Vehicle';
  };

  return (
    <OrgShell title="Saved records" subtitle="Claim decisions you saved. They live in ClearClaim only and are never sent to an insurer.">
      {error != null && <ApiErrorNotice error={error} />}
      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
        {rows === null ? (
          <div className="vs-shimmer h-40" />
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-500">No saved records yet.</p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {rows.map((r) => {
              const anchored = r.ledger?.sync_status === 'COMMITTED' && r.ledger?.network_mode !== 'MOCK';
              return (
                <li key={r.id}>
                  <Link href={`/verification?claimId=${encodeURIComponent(r.id)}`} className="flex flex-col gap-1 px-4 py-4 hover:bg-navy-50/50 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-navy-900">{name(r.vehicle_id)}</p>
                      <p className="text-xs text-navy-500">
                        {r.claim_number || r.id.slice(0, 8)} · {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · quote {rupees(r.estimated_repair_cost)}
                        {r.calculated_payout != null ? ` · insurer ~${rupees(r.calculated_payout)}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${anchored ? 'bg-gain-soft text-gain' : 'bg-amber-50 text-amber-800'}`}>
                      {anchored ? <ShieldCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {anchored ? 'Anchored' : r.ledger?.network_mode === 'MOCK' ? 'Sample · no ledger' : 'Anchoring pending'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </OrgShell>
  );
}
