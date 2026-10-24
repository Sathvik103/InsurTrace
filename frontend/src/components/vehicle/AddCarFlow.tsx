'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Car, Check, FileSearch, HelpCircle, Scale, Truck } from 'lucide-react';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAssistant } from '@/context/AssistantContext';
import { NCB_STEPS, rupees } from '@/lib/claimCheck';
import { BODY_LABEL, bodyTypeOf } from '@/lib/bodyType';
import { CarSilhouette } from './CarSilhouette';

const EASE = [0.16, 1, 0.3, 1] as const;
const MAKES = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda', 'MG', 'Skoda', 'Volkswagen', 'Renault', 'Nissan'];
const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const YEAR = new Date().getFullYear();

const digits = (s: string) => s.replace(/[^\d]/g, '');
const fmtPlate = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

export function AddCarFlow() {
  const reduce = useReducedMotion();
  const { addVehicle, setSelectedVehicleId } = useVehicle();
  const { open } = useAssistant();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Vehicle | null>(null);

  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('Petrol');
  const [commercial, setCommercial] = useState(false);
  const [downtime, setDowntime] = useState('');
  const previewType = bodyTypeOf({ make, model, usage_type: commercial ? 'GOODS_CARRIER' : 'PERSONAL' });

  const [skipPolicy, setSkipPolicy] = useState(false);
  const [idv, setIdv] = useState('');
  const [ncb, setNcb] = useState<number | null>(null);
  const [zeroDep, setZeroDep] = useState<boolean | null>(null);
  const [policyNo, setPolicyNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [premium, setPremium] = useState('');

  const carError =
    reg.length < 6 ? 'Enter the registration number from your number plate.' : !make ? 'Choose the make.' : !model.trim() ? 'Enter the model.' : !(Number(year) >= 1980 && Number(year) <= YEAR + 1) ? 'Enter the year it was made.' : null;
  const policyError = skipPolicy ? null : !Number(idv) ? 'Enter the IDV, or choose “I’ll add this later”.' : ncb === null ? 'Choose your No-Claim Bonus.' : zeroDep === null ? 'Tell us about zero-dep cover.' : null;

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const save = async () => {
    setSaving(true);
    try {
      const v = await addVehicle({
        registration_number: reg,
        make,
        model: model.trim(),
        manufacture_year: Number(year),
        fuel_type: fuel,
        usage_type: commercial ? 'OTHER_COMMERCIAL' : 'PERSONAL',
        downtime_cost_per_day: commercial && Number(downtime) ? Number(downtime) : undefined,
        is_demo: false,
        ...(skipPolicy
          ? {}
          : { idv: Number(idv), ncb_percentage: ncb ?? undefined, has_zero_dep: !!zeroDep, policy_number: policyNo.trim() || undefined, policy_expiry: expiry || undefined, od_premium: Number(premium) || undefined }),
      });
      setSelectedVehicleId(v.id);
      setSaved(v);
      go(2);
    } catch {
      /* addVehicle already explained the problem (e.g. duplicate registration) */
    } finally {
      setSaving(false);
    }
  };

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -d * 40 }),
  };

  return (
    <div className="mx-auto max-w-2xl">
      {step < 2 && (
        <header className="mb-8 space-y-4">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-navy-950 sm:text-5xl">{step === 0 ? 'Add your car' : 'Your policy details'}</h1>
          <p className="text-navy-600">{step === 0 ? 'It takes about a minute. You can change anything later.' : 'These make every claim check accurate. They’re on the first page of your policy.'}</p>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-1.5 overflow-hidden rounded-full bg-navy-100">
                <motion.div className="h-full rounded-full bg-navy-950" initial={false} animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.5, ease: EASE }} />
              </div>
            ))}
          </div>
        </header>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: EASE }}>
          {step === 0 && (
            <section className="vs-surface space-y-6 p-6 sm:p-8">
              {/* Live preview: the drawing follows the model typed below */}
              <div className="rounded-[22px] bg-[#f6f5f0] px-6 pb-2 pt-4">
                <AnimatePresence mode="wait">
                  <motion.div key={previewType} initial={reduce ? false : { opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.4, ease: EASE }}>
                    <CarSilhouette type={previewType} vehicle={{ id: reg || 'new', make, model }} className="mx-auto h-28 w-full max-w-md" />
                  </motion.div>
                </AnimatePresence>
                <p className="pb-2 text-center text-xs text-navy-500">{model.trim() ? `Looks like a ${BODY_LABEL[previewType].toLowerCase()}` : 'Type the model and the drawing follows'}</p>
              </div>
              {/* Number plate preview */}
              <div className="flex justify-center">
                <motion.div layout className="flex items-stretch overflow-hidden rounded-xl border-2 border-navy-900 bg-white shadow-md">
                  <span className="flex w-8 flex-col items-center justify-center bg-steel-700 text-[9px] font-bold text-white">IND</span>
                  <span className="min-w-[220px] px-5 py-2.5 text-center font-mono text-2xl font-bold tracking-[0.12em] text-navy-950">
                    {reg ? reg.replace(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{0,4})$/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' ')) : 'KA 01 AB 1234'}
                  </span>
                </motion.div>
              </div>
              <div>
                <label htmlFor="reg" className="text-sm font-medium text-navy-800">Registration number</label>
                <input id="reg" value={reg} onChange={(e) => setReg(fmtPlate(e.target.value))} placeholder="e.g. KA01AB1234" className="vs-input mt-1.5 font-mono uppercase tracking-wider" autoComplete="off" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-800">Make</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MAKES.map((m) => (
                    <button key={m} type="button" onClick={() => setMake(m)} aria-pressed={make === m} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${make === m ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white text-navy-700 hover:border-navy-300'}`}>
                      {m}
                    </button>
                  ))}
                  <input value={MAKES.includes(make) ? '' : make} onChange={(e) => setMake(e.target.value)} placeholder="Other…" className="w-32 rounded-full border border-navy-100 px-3.5 py-1.5 text-sm focus:border-steel-500 focus:outline-none" aria-label="Other make" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="model" className="text-sm font-medium text-navy-800">Model</label>
                  <input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Baleno" className="vs-input mt-1.5" />
                </div>
                <div>
                  <label htmlFor="year" className="text-sm font-medium text-navy-800">Year made</label>
                  <input id="year" value={year} onChange={(e) => setYear(digits(e.target.value).slice(0, 4))} inputMode="numeric" placeholder={`e.g. ${YEAR - 3}`} className="vs-input mt-1.5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-800">Fuel</p>
                <div className="mt-2 inline-flex flex-wrap rounded-2xl bg-navy-50 p-1">
                  {FUELS.map((f) => (
                    <button key={f} type="button" onClick={() => setFuel(f)} className="relative rounded-xl px-3.5 py-1.5 text-sm font-medium text-navy-700">
                      {fuel === f && <motion.span layoutId="fuel" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                      <span className="relative">{f}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[false, true].map((c) => (
                  <button key={String(c)} type="button" onClick={() => setCommercial(c)} aria-pressed={commercial === c} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${commercial === c ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white hover:border-navy-300'}`}>
                    {c ? <Truck className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                    <span>
                      <span className="block text-sm font-semibold">{c ? 'Commercial vehicle' : 'Personal car'}</span>
                      <span className={`block text-xs ${commercial === c ? 'text-navy-200' : 'text-navy-500'}`}>{c ? 'Taxi, delivery or fleet' : 'For you and your family'}</span>
                    </span>
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {commercial && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <label htmlFor="downtime" className="text-sm font-medium text-navy-800">What does a day off the road cost you? (optional)</label>
                    <input id="downtime" value={downtime} onChange={(e) => setDowntime(digits(e.target.value))} inputMode="numeric" placeholder="e.g. 2500" className="vs-input mt-1.5" />
                    <p className="mt-1 text-xs text-navy-500">Used only in your fleet view to estimate downtime cost. We never assume a value.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {step === 1 && (
            <section className="vs-surface space-y-6 p-6 sm:p-8">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-navy-50 p-4 text-sm">
                <input type="checkbox" checked={skipPolicy} onChange={(e) => setSkipPolicy(e.target.checked)} className="h-4 w-4 accent-navy-900" />
                <span><span className="font-semibold text-navy-900">I’ll add this later.</span> <span className="text-navy-600">You’ll be asked during a claim check instead.</span></span>
              </label>
              <fieldset disabled={skipPolicy} className={`space-y-6 transition ${skipPolicy ? 'opacity-40' : ''}`}>
                <div>
                  <label htmlFor="idv" className="flex items-center gap-2 text-sm font-medium text-navy-800">IDV (Insured Declared Value) <button type="button" onClick={() => open('What is IDV?')} aria-label="What is IDV?" className="text-navy-400 hover:text-steel-600"><HelpCircle className="h-4 w-4" /></button></label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-400">₹</span>
                    <input id="idv" value={idv ? new Intl.NumberFormat('en-IN').format(Number(idv)) : ''} onChange={(e) => setIdv(digits(e.target.value).slice(0, 9))} inputMode="numeric" placeholder="e.g. 6,85,000" className="vs-input tabular pl-8" />
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-navy-800">No-Claim Bonus <button type="button" onClick={() => open('How does No-Claim Bonus (NCB) work?')} aria-label="What is NCB?" className="text-navy-400 hover:text-steel-600"><HelpCircle className="h-4 w-4" /></button></p>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {NCB_STEPS.map((n) => (
                      <button key={n} type="button" onClick={() => setNcb(n)} aria-pressed={ncb === n} className={`rounded-xl py-2 text-sm font-semibold transition ${ncb === n ? 'bg-navy-900 text-white' : 'bg-white text-navy-700 ring-1 ring-navy-100 hover:ring-navy-300'}`}>{n}%</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-navy-800">Zero-depreciation cover? <button type="button" onClick={() => open('What is zero depreciation cover?')} aria-label="What is zero-dep?" className="text-navy-400 hover:text-steel-600"><HelpCircle className="h-4 w-4" /></button></p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[true, false].map((z) => (
                      <button key={String(z)} type="button" onClick={() => setZeroDep(z)} aria-pressed={zeroDep === z} className={`rounded-2xl border py-3 text-sm font-semibold transition ${zeroDep === z ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white text-navy-800 hover:border-navy-300'}`}>{z ? 'Yes' : 'No / not sure'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="odp" className="flex items-center gap-2 text-sm font-medium text-navy-800">Renewal premium, own damage (optional) <button type="button" onClick={() => open('What should I enter as next year’s premium?')} aria-label="Which premium?" className="text-navy-400 hover:text-steel-600"><HelpCircle className="h-4 w-4" /></button></label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-400">₹</span>
                    <input id="odp" value={premium ? new Intl.NumberFormat('en-IN').format(Number(premium)) : ''} onChange={(e) => setPremium(digits(e.target.value).slice(0, 8))} inputMode="numeric" placeholder="e.g. 15,200" className="vs-input tabular pl-8" />
                  </div>
                  <p className="mt-1 text-xs text-navy-500">Lets us price your No-Claim Bonus without asking each time.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pno" className="text-sm font-medium text-navy-800">Policy number (optional)</label>
                    <input id="pno" value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} className="vs-input mt-1.5" />
                  </div>
                  <div>
                    <label htmlFor="exp" className="text-sm font-medium text-navy-800">Renewal date (optional)</label>
                    <input id="exp" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="vs-input mt-1.5" />
                  </div>
                </div>
              </fieldset>
              <Link href="/decision/extract" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-700 hover:underline"><FileSearch className="h-4 w-4" /> Read these from my policy PDF instead</Link>
            </section>
          )}

          {step === 2 && saved && (
            <section className="vs-surface flex flex-col items-center gap-6 p-10 text-center">
              <div className="relative w-full max-w-sm">
                <motion.div initial={reduce ? false : { x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, ease: EASE }}>
                  <CarSilhouette vehicle={saved} className="w-full" />
                </motion.div>
                <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 360, damping: 16 }} className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full bg-signal text-navy-950 shadow-lg">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </motion.span>
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-950">{saved.make} {saved.model} added</h1>
                <p className="text-navy-600">
                  {saved.registration_number}
                  {saved.idv ? ` · IDV ${rupees(saved.idv)}` : ''}
                  {saved.is_local_only ? ' · saved in this browser only' : ''}
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Link href={`/decision?vehicle_id=${encodeURIComponent(saved.id)}`} className="vs-btn-primary py-3.5"><Scale className="h-4 w-4" /> Check a claim</Link>
                <Link href="/vehicles" className="vs-btn-secondary py-3.5">Go to my cars</Link>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 2 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? <button type="button" onClick={() => go(0)} className="vs-btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</button> : <span />}
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-navy-500 md:block">{step === 0 ? carError : policyError}</p>
            {step === 0 ? (
              <button type="button" disabled={!!carError} onClick={() => go(1)} className="vs-btn-primary">Continue <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" disabled={!!policyError || saving} onClick={save} className="vs-btn-primary">{saving ? 'Saving…' : 'Save my car'} <Check className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
