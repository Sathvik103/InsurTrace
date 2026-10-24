'use client';

/** Small motion primitives shared by the public pages. All respect reduced motion. */

import React, { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { rupees } from '@/lib/claimCheck';

export const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({ children, delay = 0, y = 28, className = '' }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises word by word from behind a mask. */
export function SplitWords({ text, className = '', delay = 0, stagger = 0.06, inView = false }: { text: string; className?: string; delay?: number; stagger?: number; inView?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const anim = { y: '0%', rotate: 0 };
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%', rotate: 4 }}
            {...(inView ? { whileInView: anim, viewport: { once: true } } : { animate: anim })}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: EASE }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Counts up to a rupee value when it scrolls into view (or immediately when `start`). */
export function CountUp({ value, start, duration = 1.2, format = rupees, className = '' }: { value: number; start?: boolean; duration?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  const go = start ?? seen;
  useEffect(() => {
    if (!go) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration, ease: EASE });
    return () => c.stop();
  }, [go, value, duration, reduce, mv]);
  return <motion.span ref={ref} className={`tabular ${className}`}>{text}</motion.span>;
}

/** Card with a soft light that follows the pointer. */
export function Spotlight({ children, className = '', color = 'rgba(212,242,92,0.14)' }: { children: React.ReactNode; className?: string; color?: string }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const bg = useTransform([mx, my], ([x, y]) => `radial-gradient(420px circle at ${x}px ${y}px, ${color}, transparent 70%)`);
  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: bg }} />
      {children}
    </div>
  );
}
