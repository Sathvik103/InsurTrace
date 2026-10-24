import { repairOrSell } from '../src/lib/repairOrSell.ts';
let bad = 0;
const eq = (name, got, want) => { if (got !== want) { bad++; console.log(`FAIL ${name}: got ${got}, want ${want}`); } };

// Small dent: keep repairing.
let r = repairOrSell({ repairBill: 20000, idv: 500000, deductible: 1000, yourRepairCost: 12000, ncbLoss: 4000 });
eq('small band', r.band, 'repair');
eq('small keep value', r.keepValue, 488000);
eq('small break-even', r.breakEvenOffer, 488000);
eq('no offer, no sell verdict', r.sell, undefined);

// Big repair on an old car, with an as-is offer above the break-even.
r = repairOrSell({ repairBill: 180000, idv: 320000, deductible: 1000, yourRepairCost: 90000, ncbLoss: 6000, asIsOffer: 240000 });
eq('consider band', r.band, 'consider');
eq('keep value', r.keepValue, 230000);
eq('offer beats repair', r.sell.better, true);
eq('difference', r.sell.difference, 10000);

// Lower offer: repair wins.
r = repairOrSell({ repairBill: 180000, idv: 320000, deductible: 1000, yourRepairCost: 90000, ncbLoss: 6000, asIsOffer: 200000 });
eq('offer below break-even', r.sell.better, false);

// Above 75% of IDV: total-loss path, NCB loss counted.
r = repairOrSell({ repairBill: 300000, idv: 380000, deductible: 2000, yourRepairCost: 150000, ncbLoss: 8000, valueAfterRepair: 350000 });
eq('total-loss band', r.band, 'total-loss');
eq('settlement', r.totalLoss.settlement, 378000);
eq('net after NCB', r.totalLoss.netAfterNcb, 370000);
eq('custom value after repair', r.valueAfterRepair, 350000);
eq('total loss beats repair', r.totalLoss.betterThanRepair, true);

// Boundary: exactly 75% counts as total loss; invalid inputs return null.
eq('75% boundary', repairOrSell({ repairBill: 75, idv: 100, deductible: 0, yourRepairCost: 10, ncbLoss: 0 }).band, 'total-loss');
eq('no idv', repairOrSell({ repairBill: 10, idv: 0, deductible: 0, yourRepairCost: 1, ncbLoss: 0 }), null);

console.log(bad ? `${bad} failures` : 'repairOrSell: all checks passed');
process.exit(bad ? 1 : 0);
