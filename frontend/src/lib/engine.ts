/**
 * In-browser port of the deterministic claim engine
 * (backend/services/financial_engine/calculator.py).
 *
 * Runs instantly on the user's device with no server round-trip. It must stay
 * numerically identical to the Python engine: `npm run test:engine` checks it
 * against golden vectors generated from Python
 * (backend/scripts/make_engine_golden.py). Change both together.
 */

export type EngineCategory = 'metal' | 'plastic' | 'rubber' | 'nylon' | 'glass' | 'fiberglass' | 'consumables' | 'labour';

export interface EngineInput {
  vehicle: { age_years: number };
  policy: {
    idv: number;
    deductible: number;
    ncb_percentage: number;
    zero_depreciation_addon: boolean;
    rule_version?: string;
  };
  repair_items: { category: EngineCategory | string; cost: number }[];
  estimated_base_premium_next_year: number;
}

export interface EngineOutput {
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
  sensitivity_analysis: { repair_cost: number; recommendation: string }[];
}

export const RULE_VERSION = 'MOTOR_INDIA_2026_V1';
const NCB_SLABS = [0, 20, 25, 35, 45, 50];

/** Metal-part depreciation by vehicle age (India Motor Tariff GR.8 schedule). */
export function metalDepreciation(age: number): number {
  if (age <= 0.5) return 0.0;
  if (age <= 1.0) return 0.05;
  if (age <= 2.0) return 0.1;
  if (age <= 3.0) return 0.15;
  if (age <= 4.0) return 0.25;
  if (age <= 5.0) return 0.35;
  if (age <= 10.0) return 0.4;
  return 0.5;
}

export function nextNcb(current: number, claimed: boolean): number {
  if (claimed) return 0;
  const idx = NCB_SLABS.indexOf(current);
  if (idx === -1) return 0;
  return NCB_SLABS[Math.min(idx + 1, NCB_SLABS.length - 1)];
}

/** Depreciation deducted from one repair line (same rules as the Python engine). */
export function lineDepreciation(category: string, cost: number, age: number, zeroDep: boolean): number {
  if (category === 'labour' || category === 'glass') return 0;
  if (zeroDep && category !== 'consumables') return 0;
  if (category === 'plastic' || category === 'rubber' || category === 'nylon' || category === 'consumables') return cost * 0.5;
  if (category === 'fiberglass') return cost * 0.3;
  if (category === 'metal') return cost * metalDepreciation(age);
  return 0;
}

function simulate3Years(base: number, currentNcb: number) {
  const out: EngineOutput['simulation_3_year'] = [];
  let claimNcb = 0;
  let selfNcb = currentNcb;
  for (let year = 1; year <= 3; year++) {
    const claimPremium = base - base * (claimNcb / 100);
    selfNcb = nextNcb(selfNcb, false);
    const selfPremium = base - base * (selfNcb / 100);
    out.push({ year, claim_ncb: claimNcb, self_pay_ncb: selfNcb, claim_premium: claimPremium, self_pay_premium: selfPremium, difference: claimPremium - selfPremium });
    claimNcb = nextNcb(claimNcb, false);
  }
  return out;
}

/**
 * Matches Python's f"{x:,.2f}" exactly: rounds the exact binary value of the
 * number (toFixed(60) yields its full decimal expansion), with exact ties going
 * to the even digit, as Python does.
 */
function roundHalfEven2(abs: number): string {
  const [int, frac = ''] = abs.toFixed(60).split('.');
  const kept = frac.slice(0, 2);
  const rest = frac.slice(2);
  const restDigits = rest.replace(/0+$/, '');
  let cents = BigInt(int) * BigInt(100) + BigInt(kept);
  const roundUp = rest[0] > '5' || (rest[0] === '5' && (restDigits.length > 1 || Number(kept[1]) % 2 === 1));
  if (roundUp) cents += BigInt(1);
  const s = cents.toString().padStart(3, '0');
  return `${s.slice(0, -2)}.${s.slice(-2)}`;
}

const fmt2 = (n: number) => {
  const [int, frac] = roundHalfEven2(Math.abs(n)).split('.');
  return `₹${n < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${frac}`;
};

function recommend(saving: number): EngineOutput['recommendation'] {
  if (saving > 2000) return 'CLAIM';
  if (saving < -1000) return 'SELF-PAY';
  return 'BORDERLINE';
}

export function calculateDecision(input: EngineInput): EngineOutput {
  const { vehicle, policy, repair_items: items, estimated_base_premium_next_year: base } = input;
  const total = items.reduce((s, i) => s + i.cost, 0);
  let dep = 0;
  for (const i of items) dep += lineDepreciation(i.category, i.cost, vehicle.age_years, policy.zero_depreciation_addon);

  const admissible = total - dep;
  const deductible = Math.min(policy.deductible, admissible);
  let payout = admissible - deductible;
  if (payout > policy.idv) payout = policy.idv;
  payout = Math.max(0, payout);

  const outOfPocket = total - payout;
  const futureImpact = base * (nextNcb(policy.ncb_percentage, false) / 100) - base * (0 / 100);
  const effectiveClaimCost = outOfPocket + futureImpact;
  const saving = total - effectiveClaimCost;
  const recommendation = recommend(saving);

  const avgDep = total > 0 ? dep / total : 0;
  const breakEven = avgDep >= 1 ? Infinity : (policy.deductible + futureImpact) / (1 - avgDep);

  const explanations: string[] = [];
  if (policy.zero_depreciation_addon) explanations.push('Zero depreciation cover applies, significantly increasing payout for parts.');
  if (dep > 0) explanations.push(`Depreciation reduced payout by ${fmt2(dep)}.`);
  if (deductible > 0) explanations.push(`Standard compulsory deductible of ${fmt2(deductible)} applies.`);
  if (payout >= policy.idv) explanations.push('Policy limit (IDV) reached.');
  if (futureImpact > 0) explanations.push(`Making a claim drops next year's NCB to 0%, costing an estimated ${fmt2(futureImpact)}.`);
  if (recommendation === 'CLAIM') explanations.push('The repair amount is above the break-even threshold.');
  else if (recommendation === 'SELF-PAY') explanations.push('The estimated future premium impact and immediate costs outweigh the claim payout.');
  else explanations.push('The difference is marginal; consider self-paying to preserve a clean claim history.');

  const sensitivity = [5000, 15000, 30000, 50000, 100000].map((cost) => {
    const testPayout = Math.max(0, Math.min(cost - cost * avgDep - policy.deductible, policy.idv));
    const testEffective = cost - testPayout + futureImpact;
    return { repair_cost: cost, recommendation: recommend(cost - testEffective) };
  });

  return {
    rule_version: policy.rule_version || RULE_VERSION,
    total_estimate: total,
    admissible_amount: admissible,
    depreciation_deduction: dep,
    deductible_deduction: deductible,
    estimated_payout: payout,
    immediate_out_of_pocket: outOfPocket,
    future_ncb_impact: futureImpact,
    effective_claim_cost: effectiveClaimCost,
    self_pay_cost: total,
    estimated_saving: saving,
    recommendation,
    break_even_threshold: breakEven,
    explanations,
    simulation_3_year: simulate3Years(base, policy.ncb_percentage),
    sensitivity_analysis: sensitivity,
  };
}
