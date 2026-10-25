'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '@/components/home/fx';
import { TABLES } from '@/content/system';

export function DataModel() {
  const [sel, setSel] = useState('claims');
  const t = TABLES.find((x) => x.name === sel)!;
  const linked = useMemo(() => new Set(t.links), [t]);
  return (
    <section id="data" className="scroll-mt-24 bg-paper px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-forest-700">Data model</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink-950">Where the data lives.</h2>
          <p className="mt-4 text-lg text-ink-500">The main tables in Postgres. Click one to see what it connects to. The schema has six more (accidents, repairs, repair items, service events, policy add-ons and model outputs) that today’s screens don’t use.</p>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {TABLES.map((x) => {
              const isSel = x.name === sel;
              const isLink = linked.has(x.name);
              return (
                <button
                  key={x.name}
                  type="button"
                  onClick={() => setSel(x.name)}
                  aria-pressed={isSel}
                  className={`rounded-xl border p-3 text-left transition duration-300 ${isSel ? 'border-ink-950 bg-ink-950 text-white' : isLink ? 'border-signal-600 bg-white' : 'border-ink-100 bg-white opacity-60 hover:opacity-100'}`}
                >
                  <span className="block truncate font-mono text-xs font-semibold">{x.name}</span>
                  <span className={`mt-1 block text-[11px] leading-snug ${isSel ? 'text-white/60' : 'text-ink-500'}`}>{x.holds}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-ink-100 bg-white p-6">
              <p className="font-mono text-sm font-semibold text-ink-950">{t.name}</p>
              <p className="mt-1 text-sm text-ink-500">{t.holds}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-400">Connected to</p>
              <ul className="mt-2 space-y-1.5">
                {t.links.map((l) => (
                  <li key={l}>
                    <button type="button" onClick={() => setSel(l)} className="font-mono text-sm text-forest-700 underline-offset-2 hover:underline">{l}</button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
