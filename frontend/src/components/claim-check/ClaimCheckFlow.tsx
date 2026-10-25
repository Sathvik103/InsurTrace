'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, FileUp, HelpCircle, Plus, Wrench, X } from 'lucide-react';
import { useVehicle } from '@/context/VehicleContext';
import { useAssistant, useAssistantPageContext } from '@/context/AssistantContext';
import { analyzeClaim, DAMAGE_PARTS, EngineResult, NCB_STEPS, PartCategory, PolicyInputs, RepairLine, rupees } from '@/lib/claimCheck';
import { CarDiagram } from './CarDiagram';
import { ResultView } from './ResultView';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { takeHandoff } from '@/lib/extractHandoff';
import { LedgerCommitPanel } from '@/components/common/LedgerCommitPanel';
import { CarSilhouette } from '@/components/vehicle/CarSilhouette';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';

const STEPS = ['Your car', 'What’s damaged', 'Your policy', 'Your answer'] as const;
const EASE = [0.16, 1, 0.3, 1] as const;
const CURRENT_YEAR = new Date().getFullYear();

type TotalMaterial = 'metal' | 'plastic' | 'mixed';

const toNum = (s: string) => {
  const n = parseFloat(String(s).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function ClaimCheckFlow() {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { vehicles, selectedVehicle, setSelectedVehicleId } = useVehicle();
  const { open } = useAssistant();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Step 1: car
  const [carId, setCarId] = useState<string | 'other' | null>(null);
  const [otherYear, setOtherYear] = useState('');
  const [idv, setIdv] = useState('');

  // Step 2: damage
  const [mode, setMode] = useState<'parts' | 'total'>('parts');
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [total, setTotal] = useState('');
  const [material, setMaterial] = useState<TotalMaterial>('mixed');
  const [docItems, setDocItems] = useState<{ label: string; category: PartCategory; cost: string }[]>([]);
  const [fromDocument, setFromDocument] = useState(false);

  // Step 3: policy
  const [ncb, setNcb] = useState<number | null>(null);
  const [deductible, setDeductible] = useState('1000');
  const [zeroDep, setZeroDep] = useState<'yes' | 'no' | 'unsure' | null>(null);
  const [premium, setPremium] = useState('');

  // Step 4: result
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const car = carId && carId !== 'other' ? vehicles.find((v) => v.id === carId) : undefined;

  // Prefill from the active vehicle and from an extracted document (?from_extract=true&...).
  // Vehicles load asynchronously, so this has to run as an effect once they arrive.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const qVehicle = params.get('vehicle_id');
    const initial = (qVehicle && vehicles.find((v) => v.id === qVehicle)) || selectedVehicle;
    if (initial && carId === null) {
      setCarId(initial.id);
      if (initial.idv) setIdv(String(initial.idv));
      if (initial.ncb_percentage != null && (NCB_STEPS as readonly number[]).includes(initial.ncb_percentage)) setNcb(initial.ncb_percentage);
      if (initial.has_zero_dep != null) setZeroDep(initial.has_zero_dep ? 'yes' : 'no');
      if (initial.od_premium) setPremium(String(initial.od_premium));
    }
    if (params.get('idv')) setIdv(params.get('idv')!);
    if (params.get('deductible')) setDeductible(params.get('deductible')!);
    const qNcb = params.get('ncb');
    if (qNcb && (NCB_STEPS as readonly number[]).includes(Number(qNcb))) setNcb(Number(qNcb));
    const handoff = params.get('from_extract') ? takeHandoff() : null;
    if (handoff) {
      setFromDocument(true);
      const hp = handoff.policy || {};
      if (hp.registrationNumber) {
        const match = vehicles.find((v) => v.registration_number.replace(/[\s-]/g, '') === hp.registrationNumber);
        if (match) setCarId(match.id);
      }
      if (hp.idv) setIdv(String(hp.idv));
      if (hp.deductible) setDeductible(String(hp.deductible));
      if (hp.ncb !== undefined && (NCB_STEPS as readonly number[]).includes(hp.ncb)) setNcb(hp.ncb);
      if (handoff.items?.length) {
        setMode('parts');
        setDocItems(handoff.items.map((i) => ({ ...i, cost: String(Math.round(i.cost)) })));
      } else if (handoff.total) {
        setMode('total');
        setTotal(String(Math.round(handoff.total)));
      }
    } else if (params.get('repair_cost')) {
      setMode('total');
      setTotal(params.get('repair_cost')!);
      const cat = params.get('part_category');
      if (cat === 'metal' || cat === 'plastic') setMaterial(cat);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, vehicles.length]);

  const vehicleAge = useMemo(() => {
    const year = car?.manufacture_year ?? (otherYear ? Number(otherYear) : NaN);
    return Number.isFinite(year) ? Math.max(0, CURRENT_YEAR - year) : NaN;
  }, [car, otherYear]);

  const items: RepairLine[] = useMemo(() => {
    if (mode === 'total') {
      const t = toNum(total);
      if (material === 'mixed') return [{ category: 'metal', cost: t / 2 }, { category: 'plastic', cost: t / 2 }];
      return [{ category: material, cost: t }];
    }
    return [
      ...docItems.map((d) => ({ category: d.category, cost: toNum(d.cost) })),
      ...DAMAGE_PARTS.filter((p) => costs[p.id] !== undefined).map((p) => ({ category: p.category as PartCategory, cost: toNum(costs[p.id]) })),
    ];
  }, [mode, total, material, costs, docItems]);

  const repairTotal = items.reduce((s, i) => s + i.cost, 0);
  const selectedParts = useMemo(() => new Set(Object.keys(costs)), [costs]);

  const policy: PolicyInputs = useMemo(
    () => ({
      vehicleAgeYears: vehicleAge,
      idv: toNum(idv),
      deductible: toNum(deductible),
      ncbPercentage: ncb ?? 0,
      zeroDep: zeroDep === 'yes',
      nextYearPremium: toNum(premium),
    }),
    [vehicleAge, idv, deductible, ncb, zeroDep, premium]
  );

  const stepError = (() => {
    if (step === 0) {
      if (!carId) return 'Choose your car to continue.';
      if (!Number.isFinite(vehicleAge)) return 'Enter the year your car was made.';
      if (toNum(idv) <= 0) return 'Enter your IDV (it’s on the first page of your policy).';
    }
    if (step === 1) {
      if (mode === 'parts' && selectedParts.size === 0 && docItems.length === 0) return 'Tap the parts that were damaged.';
      if (repairTotal <= 0) return 'Enter what the workshop quoted.';
      if (mode === 'parts' && items.some((i) => i.cost <= 0)) return 'Add a cost for each selected part (or remove it).';
    }
    if (step === 2) {
      if (ncb === null) return 'Choose your current No-Claim Bonus.';
      if (zeroDep === null) return 'Tell us whether you have zero-depreciation cover.';
      if (toNum(premium) <= 0) return 'Enter your renewal premium so we can work out the NCB cost.';
    }
    return null;
  })();

  const runEngine = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Let the "working it out" animation play briefly; the request runs in parallel.
      const [r] = await Promise.all([analyzeClaim(policy, items), new Promise((res) => setTimeout(res, reduce ? 0 : 900))]);
      setResult(r);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [policy, items, reduce]);

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    if (to === 3) runEngine();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const assistantData = useMemo(
    () => (result ? { kind: 'claim-result' as const, result, policy, vehicleName: car ? `${car.make} ${car.model}` : undefined } : null),
    [result, policy, car]
  );
  useAssistantPageContext(assistantData);

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -40 }),
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header + progress */}
      <div className="mb-8 space-y-5">
        <div className="space-y-3">
          <p className={`text-sm font-semibold ${fromDocument ? 'text-amber-700' : 'text-steel-700'}`}>
            {fromDocument ? 'Filled in from your document: check each value' : 'Claim check · about 2 minutes'}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-navy-950 sm:text-5xl">Claim it, or pay it yourself?</h1>
          <p className="max-w-xl text-base text-navy-500">Answer a few simple questions. We’ll show what your insurer might pay, what you’d pay, and which option costs you less.</p>
        </div>
        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                disabled={i >= step || (step === 3 && loading)}
                onClick={() => go(i)}
                aria-current={i === step ? 'step' : undefined}
                className="group flex items-center gap-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-all duration-500 ${
                    i < step ? 'bg-navy-950 text-signal' : i === step ? 'bg-signal text-navy-950 ring-4 ring-signal/30' : 'bg-navy-50 text-navy-300'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : `0${i + 1}`}
                </span>
                <span className={`hidden whitespace-nowrap text-sm font-medium md:block ${i === step ? 'text-navy-950' : i < step ? 'text-navy-500 group-hover:text-navy-900' : 'text-navy-300'}`}>{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 bg-navy-100">
                  <motion.span className="absolute inset-y-0 left-0 bg-navy-950" initial={false} animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.6, ease: EASE }} />
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="text-sm font-medium text-navy-500 sm:hidden">Step {step + 1} of 4 · {STEPS[step]}</p>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: EASE }}
        >
          {step === 0 && (
            <StepCard title="Which car was damaged?" subtitle="We use its age to work out depreciation on parts.">
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicles.map((v) => {
                  const on = carId === v.id;
                  return (
                    <motion.button
                      key={v.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setCarId(v.id);
                        setSelectedVehicleId(v.id);
                        setIdv(v.idv ? String(v.idv) : '');
                        if (v.ncb_percentage != null && (NCB_STEPS as readonly number[]).includes(v.ncb_percentage)) setNcb(v.ncb_percentage);
                        if (v.has_zero_dep != null) setZeroDep(v.has_zero_dep ? 'yes' : 'no');
                        if (v.od_premium) setPremium(String(v.od_premium));
                      }}
                      className={`relative overflow-hidden rounded-xl border p-4 text-left transition duration-300 ${
                        on ? 'border-navy-950 bg-navy-950 text-white shadow-[0_20px_40px_-20px_rgba(20,19,16,0.6)]' : 'border-navy-100 bg-white hover:-translate-y-0.5 hover:border-navy-300'
                      }`}
                    >
                      <div className={`-mx-1 mb-3 rounded-2xl px-3 pt-2 ${on ? 'bg-white/[0.07]' : 'bg-[#f6f5f0]'}`}>
                        <CarSilhouette vehicle={v} className="h-16 w-full" />
                      </div>
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{v.make} {v.model}</span>
                          <span className={`block text-xs ${on ? 'text-white/55' : 'text-navy-500'}`}>
                            {BODY_LABEL[bodyTypeOf(v)]} · {v.registration_number} · {v.manufacture_year}{v.is_demo ? ' · Demo' : ''}
                          </span>
                        </span>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${on ? 'bg-signal text-navy-950' : 'border border-navy-200'}`}>
                          {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setCarId('other');
                    setIdv('');
                  }}
                  className={`flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${
                    carId === 'other' ? 'border-navy-950 bg-navy-50' : 'border-navy-200 bg-white hover:border-navy-400'
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-50 text-navy-600"><Plus className="h-5 w-5" /></span>
                  <span>
                    <span className="block font-semibold text-navy-900">A different car</span>
                    <span className="block text-xs text-navy-500">Quick check without saving</span>
                  </span>
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {carId === 'other' && (
                  <Field label="Year the car was made" htmlFor="year">
                    <input id="year" inputMode="numeric" className="vs-input" placeholder={`e.g. ${CURRENT_YEAR - 3}`} value={otherYear} onChange={(e) => setOtherYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  </Field>
                )}
                <Field label="IDV (Insured Declared Value)" htmlFor="idv" help={() => open('What is IDV?')} hint="On the first page of your policy">
                  <RupeeInput id="idv" value={idv} onChange={setIdv} placeholder="e.g. 6,50,000" />
                </Field>
              </div>
              {car?.is_demo && <p className="mt-4 text-xs text-navy-500">This is a demo car with fictional policy details. Add your own car for an estimate about you.</p>}
            </StepCard>
          )}

          {step === 1 && (
            <StepCard title="What got damaged?" subtitle="Tap each damaged part, then enter the cost from your workshop’s quote.">
              <div className="mb-6 inline-flex rounded-2xl bg-navy-50 p-1">
                {(['parts', 'total'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className="relative rounded-xl px-4 py-2 text-sm font-medium text-navy-700">
                    {mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="relative">{m === 'parts' ? 'Part by part' : 'I only know the total'}</span>
                  </button>
                ))}
              </div>

              {mode === 'parts' ? (
                <div className="grid gap-8 md:grid-cols-[260px_1fr]">
                  <CarDiagram
                    type={car ? bodyTypeOf(car) : 'hatchback'}
                    selected={selectedParts}
                    onToggle={(id) =>
                      setCosts((c) => {
                        const next = { ...c };
                        if (id in next) delete next[id];
                        else next[id] = '';
                        return next;
                      })
                    }
                  />
                  <div className="space-y-3">
                    {docItems.map((d, idx) => (
                      <div key={`doc-${idx}`} className="flex items-center gap-3 rounded-2xl border border-steel-200 bg-steel-50/50 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-navy-900">{d.label}</p>
                          <p className="text-xs text-steel-700">From your document · {d.category === 'labour' ? 'labour' : `${d.category} part`}</p>
                        </div>
                        <div className="w-36"><RupeeInput value={d.cost} onChange={(v) => setDocItems((all) => all.map((x, k) => (k === idx ? { ...x, cost: v } : x)))} placeholder="Cost" compact /></div>
                        <button type="button" onClick={() => setDocItems((all) => all.filter((_, k) => k !== idx))} className="rounded-md p-1.5 text-navy-300 hover:bg-navy-50 hover:text-navy-700" aria-label={`Remove ${d.label}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <AnimatePresence initial={false}>
                      {DAMAGE_PARTS.filter((p) => selectedParts.has(p.id)).map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-navy-900">{p.label}</p>
                              <p className="text-xs text-navy-500">{p.hint}</p>
                            </div>
                            <div className="w-36"><RupeeInput value={costs[p.id]} onChange={(v) => setCosts((c) => ({ ...c, [p.id]: v }))} placeholder="Cost" compact autoFocus /></div>
                            <button type="button" onClick={() => setCosts((c) => { const n = { ...c }; delete n[p.id]; return n; })} className="rounded-md p-1.5 text-navy-300 hover:bg-navy-50 hover:text-navy-700" aria-label={`Remove ${p.label}`}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {selectedParts.size === 0 && docItems.length === 0 && (
                      <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-500">
                        <Wrench className="mb-2 h-6 w-6 text-navy-300" />
                        Tap the dots on the car to add damaged parts.
                      </div>
                    )}
                    {!selectedParts.has('labour') && (
                      <button type="button" onClick={() => setCosts((c) => ({ ...c, labour: '' }))} className="vs-chip hover:border-navy-300">
                        <Plus className="h-3.5 w-3.5" /> Add labour & painting charges
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <Field label="Total on the workshop quote" htmlFor="total">
                    <RupeeInput id="total" value={total} onChange={setTotal} placeholder="e.g. 42,500" />
                  </Field>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-navy-800">What was mostly replaced?</legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([['metal', 'Metal panels', 'Doors, bonnet, fenders'], ['plastic', 'Plastic parts', 'Bumpers, lights, mirrors'], ['mixed', 'Not sure', 'We’ll assume half and half']] as const).map(([v, l, h]) => (
                        <Choice key={v} on={material === v} onClick={() => setMaterial(v)} label={l} hint={h} />
                      ))}
                    </div>
                  </fieldset>
                  <p className="text-xs text-navy-500">Entering parts one by one gives a more accurate estimate, because insurers deduct different amounts for different materials.</p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-navy-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-navy-600">Repair total: <span className="tabular text-lg font-semibold text-navy-900">{rupees(repairTotal)}</span></p>
                <Link href="/decision/extract" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-700 hover:underline">
                  <FileUp className="h-4 w-4" /> Have the estimate as a PDF? Upload it
                </Link>
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="A few details from your policy" subtitle="You’ll find these on your policy schedule. If you’re unsure, pick the closest option.">
              <div className="space-y-7">
                <fieldset className="space-y-3">
                  <legend className="flex items-center gap-2 text-sm font-medium text-navy-800">
                    Your current No-Claim Bonus <HelpBtn onClick={() => open('How does No-Claim Bonus (NCB) work?')} />
                  </legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {NCB_STEPS.map((n, i) => (
                      <Choice key={n} on={ncb === n} onClick={() => setNcb(n)} label={`${n}%`} hint={i === 0 ? 'Claimed last year' : i === 5 ? '5+ yrs claim-free' : `${i} yr${i > 1 ? 's' : ''} claim-free`} />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="flex items-center gap-2 text-sm font-medium text-navy-800">
                    Deductible (the part you always pay) <HelpBtn onClick={() => open('What is a deductible?')} />
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Choice on={deductible === '1000'} onClick={() => setDeductible('1000')} label="₹1,000" hint="Most cars up to 1500cc" />
                    <Choice on={deductible === '2000'} onClick={() => setDeductible('2000')} label="₹2,000" hint="Above 1500cc" />
                    <div className={`rounded-2xl border p-2 ${!['1000', '2000'].includes(deductible) ? 'border-navy-900' : 'border-navy-100'}`}>
                      <RupeeInput value={['1000', '2000'].includes(deductible) ? '' : deductible} onChange={setDeductible} placeholder="Other amount" compact />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="flex items-center gap-2 text-sm font-medium text-navy-800">
                    Do you have zero-depreciation cover? <HelpBtn onClick={() => open('What is zero depreciation cover?')} />
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Choice on={zeroDep === 'yes'} onClick={() => setZeroDep('yes')} label="Yes" hint="Also called “nil dep”" />
                    <Choice on={zeroDep === 'no'} onClick={() => setZeroDep('no')} label="No" />
                    <Choice on={zeroDep === 'unsure'} onClick={() => setZeroDep('unsure')} label="Not sure" hint="We’ll assume no (the cautious estimate)" />
                  </div>
                </fieldset>

                <Field label="Your renewal premium (own damage)" htmlFor="premium" help={() => open('What should I enter as next year’s premium?')} hint="Used to work out how much your No-Claim Bonus is worth">
                  <RupeeInput id="premium" value={premium} onChange={setPremium} placeholder="e.g. 14,000" />
                </Field>
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {loading && <Working car={car} />}
              {error != null && !loading && <ApiErrorNotice error={error} onRetry={runEngine} />}
              {result && !loading && (
                <>
                  <ResultView result={result} policy={policy} items={items} />
                  {car ? (
                    <LedgerCommitPanel
                      buildPayload={() => ({
                        vehicle_id: car.id,
                        policy_id: car.policy_number || undefined,
                        estimated_repair_cost: result.total_estimate,
                        status: 'DRAFT',
                        calculated_payout: result.estimated_payout,
                        immediate_out_of_pocket: result.immediate_out_of_pocket,
                        future_ncb_impact: result.future_ncb_impact,
                        recommendation: result.recommendation,
                        calculation_rule_version: result.rule_version,
                      })}
                    />
                  ) : (
                    <p className="rounded-2xl border border-navy-100 bg-white p-5 text-sm text-navy-600">
                      Want to keep this result in your vehicle’s history? <Link href="/onboarding" className="font-semibold text-steel-700 hover:underline">Add this car</Link> and run the check again.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="sticky bottom-[84px] z-10 -mx-4 mt-8 rounded-2xl border border-navy-100 bg-white/90 px-4 py-3 backdrop-blur lg:bottom-0 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="vs-btn-secondary">
              <ArrowLeft className="h-4 w-4" /> {step === 3 ? 'Change answers' : 'Back'}
            </button>
          ) : <span />}
          {step < 3 && (
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {stepError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden text-right text-sm text-navy-500 md:block">
                    {stepError}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="button" disabled={!!stepError} onClick={() => go(step + 1)} className="vs-btn-primary" title={stepError || undefined}>
                {step === 2 ? 'Show my answer' : 'Continue'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {stepError && step < 3 && <p className="mt-2 text-sm text-navy-500 md:hidden">{stepError}</p>}
      </div>
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-[0_1px_2px_rgba(20,19,16,0.04),0_24px_48px_-28px_rgba(20,19,16,0.18)] sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-950">{title}</h2>
      <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, help, children }: { label: string; htmlFor: string; hint?: string; help?: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-navy-800">
        {label} {help && <HelpBtn onClick={help} />}
      </label>
      {children}
      {hint && <p className="text-xs text-navy-500">{hint}</p>}
    </div>
  );
}

function HelpBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md text-navy-400 transition hover:text-steel-600" aria-label="Explain this">
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}

function Choice({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      aria-pressed={on}
      className={`relative rounded-2xl border px-3 py-3 text-left transition duration-300 ${on ? 'border-navy-950 bg-navy-950 text-white shadow-[0_12px_24px_-14px_rgba(20,19,16,0.7)]' : 'border-navy-100 bg-white text-navy-900 hover:-translate-y-0.5 hover:border-navy-300'}`}
    >
      {on && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-signal" />}
      <span className="block text-sm font-semibold">{label}</span>
      {hint && <span className={`mt-0.5 block text-[11px] leading-snug ${on ? 'text-white/55' : 'text-navy-500'}`}>{hint}</span>}
    </motion.button>
  );
}

function RupeeInput({ id, value, onChange, placeholder, compact, autoFocus }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; compact?: boolean; autoFocus?: boolean }) {
  const display = value ? new Intl.NumberFormat('en-IN').format(toNum(value)) : '';
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 ${compact ? 'text-sm' : ''}`}>₹</span>
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
        className={`vs-input tabular pl-8 ${compact ? 'py-2 text-sm' : ''}`}
      />
    </div>
  );
}

function Working({ car }: { car?: { id?: string; make?: string; model?: string; usage_type?: string | null } }) {
  const reduce = useReducedMotion();
  const lines = ['Adding up your repair bill', 'Applying depreciation for your car’s age', 'Taking off your deductible', 'Comparing with your No-Claim Bonus'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, lines.length - 1)), 220);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div className="vs-grain relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-navy-950 p-10 text-center text-white" role="status">
      <div className="relative w-full max-w-sm">
        <CarSilhouette vehicle={car} variant="line" className="w-full" />
        {!reduce && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-signal"
            initial={{ left: '0%' }}
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        )}
      </div>
      <ul className="space-y-2">
        {lines.map((l, idx) => (
          <motion.li key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: idx <= i ? 1 : 0.25, y: 0 }} className="flex items-center justify-center gap-2 font-mono text-[13px] text-white/80">
            <Check className={`h-4 w-4 ${idx < i ? 'text-signal' : 'text-white/20'}`} /> {l}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
