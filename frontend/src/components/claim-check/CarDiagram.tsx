'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { DAMAGE_PARTS } from '@/lib/claimCheck';

/** Top-down car outline with tappable damage hotspots (front of the car at the top). */
export function CarDiagram({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
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
        {/* wheels */}
        {[[26, 62], [162, 62], [26, 236], [162, 236]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="40" rx="5" fill="#26365b" />
        ))}
        {/* body */}
        <path
          d="M100 8 C142 8 164 22 166 52 L170 120 C172 160 172 200 170 240 L166 282 C163 304 140 312 100 312 C60 312 37 304 34 282 L30 240 C28 200 28 160 30 120 L34 52 C36 22 58 8 100 8 Z"
          fill="url(#car-body)"
          stroke="#95a8c9"
          strokeWidth="2"
        />
        {/* bonnet crease */}
        <path d="M62 30 Q100 22 138 30" stroke="#c4d0e4" strokeWidth="2" fill="none" />
        {/* windshield */}
        <path d="M54 98 Q100 82 146 98 L140 128 Q100 120 60 128 Z" fill="url(#car-glass)" opacity="0.9" />
        {/* roof */}
        <rect x="58" y="132" width="84" height="84" rx="14" fill="#ffffff" stroke="#c4d0e4" strokeWidth="1.5" />
        {/* rear glass */}
        <path d="M60 220 Q100 228 140 220 L146 246 Q100 258 54 246 Z" fill="url(#car-glass)" opacity="0.75" />
        {/* door lines */}
        <path d="M34 168 L58 168 M142 168 L166 168" stroke="#c4d0e4" strokeWidth="2" />
        {/* mirrors */}
        <ellipse cx="24" cy="118" rx="8" ry="5" fill="#c4d0e4" />
        <ellipse cx="176" cy="118" rx="8" ry="5" fill="#c4d0e4" />
        {/* lights */}
        <path d="M46 20 Q56 14 68 16" stroke="#7fc0e6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M154 20 Q144 14 132 16" stroke="#7fc0e6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M48 302 Q58 308 70 306 M152 302 Q142 308 130 306" stroke="#f2a7a7" strokeWidth="5" strokeLinecap="round" fill="none" />
        <text x="100" y="58" textAnchor="middle" fontSize="9" fill="#95a8c9" fontWeight="600" letterSpacing="1.5">FRONT</text>
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
                  className="absolute inset-0 rounded-full bg-steel-400/30"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.12 }}
                />
              )}
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-md transition-colors ${
                  on ? 'border-white bg-loss text-white' : 'border-white bg-steel-500 text-white'
                }`}
              >
                {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </span>
          </motion.button>
          </div>
        );
      })}
    </div>
  );
}
