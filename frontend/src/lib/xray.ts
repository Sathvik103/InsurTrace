/**
 * Repair-quote X-ray: splits every line of a workshop quote into what the
 * insurer would pay and what the owner pays, using the same deterministic
 * rules as the claim engine (lib/engine.ts). Runs on-device.
 */

import { calculateDecision, lineDepreciation, metalDepreciation, RULE_VERSION } from '@/lib/engine';

export type XCategory = 'metal' | 'plastic' | 'glass' | 'fiberglass' | 'labour' | 'consumables';

export interface XLine {
  id: string;
  label: string;
  category: XCategory;
  cost: number;
}

export interface XPolicy {
  ageYears: number;
  deductible: number;
  zeroDep: boolean;
  idv: number;
}

export interface XLineResult extends XLine {
  depreciation: number;
  depRate: number;
  insurerShare: number;
  tip?: string;
}

export interface XRayResult {
  lines: XLineResult[];
  total: number;
  depreciation: number;
  deductible: number;
  insurerPays: number;
  youPay: number;
  idvCapped: boolean;
  /** What the owner would pay with zero-depreciation cover (undefined if they already have it). */
  youPayWithZeroDep?: number;
}

export const CATEGORY_LABEL: Record<XCategory, string> = {
  metal: 'Metal part',
  plastic: 'Plastic / rubber',
  glass: 'Glass',
  fiberglass: 'Fibreglass',
  labour: 'Labour / paint',
  consumables: 'Consumables',
};

function tipFor(line: XLine, rate: number, policy: XPolicy): string | undefined {
  if (line.cost <= 0) return undefined;
  if (line.category === 'glass') return 'Glass isn’t depreciated, so the insurer would cover this line in full (before the deductible).';
  if (line.category === 'labour') return 'Labour isn’t depreciated, so the insurer would cover this line in full (before the deductible).';
  if (line.category === 'consumables') return 'Consumables (oil, clips, nuts and bolts) lose 50% even with zero-dep cover.';
  if (policy.zeroDep) return undefined;
  if (line.category === 'plastic')
    return 'Plastic parts lose 50% on replacement. Ask the workshop whether it can be repaired instead: repair work is mostly labour, which isn’t depreciated.';
  if (line.category === 'fiberglass') return 'Fibreglass parts lose 30% on replacement.';
  if (line.category === 'metal' && rate > 0)
    return `Metal parts on a ${policy.ageYears}-year-old car lose ${Math.round(rate * 100)}% on replacement. A repair rather than replacement may cost you less.`;
  return undefined;
}

function totals(lines: XLine[], policy: XPolicy, zeroDep: boolean) {
  const r = calculateDecision({
    vehicle: { age_years: policy.ageYears },
    policy: { idv: policy.idv, deductible: policy.deductible, ncb_percentage: 0, zero_depreciation_addon: zeroDep, rule_version: RULE_VERSION },
    repair_items: lines.filter((l) => l.cost > 0).map((l) => ({ category: l.category, cost: l.cost })),
    estimated_base_premium_next_year: 0,
  });
  return r;
}

export function xray(lines: XLine[], policy: XPolicy): XRayResult {
  const r = totals(lines, policy, policy.zeroDep);
  const results: XLineResult[] = lines.map((l) => {
    const dep = lineDepreciation(l.category, l.cost, policy.ageYears, policy.zeroDep);
    const rate = l.cost > 0 ? dep / l.cost : l.category === 'metal' && !policy.zeroDep ? metalDepreciation(policy.ageYears) : 0;
    return { ...l, depreciation: dep, depRate: rate, insurerShare: Math.max(0, l.cost - dep), tip: tipFor(l, rate, policy) };
  });
  const out: XRayResult = {
    lines: results,
    total: r.total_estimate,
    depreciation: r.depreciation_deduction,
    deductible: r.deductible_deduction,
    insurerPays: r.estimated_payout,
    youPay: r.immediate_out_of_pocket,
    idvCapped: r.estimated_payout >= policy.idv && r.total_estimate > 0,
  };
  if (!policy.zeroDep && r.total_estimate > 0) out.youPayWithZeroDep = totals(lines, policy, true).immediate_out_of_pocket;
  return out;
}

let seq = 0;
export const newLine = (label = '', category: XCategory = 'metal', cost = 0): XLine => ({ id: `l${Date.now().toString(36)}${seq++}`, label, category, cost });

/** The fictional sample quote used on the public X-ray page. */
export const SAMPLE_QUOTE: Omit<XLine, 'id'>[] = [
  { label: 'Front bumper (replace)', category: 'plastic', cost: 14800 },
  { label: 'Headlamp assembly LH', category: 'plastic', cost: 9600 },
  { label: 'Bonnet panel (replace)', category: 'metal', cost: 21500 },
  { label: 'Windshield glass', category: 'glass', cost: 11200 },
  { label: 'Labour and paint', category: 'labour', cost: 7400 },
];
