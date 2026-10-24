/**
 * Body style of a vehicle, inferred from its make and model. Drives the
 * illustrations (side view and damage diagram); never used in any calculation.
 */

export type BodyType = 'hatchback' | 'sedan' | 'suv' | 'mpv' | 'van' | 'pickup' | 'minitruck';

export const BODY_LABEL: Record<BodyType, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  mpv: 'MPV',
  van: 'Van',
  pickup: 'Pickup',
  minitruck: 'Mini truck',
};

// Order matters: the first match wins, so specific names ("bolero maxi truck")
// come before broader ones ("bolero").
const RULES: [BodyType, string[]][] = [
  ['minitruck', ['ace', 'super carry', 'jeeto', 'dost', 'supro mini', 'intra v', 'zor grand']],
  ['pickup', ['maxi truck', 'pik-up', 'pikup', 'pickup', 'pick-up', 'camper', 'yodha', 'd-max', 'hilux', 'intra', 'bolero city']],
  ['van', ['eeco', 'omni', 'winger', 'urbania', 'traveller', 'supro van', 'versa']],
  ['mpv', ['innova', 'ertiga', 'xl6', 'carens', 'triber', 'marazzo', 'rumion', 'carnival', 'invicto', 'lodgy', 'mobilio', 'evalia']],
  [
    'suv',
    [
      'creta', 'nexon', 'brezza', 'venue', 'seltos', 'sonet', 'punch', 'harrier', 'safari', 'scorpio', 'xuv', 'thar', 'fortuner', 'hector',
      'astor', 'kushaq', 'taigun', 'kiger', 'magnite', 'grand vitara', 'hyryder', 'elevate', 'exter', 'fronx', 'jimny', 'alcazar', 'tucson',
      'compass', 'meridian', 'bolero', 'urban cruiser', 'windsor', 'zs ev', 'curvv', 'ecosport', 'duster', 'gloster', 'kodiaq', 'tiguan', 'sierra', 'aircross',
    ],
  ],
  [
    'sedan',
    ['dzire', 'city', 'ciaz', 'verna', 'aura', 'amaze', 'slavia', 'virtus', 'tigor', 'rapid', 'vento', 'sunny', 'civic', 'corolla', 'camry', 'octavia', 'superb', 'elantra', 'xcent', 'etios', 'aspire', 'zest'],
  ],
  [
    'hatchback',
    ['swift', 'alto', 'wagon', 'celerio', 'baleno', 'ignis', 'presso', 'i10', 'i20', 'tiago', 'altroz', 'kwid', 'polo', 'glanza', 'jazz', 'santro', 'c3', 'comet', 'micra', 'redi', 'figo', 'beat', 'brio', 'eon'],
  ],
];

export function bodyTypeOf(v: { make?: string; model?: string; usage_type?: string | null }): BodyType {
  const name = `${v.make ?? ''} ${v.model ?? ''}`.toLowerCase();
  for (const [type, words] of RULES) {
    if (words.some((w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(name))) return type;
  }
  if (v.usage_type === 'GOODS_CARRIER') return 'pickup';
  if (v.usage_type === 'BUS' || v.usage_type === 'PASSENGER_COMMERCIAL') return 'van';
  return v.usage_type === 'TAXI' ? 'sedan' : 'hatchback';
}

// Real-world paint shades. Each vehicle keeps the same colour (hash of its id).
const PAINTS = [
  { body: '#e9edf3', shade: '#c3ccd9' }, // pearl white
  { body: '#9aa5b4', shade: '#6f7b8c' }, // metallic silver
  { body: '#1b2747', shade: '#0d1530' }, // midnight blue
  { body: '#a3262c', shade: '#6e171c' }, // fire red
  { body: '#2c3138', shade: '#16191e' }, // graphite
  { body: '#2f6f8f', shade: '#1d4a61' }, // ocean blue
  { body: '#6c7346', shade: '#474c2c' }, // olive
  { body: '#c8a96a', shade: '#957a45' }, // champagne
];

export function paintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PAINTS[h % PAINTS.length];
}
