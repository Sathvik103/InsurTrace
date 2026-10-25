'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { BodyType } from '@/lib/bodyType';
import { CarDiagram } from './CarDiagram';

// three.js is large, so the 3D view is fetched only when this step opens.
const Car3D = dynamic(() => import('./Car3D'), {
  ssr: false,
  loading: () => <div className="vs-shimmer h-72 rounded-xl sm:h-80" />,
});

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Where was the car damaged? 3D car by default, top-down diagram as a choice and as the fallback. */
export function DamagePicker({ type, paint, selected, onToggle }: { type: BodyType; paint: string; selected: Set<string>; onToggle: (id: string) => void }) {
  const [canWebgl] = useState(() => typeof window !== 'undefined' && webglAvailable());
  const [mode, setMode] = useState<'3d' | 'top'>(canWebgl ? '3d' : 'top');

  return (
    <div className="space-y-3">
      {canWebgl && (
        <div className="inline-flex rounded-lg bg-ink-50 p-1" role="tablist" aria-label="Car view">
          {(['3d', 'top'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === m ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'}`}>
              {m === '3d' ? '3D car' : 'Top view'}
            </button>
          ))}
        </div>
      )}
      {mode === '3d' ? <Car3D type={type} paint={paint} selected={selected} onToggle={onToggle} /> : <CarDiagram type={type} selected={selected} onToggle={onToggle} />}
    </div>
  );
}
