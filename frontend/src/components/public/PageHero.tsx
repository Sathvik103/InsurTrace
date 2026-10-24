'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE, SplitWords } from '@/components/home/fx';

/**
 * Dark hero shared by the public pages, matching the homepage. Pair it with
 * <PublicNavbar tone="dark" />. `accent` renders as a second line in signal lime.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  body,
  actions,
  aside,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  body?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section className="vs-grain relative isolate overflow-hidden bg-navy-950 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 -z-10 h-[420px] w-[420px] rounded-full bg-steel-600/25 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-[320px] w-[320px] rounded-full bg-signal/10 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-20%] bottom-[-20%] -z-10 h-[60%] opacity-50">
        <div className="vs-floor h-full w-full" />
      </div>

      <div className={`mx-auto grid max-w-6xl items-center gap-12 px-5 ${compact ? 'pb-16 pt-32 lg:pb-20 lg:pt-40' : 'pb-20 pt-32 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-40'}`}>
        <div>
          <motion.p {...fade(0.05)} className="text-sm font-semibold text-signal">{eyebrow}</motion.p>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,6.5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            <SplitWords text={title} delay={0.1} stagger={0.04} />
            {accent && (
              <>
                <br />
                <SplitWords text={accent} delay={0.3} stagger={0.04} className="text-signal" />
              </>
            )}
          </h1>
          {body && (
            <motion.div {...fade(0.5)} className="mt-7 max-w-xl text-lg leading-relaxed text-white/60">
              {body}
            </motion.div>
          )}
          {actions && (
            <motion.div {...fade(0.65)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              {actions}
            </motion.div>
          )}
        </div>
        {aside && !compact && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
          >
            {aside}
          </motion.div>
        )}
      </div>
    </section>
  );
}
