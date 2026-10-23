'use client';

import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Counts smoothly from the previous value to `value`. Formats as Indian rupees by default. */
export function AnimatedNumber({
  value,
  prefix = '₹',
  suffix = '',
  duration = 0.9,
  className = '',
  format = (n: number) => inr.format(Math.round(n)),
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const sign = value < 0 ? '−' : '';
    if (reduce) {
      node.textContent = `${sign}${prefix}${format(Math.abs(value))}${suffix}`;
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${v < 0 ? '−' : ''}${prefix}${format(Math.abs(v))}${suffix}`;
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce, prefix, suffix, duration, format]);

  return (
    <span ref={ref} className={`tabular ${className}`} aria-label={`${prefix}${format(Math.abs(value))}${suffix}`}>
      {prefix}0{suffix}
    </span>
  );
}

export function formatRupees(n: number) {
  return `${n < 0 ? '−' : ''}₹${inr.format(Math.round(Math.abs(n)))}`;
}
