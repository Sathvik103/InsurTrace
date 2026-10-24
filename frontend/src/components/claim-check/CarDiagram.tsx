'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { DAMAGE_PARTS } from '@/lib/claimCheck';
import type { BodyType } from '@/lib/bodyType';

const ROUND = 'M100 8 C142 8 164 22 166 52 L170 120 C172 160 172 200 170 240 L166 282 C163 304 140 312 100 312 C60 312 37 304 34 282 L30 240 C28 200 28 160 30 120 L34 52 C36 22 58 8 100 8 Z';
const BOXY = 'M100 8 C150 8 166 16 168 40 L172 120 L172 240 L170 290 C169 306 156 312 100 312 C44 312 31 306 30 290 L28 240 L28 120 L32 40 C34 16 50 8 100 8 Z';

/** Per body type: outline, cabin (roof) extent and rear treatment, all in the same 200x320 frame. */
function TopDown({ type }: { type: BodyType }) {
  const boxy = type === 'suv' || type === 'van' || type === 'pickup' || type === 'minitruck';
  const glass = (d: string, o = 0.9) => <path d={d} fill="url(#car-glass)" opacity={o} />;
  const roof = (y: number, h: number) => <rect x="58" y={y} width="84" height={h} rx="14" fill="#ffffff" stroke="#c4d0e4" strokeWidth="1.5" />;
  return (
    <>
      <path d={boxy ? BOXY : ROUND} fill="url(#car-body)" stroke="#95a8c9" strokeWidth="2" />
      {type === 'minitruck' ? (
        <>
          {glass('M50 40 Q100 32 150 40 L146 62 Q100 56 54 62 Z')}
          {roof(66, 40)}
          <rect x="36" y="114" width="128" height="186" rx="6" fill="#e3e9f3" stroke="#95a8c9" strokeWidth="1.5" />
          {[150, 186, 222, 258].map((y) => <path key={y} d={`M44 ${y} L156 ${y}`} stroke="#c4d0e4" strokeWidth="2" />)}
        </>
      ) : (
        <>
          <path d="M62 30 Q100 22 138 30" stroke="#c4d0e4" strokeWidth="2" fill="none" />
          {type === 'van' ? glass('M52 74 Q100 60 148 74 L142 104 Q100 96 58 104 Z') : glass('M54 98 Q100 82 146 98 L140 128 Q100 120 60 128 Z')}
          {type === 'sedan' && (<>{roof(132, 84)}{glass('M60 220 Q100 228 140 220 L146 246 Q100 258 54 246 Z', 0.75)}<path d="M52 262 Q100 270 148 262" stroke="#c4d0e4" strokeWidth="2" fill="none" /></>)}
          {type === 'hatchback' && (<>{roof(132, 112)}{glass('M58 250 Q100 258 142 250 L148 278 Q100 290 52 278 Z', 0.75)}</>)}
          {type === 'suv' && (<>{roof(132, 118)}{glass('M56 254 Q100 260 144 254 L148 282 Q100 290 52 282 Z', 0.75)}<path d="M62 138 L62 244 M138 138 L138 244" stroke="#95a8c9" strokeWidth="3" strokeLinecap="round" /></>)}
          {type === 'mpv' && (<>{roof(132, 136)}{glass('M58 272 Q100 278 142 272 L146 290 Q100 298 54 290 Z', 0.75)}</>)}
          {type === 'van' && (<>{roof(108, 176)}{glass('M58 288 Q100 292 142 288 L144 300 Q100 306 56 300 Z', 0.7)}</>)}
          {type === 'pickup' && (
            <>
              {roof(132, 64)}
              {glass('M60 200 Q100 206 140 200 L142 212 Q100 218 58 212 Z', 0.75)}
              <rect x="40" y="222" width="120" height="80" rx="6" fill="#e3e9f3" stroke="#95a8c9" strokeWidth="1.5" />
              {[244, 266, 288].map((y) => <path key={y} d={`M48 ${y} L152 ${y}`} stroke="#c4d0e4" strokeWidth="2" />)}
            </>
          )}
        </>
      )}
      <path d="M34 168 L58 168 M142 168 L166 168" stroke="#c4d0e4" strokeWidth="2" />
    </>
  );
}

/** Top-down outline of the vehicle with tappable damage hotspots (front at the top). */
export function CarDiagram({ selected, onToggle, type = 'sedan' }: { selected: Set<string>; onToggle: (id: string) => void; type?: BodyType }) {
  const reduce = useReducedMotion();
  const spots = DAMAGE_PARTS.filter((p) => p.x >= 0);

  return (
    <div className="relative mx-auto aspect-[5/8] w-full max-w-[260px] select-none">
      <svg viewBox="0 0 200 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f5fa" />
            <stop offset="1" stopColor="#e3e9f3" />
          </linearGradient>
          <linearGradient id="car-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b5dbf1" />
            <stop offset="1" stopColor="#7fc0e6" />
          </linearGradient>
        </defs>
        {[[26, 62], [162, 62], [26, 236], [162, 236]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="40" rx="5" fill="#26365b" />
        ))}
        <TopDown type={type} />
        <ellipse cx="24" cy="118" rx="8" ry="5" fill="#c4d0e4" />
        <ellipse cx="176" cy="118" rx="8" ry="5" fill="#c4d0e4" />
        <path d="M46 20 Q56 14 68 16" stroke="#7fc0e6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M154 20 Q144 14 132 16" stroke="#7fc0e6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M48 302 Q58 308 70 306 M152 302 Q142 308 130 306" stroke="#f2a7a7" strokeWidth="5" strokeLinecap="round" fill="none" />
        <text x="100" y={type === 'minitruck' ? 28 : 58} textAnchor="middle" fontSize="9" fill="#95a8c9" fontWeight="600" letterSpacing="1.5">FRONT</text>
      </svg>

      {spots.map((part, i) => {
        const on = selected.has(part.id);
        return (
          <div key={part.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${part.x}%`, top: `${part.y}%` }}>
          <motion.button
            type="button"
            onClick={() => onToggle(part.id)}
            aria-pressed={on}
            aria-label={`${part.label}${on ? ' (selected)' : ''}`}
            title={part.label}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 500, damping: 26 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              {!on && !reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-navy-950/25"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.12 }}
                />
              )}
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-md transition-colors ${
                  on ? 'border-white bg-loss text-white' : 'border-white bg-navy-950 text-white'
                }`}
              >
                {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-signal" />}
              </span>
            </span>
          </motion.button>
          </div>
        );
      })}
    </div>
  );
}
