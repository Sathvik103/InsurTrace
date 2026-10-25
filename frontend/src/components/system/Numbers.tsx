'use client';

import React from 'react';

export function Numbers() {
  const stats = [
    ['10', 'system parts'],
    ['16', 'database tables'],
    ['305', 'engine parity tests'],
    ['64', 'backend tests'],
    ['26', 'guide articles'],
    ['0', 'AI-generated numbers'],
  ];
  return (
    <section className="border-b border-ink-100 bg-white px-5 py-12">
      <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-6 md:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={v}>
            <dt className="font-display text-3xl font-semibold tracking-tight text-ink-950">{k}</dt>
            <dd className="mt-1 text-xs text-ink-500">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
