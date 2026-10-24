'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Printer, RotateCcw } from 'lucide-react';
import { OrgShell } from '@/components/org/OrgShell';
import { XRay } from '@/components/xray/XRay';
import { newLine, xray, XLine, XPolicy, CATEGORY_LABEL } from '@/lib/xray';
import { loadLocal } from '@/lib/fleet';
import { rupees } from '@/lib/claimCheck';
import { BrandLogo } from '@/components/brand/Logo';

const DRAFT = 'cc_workshop_estimate';

interface Draft {
  customer: string;
  registration: string;
  vehicle: string;
  lines: XLine[];
  policy: XPolicy;
}

const blank = (): Draft => ({
  customer: '',
  registration: '',
  vehicle: '',
  lines: [newLine('', 'plastic'), newLine('Labour and paint', 'labour')],
  policy: { ageYears: 3, deductible: 1000, zeroDep: false, idv: 600000 },
});

export default function WorkshopEstimatesPage() {
  const [d, setD] = useState<Draft>(() => loadLocal<Draft>(DRAFT, blank()));
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT, JSON.stringify(d));
    } catch {}
  }, [d]);
  const r = useMemo(() => xray(d.lines, d.policy), [d.lines, d.policy]);
  const [today] = useState(() => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));

  const summary = () =>
    [
      `Repair estimate${d.registration ? ` for ${d.registration}` : ''}${d.vehicle ? ` (${d.vehicle})` : ''}`,
      ...r.lines.filter((l) => l.cost > 0).map((l) => `- ${l.label || CATEGORY_LABEL[l.category]}: ${rupees(l.cost)} (insurer ~${rupees(l.insurerShare)}, you ~${rupees(l.depreciation)})`),
      `Total: ${rupees(r.total)}. If claimed, the insurer may pay about ${rupees(r.insurerPays)} and you about ${rupees(r.youPay)} (incl. ${rupees(r.deductible)} deductible).`,
      'Estimate by ClearClaim using standard depreciation rules. The insurer and surveyor decide the final settlement.',
    ].join('\n');

  return (
    <OrgShell
      title="Estimates"
      subtitle="Build a quote and show the customer, before they claim, exactly what their insurer is likely to cover and what they will pay."
      actions={
        <>
          <button type="button" onClick={() => setD(blank())} className="vs-btn-secondary py-2.5"><RotateCcw className="h-4 w-4" /> New</button>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(summary()); toast.success('Summary copied. Paste it into WhatsApp or email.'); }} className="vs-btn-secondary py-2.5"><Copy className="h-4 w-4" /> Copy summary</button>
          <button type="button" onClick={() => window.print()} className="vs-btn-primary py-2.5"><Printer className="h-4 w-4" /> Print for customer</button>
        </>
      }
    >
      <div className="space-y-5 print:hidden">
        <section className="grid gap-4 rounded-2xl border border-navy-100 bg-white p-5 sm:grid-cols-3">
          {([
            ['customer', 'Customer name'],
            ['registration', 'Registration'],
            ['vehicle', 'Vehicle (make & model)'],
          ] as const).map(([k, label]) => (
            <label key={k} className="text-sm font-medium text-navy-800">
              {label}
              <input value={d[k]} onChange={(e) => setD({ ...d, [k]: k === 'registration' ? e.target.value.toUpperCase() : e.target.value })} className="vs-input mt-1.5 py-2.5 text-sm" />
            </label>
          ))}
        </section>
        <XRay lines={d.lines} onLinesChange={(lines) => setD({ ...d, lines })} policy={d.policy} onPolicyChange={(policy) => setD({ ...d, policy })} />
        <p className="text-xs text-navy-500">Drafts are kept on this device.</p>
      </div>

      {/* Print view */}
      <article className="hidden print:block">
        <div className="flex items-center justify-between border-b border-navy-200 pb-4">
          <BrandLogo size="sm" />
          <p className="text-sm">{today}</p>
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Repair estimate{d.registration ? ` · ${d.registration}` : ''}</h2>
        <p className="text-sm">{[d.customer, d.vehicle].filter(Boolean).join(' · ')}</p>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b text-left"><th className="py-2">Item</th><th>Material</th><th className="text-right">Cost</th><th className="text-right">Insurer (est.)</th><th className="text-right">You (est.)</th></tr></thead>
          <tbody>
            {r.lines.filter((l) => l.cost > 0).map((l) => (
              <tr key={l.id} className="border-b"><td className="py-2">{l.label || 'Item'}</td><td>{CATEGORY_LABEL[l.category]}</td><td className="text-right">{rupees(l.cost)}</td><td className="text-right">{rupees(l.insurerShare)}</td><td className="text-right">{rupees(l.depreciation)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 space-y-1 text-sm">
          <p>Total quote: <strong>{rupees(r.total)}</strong></p>
          <p>If claimed, insurer may pay about <strong>{rupees(r.insurerPays)}</strong>; you would pay about <strong>{rupees(r.youPay)}</strong> (including {rupees(r.deductible)} deductible).</p>
        </div>
        <p className="mt-8 text-xs">Estimate prepared with ClearClaim using the standard depreciation schedule. It is not an insurer decision; the insurer and surveyor decide the final settlement. Claiming may also reduce your No-Claim Bonus.</p>
      </article>
    </OrgShell>
  );
}
