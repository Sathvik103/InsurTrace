'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Check, Download, FileSpreadsheet, Layers, Link2, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';
import { FleetPlan, Incident, IncidentMaterial, parseIncidentsCsv, planFleet, planToCsv, VehiclePlan } from '@/lib/triage';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { RULE_VERSION } from '@/lib/engine';
import { FLEET_INCIDENTS_KEY as STORE, FLEET_OVERRIDES_KEY as OVERRIDES, loadLocal, Overrides, toFleetVehicle } from '@/lib/fleet';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { TOTAL_LOSS_RATIO } from '@/lib/repairOrSell';
import { NumberPlate } from '@/components/vehicle/NumberPlate';

const EASE = [0.16, 1, 0.3, 1] as const;
const MATERIALS: { value: IncidentMaterial; label: string }[] = [
  { value: 'mixed', label: 'Mixed / not sure' },
  { value: 'metal', label: 'Mostly metal' },
  { value: 'plastic', label: 'Mostly plastic' },
  { value: 'glass', label: 'Glass' },
  { value: 'labour', label: 'Labour only' },
];

// A month that shows triage at work: one vehicle where a big claim makes a small one worth bundling.
const SAMPLE: Omit<Incident, 'id' | 'vehicleId'>[][] = [
  [
    { description: 'Front-end collision: bumper, bonnet, headlamp', amount: 68000, material: 'mixed', daysOffRoad: 6 },
    { description: 'Rear bumper scrape in parking', amount: 7500, material: 'plastic', daysOffRoad: 1 },
  ],
  [{ description: 'Windshield crack from stone chip', amount: 14000, material: 'glass', daysOffRoad: 1 }],
  [{ description: 'Door dent and repaint', amount: 9000, material: 'metal', daysOffRoad: 2 }],
  [{ description: 'Side mirror broken', amount: 3500, material: 'plastic', daysOffRoad: 0 }],
];

/* ---------------------------------------------------------------- strategy panel */
function Strategy({ plan, count }: { plan: FleetPlan; count: number }) {
  const reduce = useReducedMotion();
  const rows = [
    { key: 'claim', label: 'Claim every incident', value: plan.claimAllCost },
    { key: 'pay', label: 'Pay for everything', value: plan.payAllCost },
    { key: 'plan', label: 'ClearClaim plan', value: plan.planCost },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  const nextBest = Math.min(plan.claimAllCost, plan.payAllCost);
  const saving = Math.max(0, nextBest - plan.planCost);

  return (
    <section className="vs-grain relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
      <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">This month’s plan saves</p>
          <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-signal sm:text-6xl">
            <AnimatedNumber value={saving} duration={0.8} />
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/55">
            versus the cheaper of “claim everything” and “pay for everything”, including No-Claim Bonus lost at renewal.
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/40">Claims</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">{plan.claims}<span className="text-base text-white/40"> / {count}</span></dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/40">Bonus lost</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-ember"><AnimatedNumber value={plan.ncbAtRisk} duration={0.6} /></dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/40">Downtime</dt>
              <dd className="mt-1 font-display text-2xl font-semibold"><AnimatedNumber value={plan.downtimeCost} duration={0.6} /></dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4">
          {rows.map((r) => {
            const mine = r.key === 'plan';
            return (
              <div key={r.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className={mine ? 'font-semibold text-white' : 'text-white/60'}>{r.label}</span>
                  <span className={`tabular font-mono ${mine ? 'text-signal' : 'text-white/70'}`}>{rupees(r.value)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-md bg-white/[0.06]">
                  <motion.div
                    className={`h-full rounded-md ${mine ? 'bg-signal' : 'bg-white/25'}`}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${(r.value / max) * 100}%` }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-white/40">Costs include what you pay now plus each claimed vehicle’s No-Claim Bonus loss. Downtime is the same in every strategy.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page */
export default function FleetTriagePage() {
  const reduce = useReducedMotion();
  const { vehicles } = useVehicle();
  const [incidents, setIncidents] = useState<Incident[]>(() => loadLocal<Incident[]>(STORE, []));
  const [overrides] = useState<Overrides>(() => loadLocal<Overrides>(OVERRIDES, {}));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(incidents));
    } catch {}
  }, [incidents]);

  const fleet = useMemo(() => vehicles.map((v) => toFleetVehicle(v, overrides)), [vehicles, overrides]);
  const byId = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  // Incidents whose vehicle left the fleet can't be planned; keep them out of the plan but visible.
  const live = useMemo(() => incidents.filter((i) => byId.has(i.vehicleId)), [incidents, byId]);
  const orphaned = incidents.length - live.length;
  const plan = useMemo(() => planFleet(fleet, live), [fleet, live]);
  const priced = live.filter((i) => i.amount > 0).length;
  const hasSample = incidents.some((i) => i.sample);

  const add = (vehicleId?: string) => {
    if (!fleet.length) return toast.error('Add vehicles to your fleet first.');
    setIncidents((x) => [...x, { id: crypto.randomUUID(), vehicleId: vehicleId || fleet[0].id, description: '', amount: 0, material: 'mixed', daysOffRoad: 0 }]);
  };
  const update = (id: string, patch: Partial<Incident>) => setIncidents((x) => x.map((i) => (i.id === id ? { ...i, ...patch, sample: patch.sample ?? i.sample } : i)));
  const remove = (id: string) => setIncidents((x) => x.filter((i) => i.id !== id));

  const loadSample = () => {
    if (!fleet.length) return toast.error('Add vehicles to your fleet first.');
    const rows = SAMPLE.slice(0, fleet.length).flatMap((list, k) => list.map((r) => ({ ...r, id: crypto.randomUUID(), vehicleId: fleet[k].id, sample: true })));
    setIncidents(rows);
  };

  const importCsv = async (file: File) => {
    const { incidents: rows, errors } = parseIncidentsCsv(await file.text(), fleet);
    setIncidents((x) => [...x, ...rows.map((r) => ({ ...r, id: crypto.randomUUID() }))]);
    if (rows.length) toast.success(`Imported ${rows.length} incident${rows.length > 1 ? 's' : ''}.`);
    if (errors.length) toast.warning(`${errors.length} row${errors.length > 1 ? 's' : ''} skipped`, { description: errors.slice(0, 3).join(' · ') });
    if (fileRef.current) fileRef.current.value = '';
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
    const toSave = plan.vehicles.flatMap((vp) => vp.incidents.filter((i) => i.decision === 'CLAIM' && !i.incident.savedAt).map((i) => ({ vp, i })));
    if (!toSave.length) return toast.message('Every recommended claim is already saved.');
    setSaving(true);
    const done: string[] = [];
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
        done.push(i.incident.id);
      } catch (e) {
        toast.error(`Couldn’t save ${vp.vehicle.registration}`, { description: describeApiError(e).message });
      }
    }
    const at = new Date().toISOString();
    setIncidents((x) => x.map((inc) => (done.includes(inc.id) ? { ...inc, savedAt: at } : inc)));
    setSaving(false);
    if (done.length) toast.success(`Saved ${done.length} claim record${done.length > 1 ? 's' : ''}.`, { description: 'Find them under Saved records. Nothing is sent to an insurer.' });
  };

  const planFor = (vehicleId: string) => plan.vehicles.find((p) => p.vehicle.id === vehicleId);
  const groups = fleet.filter((f) => live.some((i) => i.vehicleId === f.id));

  return (
    <OrgShell
      title="Claim triage"
      subtitle="Log this month’s incidents. ClearClaim finds the claim-or-pay plan with the lowest total cost, using the fact that No-Claim Bonus is lost once per vehicle."
      actions={
        <>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} aria-label="Import incidents CSV" />
          <button type="button" onClick={() => fileRef.current?.click()} className="vs-btn-secondary py-2.5"><Upload className="h-4 w-4" /> Import CSV</button>
          <button type="button" onClick={() => download('clearclaim-incidents-template.csv', 'registration,description,amount,material,days_off_road\nKA03AB2203,Rear bumper scrape,12000,plastic,1\n')} className="vs-btn-secondary py-2.5"><FileSpreadsheet className="h-4 w-4" /> Template</button>
          <button type="button" onClick={() => add()} className="vs-btn-primary py-2.5"><Plus className="h-4 w-4" /> Add incident</button>
        </>
      }
    >
      {live.length > 0 && <Strategy plan={plan} count={priced} />}

      {hasSample && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-navy-600"><span className="font-semibold text-navy-950">Sample incidents loaded.</span> They show how triage works with your vehicles. Replace them with your own before saving.</p>
          <button type="button" onClick={() => setIncidents((x) => x.filter((i) => !i.sample))} className="vs-btn-secondary shrink-0 py-2"><X className="h-4 w-4" /> Clear samples</button>
        </div>
      )}

      {plan.missingData.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Missing details make these decisions less reliable:</span> {plan.missingData.join(' · ')}. Fill them in on{' '}
            <Link href="/org/fleet/vehicles" className="font-semibold underline">Vehicles</Link>.
          </p>
        </div>
      )}

      {orphaned > 0 && (
        <p className="mt-4 rounded-2xl border border-navy-100 bg-white p-4 text-sm text-navy-600">
          {orphaned} incident{orphaned > 1 ? 's belong' : ' belongs'} to a vehicle no longer in your fleet and {orphaned > 1 ? 'are' : 'is'} left out of the plan.{' '}
          <button type="button" className="font-semibold text-navy-950 underline" onClick={() => setIncidents((x) => x.filter((i) => byId.has(i.vehicleId)))}>Remove</button>
        </p>
      )}

      {live.length === 0 ? (
        <section className="mt-2 flex flex-col items-center gap-4 rounded-2xl border border-navy-100 bg-white p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-950 text-signal"><Layers className="h-6 w-6" /></span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-950">No incidents this month</h2>
          <p className="max-w-md text-sm text-navy-500">Add incidents one by one, import a CSV from your maintenance log, or load a sample month to see how triage decides.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => add()} className="vs-btn-primary"><Plus className="h-4 w-4" /> Add the first incident</button>
            <button type="button" onClick={loadSample} className="vs-btn-secondary">Load a sample month</button>
          </div>
        </section>
      ) : (
        <div className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {groups.map((f, gi) => {
              const v = byId.get(f.id)!;
              const vp = planFor(f.id);
              const rows = live.filter((i) => i.vehicleId === f.id);
              return (
                <motion.section
                  key={f.id}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: gi * 0.04, ease: EASE }}
                  className="overflow-hidden rounded-2xl border border-navy-100 bg-white"
                >
                  <header className="flex flex-col gap-4 border-b border-navy-100 bg-[#f6f5f0] p-5 sm:flex-row sm:items-center">
                    <CarSilhouette vehicle={v} className="h-14 w-36 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-950">{f.label}</h2>
                        <NumberPlate value={f.registration} commercial={!!v.usage_type && v.usage_type !== 'PERSONAL'} />
                        {vp?.bundled && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1 text-[11px] font-semibold text-signal">
                            <Link2 className="h-3 w-3" /> Bundled
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-navy-500">
                        {f.ncb}% No-Claim Bonus · worth {rupees(vp?.ncbLoss ?? 0)} at renewal · {f.ageYears} yr old
                      </p>
                    </div>
                    {vp && <VehicleCost vp={vp} />}
                  </header>
                  <ul className="divide-y divide-navy-50">
                    {rows.map((inc) => (
                      <IncidentRow key={inc.id} inc={inc} vp={vp} fleet={fleet} onChange={(p) => update(inc.id, p)} onRemove={() => remove(inc.id)} />
                    ))}
                  </ul>
                  <button type="button" onClick={() => add(f.id)} className="flex w-full items-center gap-2 px-5 py-3 text-sm font-medium text-navy-500 transition hover:bg-[#f6f5f0] hover:text-navy-950">
                    <Plus className="h-4 w-4" /> Another incident on {f.registration}
                  </button>
                </motion.section>
              );
            })}
          </AnimatePresence>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-navy-500">Incidents stay on this device until you save them. Estimates use standard rules; insurers and surveyors decide actual settlements.</p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => download('clearclaim-fleet-plan.csv', planToCsv(plan))} className="vs-btn-secondary py-2.5"><Download className="h-4 w-4" /> Export plan</button>
              <button type="button" onClick={saveClaims} disabled={saving || hasSample} title={hasSample ? 'Clear the sample incidents first' : undefined} className="vs-btn-primary py-2.5">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save claims as records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgShell>
  );
}

function VehicleCost({ vp }: { vp: VehiclePlan }) {
  const alt = Math.min(vp.claimAllCost, vp.payAllCost);
  return (
    <div className="text-left sm:text-right">
      <p className="text-[11px] uppercase tracking-wide text-navy-400">Plan cost</p>
      <p className="tabular font-display text-2xl font-semibold text-navy-950">{rupees(vp.planCost)}</p>
      {alt - vp.planCost > 0.5 && <p className="text-xs font-medium text-signal-700">saves {rupees(alt - vp.planCost)}</p>}
    </div>
  );
}

function IncidentRow({
  inc,
  vp,
  fleet,
  onChange,
  onRemove,
}: {
  inc: Incident;
  vp?: VehiclePlan;
  fleet: { id: string; registration: string; label: string }[];
  onChange: (p: Partial<Incident>) => void;
  onRemove: () => void;
}) {
  const d = vp?.incidents.find((x) => x.incident.id === inc.id);
  const claim = d?.decision === 'CLAIM';
  const standalone = d ? inc.amount - d.claimOutOfPocket : 0;
  const ncbLoss = vp?.ncbLoss ?? 0;
  const reason = !d || inc.amount <= 0
    ? null
    : claim
      ? standalone < ncbLoss
        ? `Bundled: this vehicle’s bonus is already lost to a bigger claim, so this one costs no extra bonus. You pay ${rupees(d.claimOutOfPocket)}.`
        : `Insurer pays about ${rupees(d.insurerPays)}; you pay ${rupees(d.claimOutOfPocket)}.`
      : `Claiming saves ${rupees(Math.max(0, standalone))} now but loses ${rupees(ncbLoss)} of bonus.`;

  return (
    <motion.li layout className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_110px] lg:grid-cols-[1.6fr_130px_150px_90px_1.5fr_36px] lg:items-center">
      <div className="min-w-0 space-y-1.5 sm:col-span-3 lg:col-span-1">
        <input value={inc.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="What happened, e.g. rear bumper scrape" className="vs-input py-2 text-sm" aria-label="What happened" />
        <div className="flex items-center gap-2">
          <select value={inc.vehicleId} onChange={(e) => onChange({ vehicleId: e.target.value })} className="max-w-[14rem] truncate rounded-lg border border-navy-100 bg-white px-2 py-1 text-xs text-navy-600" aria-label="Move to another vehicle">
            {fleet.map((v) => <option key={v.id} value={v.id}>{v.registration} · {v.label}</option>)}
          </select>
          {inc.sample && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">Sample</span>}
          {inc.savedAt && <span className="inline-flex items-center gap-1 rounded-md bg-gain-soft px-2 py-0.5 text-[10px] font-semibold text-gain"><Check className="h-3 w-3" /> Saved</span>}
          {vp && vp.vehicle.idv > 0 && inc.amount >= vp.vehicle.idv * TOTAL_LOSS_RATIO && (
            <span title="Many policies treat repairs above about 75% of the IDV as a total loss. Compare repairing with selling or a total-loss settlement." className="rounded-md bg-ember/15 px-2 py-0.5 text-[10px] font-semibold text-loss">
              Over 75% of IDV: total-loss territory
            </span>
          )}
        </div>
      </div>
      <label className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy-400">₹</span>
        <input
          value={inc.amount ? new Intl.NumberFormat('en-IN').format(inc.amount) : ''}
          inputMode="numeric"
          onChange={(e) => onChange({ amount: Number(e.target.value.replace(/[^\d]/g, '').slice(0, 9)) || 0 })}
          placeholder="Quote"
          className="vs-input tabular py-2 pl-7 text-right text-sm"
          aria-label="Repair quote in rupees"
        />
      </label>
      <select value={inc.material} onChange={(e) => onChange({ material: e.target.value as IncidentMaterial })} className="vs-input py-2 text-sm" aria-label="Material">
        {MATERIALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <label className="relative">
        <input value={inc.daysOffRoad ? String(inc.daysOffRoad) : ''} inputMode="numeric" onChange={(e) => onChange({ daysOffRoad: Math.min(365, Number(e.target.value.replace(/[^\d]/g, '')) || 0) })} placeholder="0" className="vs-input tabular py-2 pr-12 text-right text-sm" aria-label="Days off road" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-400">days</span>
      </label>
      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
        {reason ? (
          <motion.div key={d!.decision} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
            <span className={`mt-0.5 shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${claim ? 'bg-signal text-navy-950' : 'bg-navy-100 text-navy-800'}`}>{claim ? 'Claim' : 'Pay'}</span>
            <p className="text-xs leading-relaxed text-navy-500">{reason}</p>
          </motion.div>
        ) : (
          <span className="text-xs text-navy-400">Enter the quote to see a decision</span>
        )}
      </div>
      <button type="button" onClick={onRemove} className="justify-self-end rounded-md p-2 text-navy-300 transition hover:bg-red-50 hover:text-red-600" aria-label="Remove incident">
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.li>
  );
}
