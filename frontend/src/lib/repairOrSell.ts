/**
 * Repair, or sell the car as it is? Plain arithmetic on figures the user can
 * see and change; nothing here is a market price prediction.
 *
 * Keeping the car: you end up with a car worth `valueAfterRepair`, having paid
 * `yourRepairCost` (the cheaper of claiming or paying, NCB loss included).
 * Selling as-is: you get `asIsOffer` and spend nothing on repairs.
 * Selling wins when asIsOffer > valueAfterRepair - yourRepairCost.
 *
 * Many motor policies treat a repair bill above about 75% of the IDV as a
 * constructive total loss: the insurer may settle at the IDV minus the
 * deductible instead of repairing. The exact rule is in the policy wording.
 */

export const TOTAL_LOSS_RATIO = 0.75;
export const CONSIDER_RATIO = 0.4;

export interface RepairOrSellInput {
  repairBill: number; // total on the workshop quote
  idv: number;
  deductible: number;
  /** What the user pays on the cheaper route (claim or self-pay), NCB loss included. */
  yourRepairCost: number;
  /** NCB discount lost if a claim is made (a total-loss settlement is a claim). */
  ncbLoss: number;
  /** What the car would sell for once repaired. Defaults to the IDV. */
  valueAfterRepair?: number;
  /** What a buyer offers for the car as it is. Optional. */
  asIsOffer?: number;
}

export type Band = 'repair' | 'consider' | 'total-loss';

export interface RepairOrSellResult {
  ratio: number; // repair bill as a share of IDV
  band: Band;
  valueAfterRepair: number;
  keepValue: number; // what you are left with after repairing
  breakEvenOffer: number; // an as-is offer above this beats repairing
  sell?: { better: boolean; difference: number }; // only when an offer is given
  totalLoss?: { settlement: number; netAfterNcb: number; betterThanRepair: boolean };
}

export function repairOrSell(i: RepairOrSellInput): RepairOrSellResult | null {
  if (!(i.idv > 0) || !(i.repairBill > 0)) return null;
  const ratio = i.repairBill / i.idv;
  const band: Band = ratio >= TOTAL_LOSS_RATIO ? 'total-loss' : ratio >= CONSIDER_RATIO ? 'consider' : 'repair';
  const valueAfterRepair = i.valueAfterRepair && i.valueAfterRepair > 0 ? i.valueAfterRepair : i.idv;
  const keepValue = valueAfterRepair - i.yourRepairCost;
  const breakEvenOffer = Math.max(0, keepValue);

  const out: RepairOrSellResult = { ratio, band, valueAfterRepair, keepValue, breakEvenOffer };
  if (i.asIsOffer && i.asIsOffer > 0) out.sell = { better: i.asIsOffer > keepValue, difference: Math.abs(i.asIsOffer - keepValue) };
  if (band === 'total-loss') {
    const settlement = Math.max(0, i.idv - i.deductible);
    const netAfterNcb = settlement - i.ncbLoss;
    out.totalLoss = { settlement, netAfterNcb, betterThanRepair: netAfterNcb > keepValue };
  }
  return out;
}
