/** Behavioural tests for the fleet optimiser (src/lib/triage.ts). Run: npm run test:triage */
import assert from 'node:assert/strict';
import { planFleet, parseIncidentsCsv, type FleetVehicle } from '../src/lib/triage.ts';

const car = (id: string, ncb: number, premium = 30000): FleetVehicle => ({
  id, label: `Car ${id}`, registration: `KA01AB${id}`, ageYears: 2, idv: 800000, ncb, zeroDep: false, premium, deductible: 1000, downtimePerDay: 2000,
});

// 1. Small incident alone: NCB loss (45% of 30,000 = 13,500) outweighs the payout -> pay directly.
let p = planFleet([car('1', 35)], [{ id: 'a', vehicleId: '1', description: 'scrape', amount: 6000, material: 'plastic', daysOffRoad: 1 }]);
assert.equal(p.vehicles[0].incidents[0].decision, 'PAY');
assert.equal(p.claims, 0);

// 2. Same small incident on a car that also has a big claim: NCB is lost anyway, so bundle it.
p = planFleet([car('1', 35)], [
  { id: 'a', vehicleId: '1', description: 'scrape', amount: 6000, material: 'plastic', daysOffRoad: 1 },
  { id: 'b', vehicleId: '1', description: 'front crash', amount: 90000, material: 'metal', daysOffRoad: 6 },
]);
assert.deepEqual(p.vehicles[0].incidents.map((i) => i.decision), ['CLAIM', 'CLAIM']);
assert.equal(p.vehicles[0].bundled, true);
assert.ok(p.planCost < p.payAllCost && p.planCost <= p.claimAllCost);
assert.equal(p.downtimeCost, 14000);

// 3. Zero NCB: claiming still forfeits the 20% bonus you would earn at renewal
//    (20% of 30,000 = 6,000), so a 20,000 metal repair is claimed (saves more than that).
p = planFleet([car('2', 0)], [{ id: 'c', vehicleId: '2', description: 'door', amount: 20000, material: 'metal', daysOffRoad: 2 }]);
assert.equal(p.vehicles[0].incidents[0].decision, 'CLAIM');
assert.equal(p.ncbAtRisk, 6000);

// 4. The plan is never worse than claiming everything or paying everything.
const vs = [car('1', 50, 42000), car('2', 20, 12000), car('3', 0, 9000)];
for (let t = 0; t < 200; t++) {
  const inc = Array.from({ length: 1 + (t % 5) }, (_, k) => ({ id: `${t}-${k}`, vehicleId: vs[(t + k) % 3].id, description: 'x', amount: 1000 + ((t * 7919 + k * 104729) % 120000), material: (['metal', 'plastic', 'glass', 'labour', 'mixed'] as const)[(t + k) % 5], daysOffRoad: k }));
  const q = planFleet(vs, inc);
  assert.ok(q.planCost <= q.claimAllCost + 0.01 && q.planCost <= q.payAllCost + 0.01, `case ${t}`);
}

// 5. CSV import maps registrations and reports bad rows.
const csv = parseIncidentsCsv('registration,description,amount,material,days_off_road\nKA01AB1,bumper,12000,plastic,2\nXX00ZZ9999,ghost,100,metal,0\nKA-01-AB-2,door,abc,metal,1', vs);
assert.equal(csv.incidents.length, 1);
assert.equal(csv.errors.length, 2);

console.log('triage: all checks passed');
