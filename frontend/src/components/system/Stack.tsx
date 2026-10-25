'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '@/components/home/fx';
import { STACK } from '@/content/system';

export function Stack() {
  const [group, setGroup] = useState(STACK[0].group);
  const items = STACK.find((g) => g.group === group)!.items;
  return (
    <section id="stack" className="scroll-mt-24 bg-white px-5 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="text-sm font-semibold text-forest-700">Stack</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950">What it’s made of, and why.</h2>
          <div className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:items-start">
            {STACK.map((g) => (
              <button
                key={g.group}
                type="button"
                onClick={() => setGroup(g.group)}
                aria-pressed={g.group === group}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${g.group === group ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-paper'}`}
              >
                {g.group} <span className="ml-1 font-mono text-xs opacity-50">{STACK.find((s) => s.group === g.group)!.items.length}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.ul key={group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="grid gap-3 sm:grid-cols-2">
            {items.map((it, i) => (
              <motion.li key={it.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-ink-100 p-5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg font-semibold text-ink-950">{it.name}</span>
                  {it.version && <span className="font-mono text-xs text-ink-400">v{it.version}</span>}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{it.why}</p>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}
