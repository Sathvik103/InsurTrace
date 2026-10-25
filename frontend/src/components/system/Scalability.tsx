'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '@/components/home/fx';
import { SCALE } from '@/content/system';

export function Scalability() {
  const [mode, setMode] = useState<'today' | 'next'>('today');
  return (
    <section id="scale" className="scroll-mt-24 vs-grain relative overflow-hidden bg-ink-950 px-5 py-20 text-white lg:py-28">
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-signal">Scalability</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl">What holds up, and what changes next.</h2>
          </Reveal>
          <div className="flex rounded-lg bg-white/10 p-1" role="tablist" aria-label="View">
            {(['today', 'next'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${mode === m ? 'bg-signal text-ink-950' : 'text-white/70 hover:text-white'}`}>
                {m === 'today' ? 'Today' : 'At scale'}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {SCALE.map((s) => (
            <li key={s.area} className="grid gap-2 py-5 md:grid-cols-[200px_1fr]">
              <p className="font-display text-lg font-semibold">{s.area}</p>
              <AnimatePresence mode="wait">
                <motion.p key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="leading-relaxed text-white/70">
                  {mode === 'today' ? s.today : s.next}
                </motion.p>
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
