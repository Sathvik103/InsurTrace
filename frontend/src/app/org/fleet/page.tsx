'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Download, FileSpreadsheet, Layers, Plus, Save, Trash2, Upload } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';
import { Incident, IncidentMaterial, parseIncidentsCsv, planFleet, planToCsv } from '@/lib/triage';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { RULE_VERSION } from '@/lib/engine';
import { FLEET_INCIDENTS_KEY as STORE, FLEET_OVERRIDES_KEY as OVERRIDES, loadLocal, Overrides, toFleetVehicle } from '@/lib/fleet';

const EASE = [0.16, 1, 0.3, 1] as const;
const MATERIALS: { value: IncidentMaterial; label: string }[] = [
  { value: 'mixed', label: 'Mixed / not sure' },
  { value: 'metal', label: 'Mostly metal' },
  { value: 'plastic', label: 'Mostly plastic' },
  { value: 'glass', label: 'Glass' },
  { value: 'labour', label: 'Labour only' },
];

export default function FleetTriagePage() {
  const reduce = useReducedMotion();
  const { vehicles } = useVehicle();
  const [incidents, setIncidents] = useState<Incident[]>(() => loadLocal<Incident[]>(STORE, []));
  const [overrides, setOverrides] = useState<Overrides>(() => loadLocal<Overrides>(OVERRIDES, {}));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(incidents));
      localStorage.setItem(OVERRIDES, JSON.stringify(overrides));
    } catch {}
  }, [incidents, overrides]);

  const fleet = useMemo(() => vehicles.map((v) => toFleetVehicle(v, overrides)), [vehicles, overrides]);
  const plan = useMemo(() => planFleet(fleet, incidents), [fleet, incidents]);
  const saved = plan.claimAllCost - plan.planCost;

  const add = () => {
    if (!fleet.length) return toast.error('Add vehicles to your fleet first.');
    setIncidents((x) => [...x, { id: crypto.randomUUID(), vehicleId: fleet[0].id, description: '', amount: 0, material: 'mixed', daysOffRoad: 0 }]);
  };
  const update = (id: string, patch: Partial<Incident>) => setIncidents((x) => x.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const importCsv = async (file: File) => {
    const { incidents: rows, errors } = parseIncidentsCsv(await file.text(), fleet);
    setIncidents((x) => [...x, ...rows.map((r) => ({ ...r, id: crypto.randomUUID() }))]);
    if (rows.length) toast.success(`Imported ${rows.length} incident${rows.length > 1 ? 's' : ''}.`);
    if (errors.length) toast.warning(`${errors.length} row${errors.length > 1 ? 's' : ''} skipped`, { description: errors.slice(0, 3).join(' · ') });
  };

  const download = (name: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveClaims = async () => {
    const toSave = plan.vehicles.flatMap((vp) => vp.incidents.filter((i) => i.decision === 'CLAIM').map((i) => ({ vp, i })));
    if (!toSave.length) return toast.message('No incidents are recommended for claiming.');
    setSaving(true);
    let ok = 0;
    for (const { vp, i } of toSave) {
      try {
        await apiFetch('/api/v1/claims', {
          method: 'POST',
          timeoutMs: 60000,
          body: {
            vehicle_id: vp.vehicle.id,
            estimated_repair_cost: i.incident.amount,
            status: 'DRAFT',
            accident_description: i.incident.description || undefined,
            calculated_payout: i.insurerPays,
            immediate_out_of_pocket: i.claimOutOfPocket,
            future_ncb_impact: vp.ncbLoss,
            recommendation: 'CLAIM',
            calculation_rule_version: RULE_VERSION,
          },
        });
        ok++;
      } catch (e) {
        toast.error(`Couldn’t save ${vp.vehicle.registration}`, { description: describeApiError(e).message });
      }
    }
    setSaving(false);
    if (ok) toast.success(`Saved ${ok} claim record${ok > 1 ? 's' : ''}.`, { description: 'Find them under Saved records. Nothing is sent to an insurer.' });
  };

  const decisionFor = (id: string) => plan.vehicles.flatMap((v) => v.incidents.map((i) => ({ i, v }))).find((x) => x.i.incident.id === id);

  return (
    <OrgShell
      title="Claim triage"
      subtitle="Log incidents across your fleet. ClearClaim decides which to claim and which to pay directly so your total cost is lowest, including No-Claim Bonus, which is lost once per vehicle."
      actions={
        <>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} aria-label="Import incidents CSV" />
          <button type="button" onClick={() => fileRef.current?.click()} className="vs-btn-secondary py-2.5"><Upload className="h-4 w-4" /> Import CSV</button>
          <button type="button" onClick={() => download('clearclaim-incidents-template.csv', 'registration,description,amount,material,days_off_road\nKA03AB2203,Rear bumper scrape,12000,plastic,1\n')} className="vs-btn-secondary py-2.5"><FileSpreadsheet className="h-4 w-4" /> Template</button>
          <button type="button" onClick={add} className="vs-btn-primary py-2.5"><Plus className="h-4 w-4" /> Add incident</button>
        </>
      }
    >
      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Recommended plan costs you', value: plan.planCost, sub: `${plan.claims} of ${incidents.filter((i) => i.amount > 0).length} incidents claimed`, tone: 'text-navy-950' },
          { label: 'Saved vs claiming everything', value: Math.max(0, saved), sub: `vs ${rupees(plan.claimAllCost)} if every incident were claimed`, tone: 'text-gain' },
          { label: 'No-Claim Bonus given up', value: plan.ncbAtRisk, sub: 'next-year discount lost on claimed vehicles', tone: 'text-loss' },
          { label: 'Downtime cost', value: plan.downtimeCost, sub: 'days off road × your daily cost (same either way)', tone: 'text-navy-950' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }} className="rounded-2xl border border-navy-100 bg-white p-5">
            <p className="text-xs font-medium text-navy-500">{k.label}</p>
            <AnimatedNumber value={k.value} duration={0.6} className={`mt-1 block text-2xl font-semibold tracking-tight ${k.tone}`} />
            <p className="mt-1 text-xs text-navy-400">{k.sub}</p>
          </motion.div>
        ))}
      </section>

      {plan.missingData.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Some vehicles are missing details, so their decisions are less reliable:</p>
            <p className="mt-1">{plan.missingData.join(' · ')}. Add them on <Link href="/org/fleet/vehicles" className="underline">Vehicles</Link>.</p>
          </div>
        </div>
      )}

      {/* Incidents */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-white">
        <div className="hidden grid-cols-[1.3fr_1.4fr_130px_150px_90px_1.3fr_40px] gap-3 border-b border-navy-100 bg-navy-50/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-navy-500 lg:grid">
          <span>Vehicle</span><span>What happened</span><span className="text-right">Repair quote</span><span>Material</span><span className="text-right">Days off</span><span>Decision</span><span />
        </div>
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Layers className="h-8 w-8 text-navy-300" />
            <p className="font-semibold text-navy-900">No incidents logged</p>
            <p className="max-w-md text-sm text-navy-500">Add incidents one by one or import a CSV from your maintenance log. Decisions update instantly as you type.</p>
            <button type="button" onClick={add} className="vs-btn-primary mt-2"><Plus className="h-4 w-4" /> Add the first incident</button>
          </div>
        ) : (
          <ul className="divide-y divide-navy-50">
            <AnimatePresence initial={false}>
              {incidents.map((inc) => {
                const d = decisionFor(inc.id);
                const claim = d?.i.decision === 'CLAIM';
                const standalone = d ? inc.amount - d.i.claimOutOfPocket : 0;
                return (
                  <motion.li key={inc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.3fr_1.4fr_130px_150px_90px_1.3fr_40px] lg:items-center">
                    <select value={inc.vehicleId} onChange={(e) => update(inc.id, { vehicleId: e.target.value })} className="vs-input py-2 text-sm" aria-label="Vehicle">
                      {fleet.map((v) => <option key={v.id} value={v.id}>{v.registration} · {v.label}</option>)}
                    </select>
                    <input value={inc.description} onChange={(e) => update(inc.id, { description: e.target.value })} placeholder="e.g. Rear bumper scrape" className="vs-input py-2 text-sm" aria-label="What happened" />
                    <input value={inc.amount ? String(inc.amount) : ''} inputMode="numeric" onChange={(e) => update(inc.id, { amount: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} placeholder="₹" className="vs-input tabular py-2 text-right text-sm" aria-label="Repair quote in rupees" />
                    <select value={inc.material} onChange={(e) => update(inc.id, { material: e.target.value as IncidentMaterial })} className="vs-input py-2 text-sm" aria-label="Material">
                      {MATERIALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <input value={inc.daysOffRoad ? String(inc.daysOffRoad) : ''} inputMode="numeric" onChange={(e) => update(inc.id, { daysOffRoad: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} placeholder="0" className="vs-input tabular py-2 text-right text-sm" aria-label="Days off road" />
                    <div className="min-w-0">
                      {d && inc.amount > 0 ? (
                        <motion.div key={d.i.decision} initial={reduce ? false : { scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-0.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claim ? 'bg-gain-soft text-gain' : 'bg-navy-100 text-navy-800'}`}>{claim ? 'Claim' : 'Pay directly'}</span>
                          <p className="text-xs text-navy-500">
                            {claim
                              ? standalone < d.v.ncbLoss
                                ? `Worth claiming because this vehicle’s NCB is already lost to another claim. You pay ${rupees(d.i.claimOutOfPocket)}.`
                                : `Insurer pays ~${rupees(d.i.insurerPays)}; you pay ${rupees(d.i.claimOutOfPocket)}.`
                              : `Claiming would save ${rupees(Math.max(0, standalone))} now but lose ${rupees(d.v.ncbLoss)} of NCB.`}
                          </p>
                        </motion.div>
                      ) : (
                        <span className="text-xs text-navy-400">Enter the quote</span>
                      )}
                    </div>
                    <button type="button" onClick={() => setIncidents((x) => x.filter((i) => i.id !== inc.id))} className="justify-self-end rounded-full p-2 text-navy-300 hover:bg-navy-50 hover:text-loss" aria-label="Remove incident">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {incidents.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-navy-500">Incidents are kept on this device until you save them. Estimates use standard rules; insurers and surveyors decide actual settlements.</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => download('clearclaim-fleet-plan.csv', planToCsv(plan))} className="vs-btn-secondary py-2.5"><Download className="h-4 w-4" /> Export plan</button>
            <button type="button" onClick={saveClaims} disabled={saving} className="vs-btn-primary py-2.5"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save claims as records'}</button>
          </div>
        </div>
      )}
    </OrgShell>
  );
}
