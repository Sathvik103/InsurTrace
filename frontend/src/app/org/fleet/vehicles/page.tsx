'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Plus } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';
import { rupees } from '@/lib/claimCheck';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';
import { FLEET_OVERRIDES_KEY, loadLocal, Overrides, toFleetVehicle } from '@/lib/fleet';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { NumberPlate } from '@/components/vehicle/NumberPlate';

type Key = 'premium' | 'deductible' | 'idv';

function MoneyInput({ value, onChange, label, warn }: { value?: number; onChange: (v: string) => void; label: string; warn?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-navy-400">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy-400">₹</span>
        <input
          value={value ? new Intl.NumberFormat('en-IN').format(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          placeholder="Add"
          className={`vs-input tabular py-2 pl-7 text-sm ${warn ? 'border-amber-300 bg-amber-50/60' : ''}`}
        />
      </span>
    </label>
  );
}

export default function FleetVehiclesPage() {
  const reduce = useReducedMotion();
  const { vehicles } = useVehicle();
  const [overrides, setOverrides] = useState<Overrides>(() => loadLocal<Overrides>(FLEET_OVERRIDES_KEY, {}));
  useEffect(() => {
    try {
      localStorage.setItem(FLEET_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);
  const fleet = useMemo(() => vehicles.map((v) => ({ v, f: toFleetVehicle(v, overrides) })), [vehicles, overrides]);
  const set = (id: string, key: Key, value: string) =>
    setOverrides((o) => ({ ...o, [id]: { ...o[id], [key]: Number(value.replace(/[^\d]/g, '').slice(0, 9)) || undefined } }));
  const ready = fleet.filter(({ f }) => f.idv > 0 && f.premium > 0).length;

  return (
    <OrgShell
      title="Vehicles"
      subtitle="Triage needs each vehicle’s IDV and renewal premium. Values you type here are kept on this device and used only for triage."
      actions={<Link href="/onboarding" className="vs-btn-primary py-2.5"><Plus className="h-4 w-4" /> Add vehicle</Link>}
    >
      {fleet.length > 0 && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-4">
          <div className="h-2 flex-1 overflow-hidden rounded-md bg-navy-50">
            <motion.div className="h-full rounded-md bg-signal-600" initial={reduce ? false : { width: 0 }} animate={{ width: `${(ready / fleet.length) * 100}%` }} transition={{ duration: 0.8 }} />
          </div>
          <p className="shrink-0 text-sm text-navy-600"><span className="font-semibold text-navy-950">{ready} of {fleet.length}</span> ready for triage</p>
        </div>
      )}

      {fleet.length === 0 && <p className="rounded-2xl border border-navy-100 bg-white p-10 text-center text-sm text-navy-500">No vehicles yet. Add your first vehicle to start triaging claims.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {fleet.map(({ v, f }, i) => {
          const complete = f.idv > 0 && f.premium > 0;
          return (
            <motion.article
              key={v.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              className="overflow-hidden rounded-2xl border border-navy-100 bg-white"
            >
              <div className="flex items-center gap-4 bg-[#f6f5f0] p-5">
                <CarSilhouette vehicle={v} className="h-14 w-32 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/vehicles/${encodeURIComponent(v.id)}`} className="block truncate font-display text-lg font-semibold tracking-tight text-navy-950 hover:underline">{f.label}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-500">
                    <NumberPlate value={f.registration} commercial={!!v.usage_type && v.usage_type !== 'PERSONAL'} />
                    <span>{BODY_LABEL[bodyTypeOf(v)]} · {f.ageYears} yr · {f.ncb}% NCB{v.is_demo ? ' · Demo' : ''}</span>
                  </div>
                </div>
                <span title={complete ? 'Ready for triage' : 'Missing IDV or premium'}>
                  {complete ? <CheckCircle2 className="h-5 w-5 text-gain" /> : <CircleAlert className="h-5 w-5 text-amber-500" />}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <MoneyInput label="IDV" value={f.idv} onChange={(x) => set(v.id, 'idv', x)} warn={!f.idv} />
                <MoneyInput label="Renewal premium" value={f.premium} onChange={(x) => set(v.id, 'premium', x)} warn={!f.premium} />
                <MoneyInput label="Deductible" value={overrides[v.id]?.deductible} onChange={(x) => set(v.id, 'deductible', x)} />
                <p className="col-span-3 text-xs text-navy-400">
                  Deductible defaults to ₹1,000 when left empty.{f.downtimePerDay ? ` Downtime ${rupees(f.downtimePerDay)}/day.` : ''}
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </OrgShell>
  );
}
