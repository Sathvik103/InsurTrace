'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, Plus } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';
import { rupees } from '@/lib/claimCheck';
import { FLEET_OVERRIDES_KEY, loadLocal, Overrides, toFleetVehicle } from '@/lib/fleet';

export default function FleetVehiclesPage() {
  const { vehicles } = useVehicle();
  const [overrides, setOverrides] = useState<Overrides>(() => loadLocal<Overrides>(FLEET_OVERRIDES_KEY, {}));
  useEffect(() => {
    try {
      localStorage.setItem(FLEET_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);
  const fleet = useMemo(() => vehicles.map((v) => ({ v, f: toFleetVehicle(v, overrides) })), [vehicles, overrides]);
  const set = (id: string, key: 'premium' | 'deductible', value: string) =>
    setOverrides((o) => ({ ...o, [id]: { ...o[id], [key]: Number(value.replace(/[^\d]/g, '')) || undefined } }));

  return (
    <OrgShell
      title="Vehicles"
      subtitle="Every vehicle needs an IDV and a renewal premium for reliable decisions. Premium and deductible edits here are saved on this device."
      actions={<Link href="/onboarding" className="vs-btn-primary py-2.5"><Plus className="h-4 w-4" /> Add vehicle</Link>}
    >
      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
        <div className="hidden grid-cols-[1.6fr_70px_120px_70px_140px_120px_110px_40px] gap-3 border-b border-navy-100 bg-navy-50/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-navy-500 lg:grid">
          <span>Vehicle</span><span>Age</span><span className="text-right">IDV</span><span>NCB</span><span>Renewal premium</span><span>Deductible</span><span className="text-right">Downtime/day</span><span />
        </div>
        {fleet.length === 0 && <p className="p-10 text-center text-sm text-navy-500">No vehicles yet. Add your first vehicle to start triaging claims.</p>}
        <ul className="divide-y divide-navy-50">
          {fleet.map(({ v, f }) => {
            const complete = f.idv > 0 && f.premium > 0;
            return (
              <li key={v.id} className="grid grid-cols-2 gap-3 px-4 py-4 lg:grid-cols-[1.6fr_70px_120px_70px_140px_120px_110px_40px] lg:items-center">
                <Link href={`/vehicles/${encodeURIComponent(v.id)}`} className="col-span-2 min-w-0 lg:col-span-1">
                  <p className="truncate font-medium text-navy-900 hover:underline">{f.label}</p>
                  <p className="font-mono text-xs text-navy-500">{f.registration}{v.is_demo ? ' · Demo' : ''}</p>
                </Link>
                <p className="text-sm text-navy-700"><span className="text-navy-400 lg:hidden">Age </span>{f.ageYears}y</p>
                <p className="tabular text-sm text-navy-700 lg:text-right"><span className="text-navy-400 lg:hidden">IDV </span>{f.idv ? rupees(f.idv) : '—'}</p>
                <p className="text-sm text-navy-700"><span className="text-navy-400 lg:hidden">NCB </span>{f.ncb}%</p>
                <input value={f.premium ? String(f.premium) : ''} onChange={(e) => set(v.id, 'premium', e.target.value)} inputMode="numeric" placeholder="₹ premium" aria-label={`Renewal premium for ${f.registration}`} className={`vs-input tabular py-2 text-sm ${f.premium ? '' : 'border-amber-300 bg-amber-50/50'}`} />
                <input value={String(f.deductible)} onChange={(e) => set(v.id, 'deductible', e.target.value)} inputMode="numeric" aria-label={`Deductible for ${f.registration}`} className="vs-input tabular py-2 text-sm" />
                <p className="tabular text-sm text-navy-700 lg:text-right"><span className="text-navy-400 lg:hidden">Downtime </span>{f.downtimePerDay ? rupees(f.downtimePerDay) : '—'}</p>
                <span className="justify-self-end" title={complete ? 'Ready for triage' : 'Missing IDV or premium'}>
                  {complete ? <CheckCircle2 className="h-5 w-5 text-gain" /> : <CircleAlert className="h-5 w-5 text-amber-500" />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </OrgShell>
  );
}
