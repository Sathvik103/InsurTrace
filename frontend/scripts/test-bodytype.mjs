import { bodyTypeOf } from '../src/lib/bodyType.ts';
const cases = [
  ['Maruti Suzuki', 'Swift', 'hatchback'], ['Maruti Suzuki', 'Dzire Tour S', 'sedan'], ['Hyundai', 'Creta', 'suv'],
  ['Tata', 'Nexon EV', 'suv'], ['Honda', 'City', 'sedan'], ['Toyota', 'Innova Crysta', 'mpv'], ['Tata', 'Ace Gold', 'minitruck'],
  ['Mahindra', 'Bolero Maxi Truck', 'pickup'], ['Mahindra', 'Bolero Neo', 'suv'], ['Maruti Suzuki', 'Eeco', 'van'], ['Maruti Suzuki', 'Ertiga', 'mpv'],
  ['Hyundai', 'Grand i10 Nios', 'hatchback'], ['Mahindra', 'XUV700', 'suv'], ['Tata', 'Punch', 'suv'], ['Kia', 'Carens', 'mpv'],
  ['Maruti Suzuki', 'Wagon R', 'hatchback'], ['Toyota', 'Fortuner', 'suv'], ['Skoda', 'Slavia', 'sedan'], ['Isuzu', 'D-Max V-Cross', 'pickup'],
  ['Citroen', 'C3 Aircross', 'suv'], ['Citroen', 'C3', 'hatchback'], ['Hyundai', 'Venue', 'suv'], ['Tata', 'Intra V30', 'minitruck'], ['Force', 'Traveller', 'van'],
  ['Someco', 'Unknown', 'hatchback'],
];
let bad = 0;
for (const [make, model, want] of cases) {
  const got = bodyTypeOf({ make, model });
  if (got !== want) { bad++; console.log(`MISMATCH ${make} ${model}: got ${got}, want ${want}`); }
}
if (bodyTypeOf({ make: 'X', model: 'Y', usage_type: 'GOODS_CARRIER' }) !== 'pickup') { bad++; console.log('usage fallback wrong'); }
console.log(bad ? `${bad} failures` : `bodyType: all ${cases.length + 1} checks passed`);
process.exit(bad ? 1 : 0);
