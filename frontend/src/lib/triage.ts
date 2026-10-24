/**
 * Fleet claim triage. For every vehicle with incidents, finds which incidents
 * to claim and which to pay directly so the fleet's total cost is lowest.
 *
 * Why this is better than deciding each incident alone: No-Claim Bonus is lost
 * once per vehicle per policy year, however many claims are made. If one
 * incident on a vehicle is already worth claiming, a second incident on the
 * same vehicle no longer carries an NCB cost. Per vehicle we therefore
 * evaluate every claim/pay combination (exhaustively up to 12 incidents).
 *
 * All money figures come from the deterministic engine (lib/engine.ts).
 */

import { calculateDecision, RULE_VERSION } from '@/lib/engine';

export type IncidentMaterial = 'metal' | 'plastic' | 'glass' | 'labour' | 'mixed';

export interface FleetVehicle {
  id: string;
  label: string;
  registration: string;
  ageYears: number;
  idv: number;
  ncb: number;
  zeroDep: boolean;
  premium: number;
  deductible: number;
  downtimePerDay: number;
}

export interface Incident {
  id: string;
  vehicleId: string;
  description: string;
  amount: number;
  material: IncidentMaterial;
  daysOffRoad: number;
}

export interface IncidentPlan {
  incident: Incident;
  decision: 'CLAIM' | 'PAY';
  /** What the fleet pays now if this incident is claimed. */
  claimOutOfPocket: number;
  insurerPays: number;
  downtimeCost: number;
}

export interface VehiclePlan {
  vehicle: FleetVehicle;
  incidents: IncidentPlan[];
  ncbLoss: number;
  planCost: number;
  claimAllCost: number;
  payAllCost: number;
  /** True when claiming one incident made another worth claiming too. */
  bundled: boolean;
}

export interface FleetPlan {
  vehicles: VehiclePlan[];
  planCost: number;
  claimAllCost: number;
  payAllCost: number;
  ncbAtRisk: number;
  downtimeCost: number;
  claims: number;
  missingData: string[];
}

function items(i: Incident) {
  if (i.material === 'mixed') return [{ category: 'metal', cost: i.amount / 2 }, { category: 'plastic', cost: i.amount / 2 }];
  return [{ category: i.material, cost: i.amount }];
}

function evaluate(v: FleetVehicle, i: Incident) {
  return calculateDecision({
    vehicle: { age_years: v.ageYears },
    policy: { idv: v.idv, deductible: v.deductible, ncb_percentage: v.ncb, zero_depreciation_addon: v.zeroDep, rule_version: RULE_VERSION },
    repair_items: items(i),
    estimated_base_premium_next_year: v.premium,
  });
}

export function planVehicle(v: FleetVehicle, incidents: Incident[]): VehiclePlan {
  const evals = incidents.map((i) => evaluate(v, i));
  // NCB impact depends only on the vehicle's NCB and premium, not the incident.
  const ncbLoss = evals[0]?.future_ncb_impact ?? 0;
  const n = incidents.length;
  const costOf = (mask: number) => {
    let c = 0;
    for (let k = 0; k < n; k++) c += mask & (1 << k) ? evals[k].immediate_out_of_pocket : incidents[k].amount;
    return c + (mask ? ncbLoss : 0);
  };

  let best = 0;
  if (n <= 12) {
    let bestCost = costOf(0);
    for (let mask = 1; mask < 1 << n; mask++) {
      const c = costOf(mask);
      // Prefer fewer claims on ties: a cleaner claim history.
      if (c < bestCost - 0.005 || (Math.abs(c - bestCost) <= 0.005 && popcount(mask) < popcount(best))) {
        best = mask;
        bestCost = c;
      }
    }
  } else {
    // Greedy fallback for very long lists: claim whatever saves money once NCB is already lost.
    const savings = evals.map((e, k) => incidents[k].amount - e.immediate_out_of_pocket);
    const totalIfClaimAll = savings.reduce((s, x) => s + Math.max(0, x), 0);
    if (totalIfClaimAll > ncbLoss) savings.forEach((x, k) => x > 0 && (best |= 1 << k));
  }

  const plans: IncidentPlan[] = incidents.map((i, k) => ({
    incident: i,
    decision: best & (1 << k) ? 'CLAIM' : 'PAY',
    claimOutOfPocket: evals[k].immediate_out_of_pocket,
    insurerPays: evals[k].estimated_payout,
    downtimeCost: i.daysOffRoad * v.downtimePerDay,
  }));

  // "Bundled" = some claimed incident would not be worth claiming on its own.
  const bundled = plans.some((p, k) => p.decision === 'CLAIM' && incidents[k].amount - evals[k].immediate_out_of_pocket < ncbLoss);

  return {
    vehicle: v,
    incidents: plans,
    ncbLoss,
    planCost: costOf(best),
    claimAllCost: n ? costOf((1 << Math.min(n, 30)) - 1) : 0,
    payAllCost: costOf(0),
    bundled,
  };
}

export function planFleet(vehicles: FleetVehicle[], incidents: Incident[]): FleetPlan {
  const missing = new Set<string>();
  const byVehicle = new Map<string, Incident[]>();
  for (const i of incidents) {
    if (!(i.amount > 0)) continue;
    byVehicle.set(i.vehicleId, [...(byVehicle.get(i.vehicleId) || []), i]);
  }
  const plans: VehiclePlan[] = [];
  for (const [vid, list] of byVehicle) {
    const v = vehicles.find((x) => x.id === vid);
    if (!v) continue;
    if (!(v.premium > 0)) missing.add(`${v.label} (${v.registration}): renewal premium`);
    if (!(v.idv > 0)) missing.add(`${v.label} (${v.registration}): IDV`);
    plans.push(planVehicle(v, list));
  }
  const sum = (f: (p: VehiclePlan) => number) => plans.reduce((s, p) => s + f(p), 0);
  return {
    vehicles: plans,
    planCost: sum((p) => p.planCost),
    claimAllCost: sum((p) => p.claimAllCost),
    payAllCost: sum((p) => p.payAllCost),
    ncbAtRisk: sum((p) => (p.incidents.some((i) => i.decision === 'CLAIM') ? p.ncbLoss : 0)),
    downtimeCost: sum((p) => p.incidents.reduce((s, i) => s + i.downtimeCost, 0)),
    claims: sum((p) => p.incidents.filter((i) => i.decision === 'CLAIM').length),
    missingData: [...missing],
  };
}

function popcount(x: number) {
  let c = 0;
  while (x) {
    c += x & 1;
    x >>>= 1;
  }
  return c;
}

/** CSV columns: registration,description,amount,material,days_off_road */
export function parseIncidentsCsv(text: string, vehicles: FleetVehicle[]): { incidents: Omit<Incident, 'id'>[]; errors: string[] } {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const errors: string[] = [];
  const out: Omit<Incident, 'id'>[] = [];
  const header = rows[0]?.toLowerCase().startsWith('registration') ? 1 : 0;
  const norm = (s: string) => s.replace(/[\s-]/g, '').toUpperCase();
  rows.slice(header).forEach((row, idx) => {
    const cells = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [reg, description = '', amount = '', material = 'mixed', days = '0'] = cells;
    const v = vehicles.find((x) => norm(x.registration) === norm(reg || ''));
    const amt = Number(amount.replace(/[₹,\s]/g, ''));
    const mat = (['metal', 'plastic', 'glass', 'labour', 'mixed'].includes(material.toLowerCase()) ? material.toLowerCase() : 'mixed') as IncidentMaterial;
    if (!v) errors.push(`Row ${idx + 1 + header}: no vehicle with registration "${reg}"`);
    else if (!(amt > 0)) errors.push(`Row ${idx + 1 + header}: amount "${amount}" is not a number`);
    else out.push({ vehicleId: v.id, description, amount: amt, material: mat, daysOffRoad: Math.max(0, Number(days) || 0) });
  });
  return { incidents: out, errors };
}

export function planToCsv(plan: FleetPlan): string {
  const lines = ['registration,vehicle,description,amount,decision,you_pay_if_claimed,insurer_pays_if_claimed,ncb_cost_for_vehicle,downtime_cost'];
  for (const vp of plan.vehicles) {
    for (const ip of vp.incidents) {
      lines.push(
        [vp.vehicle.registration, vp.vehicle.label, `"${ip.incident.description.replace(/"/g, "'")}"`, ip.incident.amount, ip.decision === 'CLAIM' ? 'claim' : 'pay directly', Math.round(ip.claimOutOfPocket), Math.round(ip.insurerPays), Math.round(vp.ncbLoss), Math.round(ip.downtimeCost)].join(',')
      );
    }
  }
  return lines.join('\n');
}
