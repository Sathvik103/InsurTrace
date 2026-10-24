'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Lock } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';

export default function SharedWithUsPage() {
  const { vehicles } = useVehicle();
  return (
    <OrgShell title="Shared with us" subtitle="Vehicles whose owners gave your workshop time-limited access to their history. Access ends automatically when it expires or the owner revokes it.">
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-navy-100 bg-white p-12 text-center">
          <Lock className="h-8 w-8 text-navy-300" />
          <p className="font-semibold text-navy-900">Nothing shared yet</p>
          <p className="max-w-md text-sm text-navy-500">Ask your customer to open ClearClaim → Data & privacy and choose your workshop. Their car appears here instantly.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link href={`/vehicles/${encodeURIComponent(v.id)}`} className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 transition hover:border-navy-300">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><Car className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-navy-900">{v.make} {v.model}</span>
                  <span className="block font-mono text-xs text-navy-500">{v.registration_number}{v.is_demo ? ' · Demo' : ''}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OrgShell>
  );
}
