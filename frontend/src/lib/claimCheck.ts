/**
 * Claim-check domain model shared by the guided flow, the homepage preview and
 * the assistant. All money figures come from the deterministic backend engine
 * (POST /api/v1/financial/analyze-claim); this module only shapes inputs and
 * turns the engine's output into plain language. It never invents numbers.
 */

import { apiFetch } from '@/lib/api';

export type PartCategory = 'metal' | 'plastic' | 'glass' | 'fiberglass' | 'labour';

export interface DamagePart {
  id: string;
  label: string;
  hint: string;
  category: PartCategory;
  /** Position on the car diagram (percent of width/height, top view). */
  x: number;
  y: number;
}

/** Common damaged parts, mapped to the depreciation category the engine applies. */
export const DAMAGE_PARTS: DamagePart[] = [
  { id: 'front_bumper', label: 'Front bumper', hint: 'Plastic part', category: 'plastic', x: 50, y: 7 },
  { id: 'headlights', label: 'Headlight', hint: 'Plastic housing', category: 'plastic', x: 26, y: 12 },
  { id: 'bonnet', label: 'Bonnet', hint: 'Metal panel', category: 'metal', x: 50, y: 22 },
  { id: 'windshield', label: 'Windshield', hint: 'Glass', category: 'glass', x: 50, y: 36 },
  { id: 'front_door', label: 'Front door', hint: 'Metal panel', category: 'metal', x: 17, y: 46 },
  { id: 'rear_door', label: 'Rear door', hint: 'Metal panel', category: 'metal', x: 17, y: 62 },
  { id: 'side_mirror', label: 'Side mirror', hint: 'Plastic part', category: 'plastic', x: 85, y: 40 },
  { id: 'fender', label: 'Fender / quarter panel', hint: 'Metal panel', category: 'metal', x: 83, y: 74 },
  { id: 'boot', label: 'Boot / tailgate', hint: 'Metal panel', category: 'metal', x: 50, y: 84 },
  { id: 'rear_bumper', label: 'Rear bumper', hint: 'Plastic part', category: 'plastic', x: 50, y: 94 },
  { id: 'labour', label: 'Labour & painting', hint: 'Workshop charges', category: 'labour', x: -1, y: -1 },
];

export const NCB_STEPS = [0, 20, 25, 35, 45, 50] as const;

export interface PolicyInputs {
  vehicleAgeYears: number;
  idv: number;
  deductible: number;
  ncbPercentage: number;
  zeroDep: boolean;
  nextYearPremium: number;
}

export interface EngineResult {
  rule_version: string;
  total_estimate: number;
  admissible_amount: number;
  depreciation_deduction: number;
  deductible_deduction: number;
  estimated_payout: number;
  immediate_out_of_pocket: number;
  future_ncb_impact: number;
  effective_claim_cost: number;
  self_pay_cost: number;
  estimated_saving: number;
  recommendation: 'CLAIM' | 'SELF-PAY' | 'BORDERLINE';
  break_even_threshold: number;
  explanations: string[];
  simulation_3_year: {
    year: number;
    claim_ncb: number;
    self_pay_ncb: number;
    claim_premium: number;
    self_pay_premium: number;
    difference: number;
  }[];
}

export interface RepairLine {
  category: PartCategory;
  cost: number;
}

export async function analyzeClaim(policy: PolicyInputs, items: RepairLine[], signal?: AbortSignal): Promise<EngineResult> {
  return apiFetch<EngineResult>('/api/v1/financial/analyze-claim', {
    method: 'POST',
    anonymous: true,
    signal,
    timeoutMs: 60000,
    body: {
      vehicle: { age_years: Math.max(0, policy.vehicleAgeYears) },
      policy: {
        idv: policy.idv,
        deductible: policy.deductible,
        ncb_percentage: policy.ncbPercentage,
        zero_depreciation_addon: policy.zeroDep,
        policy_start_date: new Date().toISOString().split('T')[0],
        rule_version: 'MOTOR_INDIA_2026_V1',
      },
      repair_items: items.filter((i) => i.cost > 0),
      estimated_base_premium_next_year: policy.nextYearPremium,
    },
  });
}

/** Extra premium you would pay over the 3 simulated years if you claim (from the engine's simulation). */
export function threeYearPremiumImpact(r: EngineResult): number {
  return r.simulation_3_year.reduce((sum, y) => sum + Math.max(0, y.difference), 0);
}

export interface Verdict {
  tone: 'claim' | 'selfpay' | 'close';
  headline: string;
  summary: string;
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const rupees = (n: number) => `₹${inr.format(Math.round(Math.max(0, n)))}`;

/** Plain-language verdict derived strictly from engine output. */
export function verdictFor(r: EngineResult): Verdict {
  const saving = Math.abs(r.estimated_saving);
  if (r.recommendation === 'CLAIM') {
    return {
      tone: 'claim',
      headline: 'Claiming looks better for you',
      summary: `Claiming is estimated to leave you about ${rupees(saving)} better off than paying for the repair yourself, even after losing your No-Claim Bonus next year.`,
    };
  }
  if (r.recommendation === 'SELF-PAY') {
    return {
      tone: 'selfpay',
      headline: 'Paying yourself looks better',
      summary: `Paying the workshop yourself is estimated to cost about ${rupees(saving)} less than claiming, because claiming would cost you your No-Claim Bonus discount.`,
    };
  }
  return {
    tone: 'close',
    headline: 'It’s close: both options cost about the same',
    summary: `The difference is only about ${rupees(saving)}. Many people pay small repairs themselves to keep a clean claim history, but either choice is reasonable.`,
  };
}

/** Step-by-step reasoning, each line traceable to an engine figure. */
export function reasoningSteps(r: EngineResult, p: PolicyInputs) {
  return [
    {
      label: 'Total repair bill',
      amount: r.total_estimate,
      kind: 'base' as const,
      detail: 'The sum of the repair costs you entered.',
    },
    {
      label: 'Depreciation on parts',
      amount: -r.depreciation_deduction,
      kind: 'minus' as const,
      detail: p.zeroDep
        ? 'You have zero-depreciation cover, so most parts are paid in full. Consumables may still be deducted.'
        : `Insurers pay less for parts on a ${p.vehicleAgeYears}-year-old car: metal parts lose value with age, plastic and rubber parts are reduced by 50%, glass and labour are not reduced.`,
    },
    {
      label: 'Your deductible',
      amount: -r.deductible_deduction,
      kind: 'minus' as const,
      detail: 'The fixed amount you always pay yourself on every claim (the “compulsory excess”).',
    },
    {
      label: 'Insurer would pay (estimate)',
      amount: r.estimated_payout,
      kind: 'result' as const,
      detail: 'What your insurer could pay after these rules. The insurer and surveyor make the final decision.',
    },
  ];
}
