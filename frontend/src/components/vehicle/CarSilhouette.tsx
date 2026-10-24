import React, { useId } from 'react';
import { BodyType, bodyTypeOf, paintFor } from '@/lib/bodyType';

/**
 * Side-view drawings, front of the vehicle on the right, viewBox 0 0 320 112.
 * Proportions follow typical Indian models of each body style.
 */
type Shape = {
  body: string;
  glass: string;
  pillars: number[]; // x positions of window pillars
  seams?: string; // door seams, cladding, bed lines
  head: string;
  tail: string;
  wheels: [number, number];
  r: number;
  cy: number;
  extra?: string; // roof rails etc., drawn in body shade
};

const SHAPES: Record<BodyType, Shape> = {
  hatchback: {
    body: 'M48 90 C45 80 45 70 47 62 C50 46 56 34 66 29 C90 24 140 22 168 23 C182 24 192 30 204 42 L216 52 C236 55 252 57 264 61 C273 64 277 71 277 80 L276 90 L250 90 A24 24 0 0 0 202 90 L116 90 A24 24 0 0 0 68 90 Z',
    glass: 'M60 52 C62 41 68 33 80 31 L166 29 C178 29 188 35 198 45 L206 52 Z',
    pillars: [134],
    seams: 'M134 52 L136 88 M206 54 L204 86',
    head: 'M256 61 L272 66 L271 72 L255 68 Z',
    tail: 'M46 58 L56 57 L55 70 L46 70 Z',
    wheels: [92, 226],
    r: 18,
    cy: 90,
  },
  sedan: {
    body: 'M36 90 C34 82 34 74 36 68 C38 62 42 59 50 58 L84 56 C96 42 108 32 124 28 C146 24 176 24 194 27 C206 30 216 38 226 48 L234 54 C254 56 268 59 278 63 C286 67 289 74 289 82 L288 90 L262 90 A24 24 0 0 0 214 90 L110 90 A24 24 0 0 0 62 90 Z',
    glass: 'M92 55 C102 42 112 34 126 31 L192 30 C202 31 210 38 218 48 L223 55 Z',
    pillars: [160],
    seams: 'M160 55 L162 88 M224 56 L222 86 M86 58 L100 58',
    head: 'M270 61 L286 67 L285 73 L269 67 Z',
    tail: 'M36 63 L48 61 L48 69 L36 71 Z',
    wheels: [86, 238],
    r: 18,
    cy: 90,
  },
  suv: {
    body: 'M42 86 C40 76 40 60 42 44 C43 30 48 22 60 20 L176 17 C190 17 198 22 206 32 L222 50 C246 53 264 56 274 60 C282 64 286 72 286 80 L285 86 L258 86 A26 26 0 0 0 206 86 L114 86 A26 26 0 0 0 62 86 Z',
    glass: 'M54 48 L56 30 C57 26 60 24 66 24 L172 22 C182 22 190 26 196 34 L208 48 Z',
    pillars: [100, 150],
    seams: 'M150 48 L152 84 M208 50 L206 82 M42 72 L64 72 M112 74 L208 74 M256 72 L286 72',
    head: 'M266 58 L284 64 L283 70 L265 65 Z',
    tail: 'M41 44 L50 44 L50 58 L41 58 Z',
    wheels: [88, 232],
    r: 20,
    cy: 88,
    extra: 'M70 19 L72 16 L166 14 L168 17',
  },
  mpv: {
    body: 'M30 90 C28 80 28 64 30 46 C31 32 36 25 48 23 L184 21 C198 21 208 27 218 38 L236 54 C256 57 270 60 280 64 C288 68 291 75 291 82 L290 90 L264 90 A24 24 0 0 0 216 90 L106 90 A24 24 0 0 0 58 90 Z',
    glass: 'M42 52 L44 32 C45 28 48 27 54 27 L182 26 C192 26 200 31 208 40 L218 52 Z',
    pillars: [96, 152],
    seams: 'M152 52 L154 88 M96 52 L98 88 M220 54 L218 86',
    head: 'M272 62 L289 68 L288 74 L271 68 Z',
    tail: 'M29 46 L38 46 L38 60 L29 60 Z',
    wheels: [82, 240],
    r: 18,
    cy: 90,
  },
  van: {
    body: 'M32 90 L32 30 C32 22 38 18 48 18 L228 18 C240 18 248 24 254 34 L266 58 C278 60 286 66 286 76 L286 90 L258 90 A24 24 0 0 0 210 90 L104 90 A24 24 0 0 0 56 90 Z',
    glass: 'M44 48 L44 28 L222 28 C232 28 238 32 244 40 L250 48 Z',
    pillars: [110, 176, 214],
    seams: 'M176 48 L176 88 M110 48 L110 88 M140 70 L150 70',
    head: 'M270 60 L285 64 L285 70 L270 68 Z',
    tail: 'M31 40 L38 40 L38 56 L31 56 Z',
    wheels: [80, 234],
    r: 17,
    cy: 90,
  },
  pickup: {
    body: 'M24 88 L24 56 L130 56 L130 30 C130 23 135 20 144 20 L186 20 C196 20 203 25 210 34 L226 54 C250 57 270 60 282 64 C290 68 294 74 294 80 L294 88 L262 88 A26 26 0 0 0 210 88 L102 88 A26 26 0 0 0 50 88 Z',
    glass: 'M140 50 L142 28 C142 26 144 25 148 25 L184 25 C192 25 197 28 202 35 L212 50 Z',
    pillars: [176],
    seams: 'M24 66 L130 66 M176 50 L177 86 M212 52 L210 84',
    head: 'M276 62 L292 68 L291 74 L275 68 Z',
    tail: 'M23 58 L30 58 L30 70 L23 70 Z',
    wheels: [76, 236],
    r: 20,
    cy: 88,
    extra: 'M24 56 L24 49 L128 49',
  },
  minitruck: {
    body: 'M40 88 L40 44 L190 44 L190 22 C190 17 194 15 200 15 L252 15 C263 15 270 21 272 32 L282 64 L282 88 L256 88 A20 20 0 0 0 216 88 L104 88 A20 20 0 0 0 64 88 Z',
    glass: 'M202 42 L204 22 L248 22 C256 22 261 26 263 33 L268 42 Z',
    pillars: [],
    seams: 'M40 58 L190 58 M40 72 L190 72 M190 44 L190 86 M232 44 L232 84',
    head: 'M270 66 L282 66 L282 74 L270 74 Z',
    tail: 'M39 48 L45 48 L45 60 L39 60 Z',
    wheels: [84, 236],
    r: 15,
    cy: 88,
    extra: 'M40 44 L40 36 L188 36',
  },
};

export function CarSilhouette({
  vehicle,
  type,
  paint,
  className = '',
  variant = 'paint',
}: {
  vehicle?: { id?: string; make?: string; model?: string; usage_type?: string | null };
  type?: BodyType;
  paint?: { body: string; shade: string };
  className?: string;
  /** `paint`: coloured vehicle. `line`: outline for dark backgrounds. */
  variant?: 'paint' | 'line';
}) {
  const uid = useId().replace(/:/g, '');
  const t = type ?? bodyTypeOf(vehicle ?? {});
  const s = SHAPES[t];
  const p = paint ?? paintFor(vehicle?.id || `${vehicle?.make}${vehicle?.model}`);
  const line = variant === 'line';
  const stroke = line ? 'rgba(181,219,241,0.55)' : 'rgba(10,16,34,0.22)';
  const seam = line ? 'rgba(181,219,241,0.3)' : 'rgba(10,16,34,0.2)';
  const label = vehicle ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() : t;

  return (
    <svg viewBox="0 0 320 112" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.body} />
          <stop offset="0.55" stopColor={p.body} />
          <stop offset="1" stopColor={p.shade} />
        </linearGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8f4fb" />
          <stop offset="0.6" stopColor="#9fc0d6" />
          <stop offset="1" stopColor="#5f87a3" />
        </linearGradient>
      </defs>
      {!line && <ellipse cx="160" cy={s.cy + s.r} rx="136" ry="4.5" fill="#0a1022" opacity="0.14" />}
      {s.extra && <path d={s.extra} fill="none" stroke={line ? stroke : p.shade} strokeWidth="2.4" strokeLinecap="round" />}
      <path d={s.body} fill={line ? 'rgba(127,192,230,0.06)' : `url(#b${uid})`} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={s.glass} fill={line ? 'rgba(181,219,241,0.12)' : `url(#g${uid})`} stroke={line ? stroke : 'rgba(10,16,34,0.25)'} strokeWidth="0.8" />
      {s.pillars.map((x) => (
        <rect key={x} x={x - 2.5} y={0} width={5} height={112} fill={line ? 'rgba(10,16,34,1)' : p.body} clipPath={`url(#c${uid})`} />
      ))}
      <clipPath id={`c${uid}`}>
        <path d={s.glass} />
      </clipPath>
      {s.seams && <path d={s.seams} fill="none" stroke={seam} strokeWidth="1.1" strokeLinecap="round" />}
      <path d={s.head} fill={line ? 'none' : '#f6f1d3'} stroke={line ? stroke : 'rgba(10,16,34,0.3)'} strokeWidth="0.8" />
      <path d={s.tail} fill={line ? 'none' : '#c0392b'} stroke={line ? stroke : 'rgba(10,16,34,0.3)'} strokeWidth="0.8" />
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={s.cy} r={s.r} fill={line ? 'none' : '#1b1e25'} stroke={line ? stroke : '#0a0c10'} strokeWidth="1.2" />
          <circle cx={cx} cy={s.cy} r={s.r * 0.56} fill={line ? 'none' : '#b9c1cc'} stroke={line ? 'rgba(181,219,241,0.4)' : '#7b8592'} strokeWidth="1" />
          {!line && [0, 72, 144, 216, 288].map((a) => (
            <line key={a} x1={cx} y1={s.cy} x2={cx + s.r * 0.5 * Math.cos((a * Math.PI) / 180)} y2={s.cy + s.r * 0.5 * Math.sin((a * Math.PI) / 180)} stroke="#7b8592" strokeWidth="1.6" />
          ))}
          <circle cx={cx} cy={s.cy} r={s.r * 0.14} fill={line ? 'none' : '#5c6470'} stroke={line ? stroke : 'none'} />
        </g>
      ))}
    </svg>
  );
}
