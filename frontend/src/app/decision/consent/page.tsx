'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, Car, Check, ClipboardCheck, Eye, EyeOff, Lock, ShieldCheck, Wrench } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';

const EASE = [0.16, 1, 0.3, 1] as const;

interface ConsentItem {
  id: string;
  vehicle_id: string;
  requesting_org_id: string;
  valid_until: string;
  created_at: string;
  organizations?: { name: string };
}

interface Org {
  id: string;
  name: string;
  type: 'GARAGE' | 'INSURER' | 'SURVEYOR' | 'FLEET_OPERATOR';
}

const KIND: Record<Org['type'], { label: string; purpose: string; Icon: typeof Wrench }> = {
  GARAGE: { label: 'Workshop', purpose: 'To prepare a repair estimate', Icon: Wrench },
  INSURER: { label: 'Insurer', purpose: 'To assess a claim', Icon: Building2 },
  SURVEYOR: { label: 'Surveyor', purpose: 'To inspect the damage', Icon: ClipboardCheck },
  FLEET_OPERATOR: { label: 'Fleet', purpose: 'To manage the vehicle', Icon: Building2 },
};

const DURATIONS = [30, 60, 90];
const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function DataPrivacyPage() {
  const reduce = useReducedMotion();
  const { vehicles, selectedVehicleId } = useVehicle();
  const [consents, setConsents] = useState<ConsentItem[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [pickedCar, setCarId] = useState('');
  const carId = pickedCar || selectedVehicleId || vehicles[0]?.id || '';
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [pickedOrg, setOrgId] = useState('');
  const [orgQuery, setOrgQuery] = useState('');
  const [days, setDays] = useState(30);
  const [now] = useState(() => Date.now());
  const [granting, setGranting] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = () =>
    apiFetch<ConsentItem[]>('/api/v1/consents')
      .then((rows) => {
        setConsents(rows);
        setLoadError(null);
      })
      .catch((e) => {
        setConsents([]);
        setLoadError(e);
      });

  useEffect(() => {
    load();
    apiFetch<Org[]>('/api/v1/organizations').then(setOrgs).catch(() => setOrgs([]));
  }, []);

  const car = vehicles.find((v) => v.id === carId);
  const shareable = (orgs || []).filter((o) => o.type !== 'FLEET_OPERATOR');
  const orgId = pickedOrg || shareable[0]?.id || '';
  const org = shareable.find((o) => o.id === orgId);
  const visibleOrgs = shareable.filter((o) => o.name.toLowerCase().includes(orgQuery.trim().toLowerCase())).slice(0, 9);
  const until = new Date(now + days * 86400000);

  const grant = async () => {
    setGranting(true);
    try {
      await apiFetch('/api/v1/consents', { method: 'POST', body: { vehicle_id: carId, requesting_org_id: orgId, valid_until: until.toISOString() } });
      toast.success(`${org?.name} can now view this car’s records until ${fmtDate(until)}.`);
      await load();
    } catch (e) {
      const { title, message } = describeApiError(e);
      toast.error(`Access was not granted: ${title}`, { description: message });
    } finally {
      setGranting(false);
    }
  };

  // Only remove from the list after the server confirms the revocation.
  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await apiFetch(`/api/v1/consents/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setConsents((c) => (c || []).filter((x) => x.id !== id));
      toast.success('Access revoked.');
    } catch (e) {
      const { title, message } = describeApiError(e);
      toast.error(`Access was NOT revoked: ${title}`, { description: message });
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  const vehicleName = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model} (${v.registration_number})` : id;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <span className="vs-chip"><Lock className="h-3.5 w-3.5 text-steel-600" /> Data & privacy</span>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Who can see your car’s records</h1>
          <p className="text-base text-navy-600">Nobody sees your records unless you allow it. Access is time-limited and you can take it back at any moment.</p>
        </header>

        {/* Grant */}
        <section className="vs-surface space-y-7 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-navy-900">Give someone access</h2>

          <div className="space-y-3">
            <p className="text-sm font-medium text-navy-800">1. Which car?</p>
            <div className="flex flex-wrap gap-2">
              {vehicles.map((v) => (
                <button key={v.id} type="button" onClick={() => setCarId(v.id)} aria-pressed={carId === v.id} className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${carId === v.id ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white text-navy-700 hover:border-navy-300'}`}>
                  <Car className="h-4 w-4" /> {v.make} {v.model}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-navy-800">2. Who should see it?</p>
              {shareable.length > 6 && <input value={orgQuery} onChange={(e) => setOrgQuery(e.target.value)} placeholder="Search by name" aria-label="Search organisations" className="vs-input max-w-xs py-2 text-sm" />}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {visibleOrgs.map((p) => {
                const k = KIND[p.type];
                const on = orgId === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setOrgId(p.id)} aria-pressed={on} className={`rounded-2xl border p-4 text-left transition ${on ? 'border-navy-900 bg-navy-900 text-white shadow-lg' : 'border-navy-100 bg-white hover:border-navy-300'}`}>
                    <k.Icon className={`h-5 w-5 ${on ? 'text-steel-300' : 'text-steel-600'}`} />
                    <p className="mt-3 text-sm font-semibold">{p.name}</p>
                    <p className={`text-xs ${on ? 'text-navy-200' : 'text-navy-500'}`}>{k.label} · {k.purpose}</p>
                    {/demo/i.test(p.name) && <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${on ? 'text-amber-200' : 'text-amber-700'}`}>Demo organisation</p>}
                  </button>
                );
              })}
              {orgs !== null && shareable.length === 0 && <p className="text-sm text-navy-500 sm:col-span-3">No workshops, insurers or surveyors have joined yet.</p>}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-navy-800">3. For how long?</p>
            <div className="inline-flex rounded-2xl bg-navy-50 p-1">
              {DURATIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className="relative rounded-xl px-5 py-2 text-sm font-semibold text-navy-700">
                  {days === d && <motion.span layoutId="duration" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative">{d} days</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl bg-steel-50/60 p-5 ring-1 ring-steel-100 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm leading-relaxed text-navy-700">
              <strong>{org?.name || 'The organisation'}</strong> will be able to view the history of your <strong>{car ? `${car.make} ${car.model}` : 'car'}</strong> until{' '}
              <strong>{fmtDate(until)}</strong>. They can’t change anything, and you can revoke this at any time.
            </p>
            <button type="button" onClick={grant} disabled={!carId || !orgId || granting} className="vs-btn-primary shrink-0">
              {granting ? 'Granting…' : 'Give access'}
            </button>
          </div>
        </section>

        {/* Active */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy-900">Current access</h2>
          {loadError != null && <ApiErrorNotice error={loadError} onRetry={load} />}
          {consents === null ? (
            <div className="vs-shimmer h-24 rounded-3xl" />
          ) : consents.length === 0 && loadError == null ? (
            <div className="vs-surface flex flex-col items-center gap-2 p-10 text-center">
              <EyeOff className="h-8 w-8 text-navy-300" />
              <p className="font-semibold text-navy-900">No one has access</p>
              <p className="text-sm text-navy-500">Your records are private.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {consents.map((c, i) => {
                  const total = Math.max(1, (new Date(c.valid_until).getTime() - new Date(c.created_at).getTime()) / 86400000);
                  const left = Math.max(0, Math.ceil((new Date(c.valid_until).getTime() - now) / 86400000));
                  const expired = left === 0;
                  return (
                    <motion.li key={c.id} layout initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0 }} transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }} className="vs-surface p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-steel-50 text-steel-700"><Eye className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-navy-900">{c.organizations?.name || 'Organisation'}</p>
                          <p className="truncate text-sm text-navy-500">Can view {vehicleName(c.vehicle_id)}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                              <motion.div className={`h-full rounded-full ${expired ? 'bg-navy-300' : left < 7 ? 'bg-loss' : 'bg-steel-500'}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (left / total) * 100)}%` }} transition={{ duration: 0.9, ease: EASE }} />
                            </div>
                            <span className="shrink-0 text-xs text-navy-500">{expired ? 'Expired' : `${left} days left · until ${fmtDate(c.valid_until)}`}</span>
                          </div>
                        </div>
                        {confirmRevoke === c.id ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm text-navy-600">Revoke access?</span>
                            <button type="button" onClick={() => revoke(c.id)} disabled={revoking === c.id} className="rounded-xl bg-loss px-3 py-2 text-sm font-semibold text-white">{revoking === c.id ? 'Revoking…' : 'Yes, revoke'}</button>
                            <button type="button" onClick={() => setConfirmRevoke(null)} className="rounded-xl px-3 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50">Cancel</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmRevoke(c.id)} className="vs-btn-secondary shrink-0 py-2 text-loss">Revoke</button>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </section>

        <section className="vs-surface grid gap-5 p-6 sm:grid-cols-3">
          {[
            { Icon: Eye, title: 'What they see', body: 'The car’s ClearClaim history: policy details on file, saved claim checks and their ledger status.' },
            { Icon: ShieldCheck, title: 'What they can’t do', body: 'Change your records, see your other cars, or keep access after it expires or you revoke it.' },
            { Icon: Check, title: 'Every change is logged', body: 'Granting and revoking are recorded in an audit log, following DPDP-aligned consent principles.' },
          ].map((x) => (
            <div key={x.title}>
              <x.Icon className="h-5 w-5 text-steel-600" />
              <p className="mt-2 font-semibold text-navy-900">{x.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-600">{x.body}</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
