'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EASE, Reveal } from '@/components/home/fx';
import { TRADEOFFS } from '@/content/system';

export function Tradeoffs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="tradeoffs" className="scroll-mt-24 bg-white px-5 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="text-sm font-semibold text-forest-700">Trade-offs</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950">Every choice cost something.</h2>
          <p className="mt-4 text-ink-500">What we chose, what it bought, and what we gave up for it.</p>
        </Reveal>
        <div className="border-t border-ink-100">
          {TRADEOFFS.map((t, i) => {
            const isOpen = open === i;
            return (
              <div key={t.title} className="border-b border-ink-100">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="font-display text-xl font-semibold tracking-tight text-ink-950">{t.title}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                      <div className="grid gap-3 pb-6 sm:grid-cols-2">
                        <div className="rounded-xl bg-gain-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gain">What it buys</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-800">{t.gain}</p>
                        </div>
                        <div className="rounded-xl bg-loss-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-loss">What it costs</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-800">{t.cost}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
