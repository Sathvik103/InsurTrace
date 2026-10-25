'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileUp, RotateCcw } from 'lucide-react';
import { XRay } from '@/components/xray/XRay';
import { newLine, SAMPLE_QUOTE, XLine, XPolicy } from '@/lib/xray';

const sample = () => SAMPLE_QUOTE.map((l) => newLine(l.label, l.category, l.cost));

/** Public, sign-in-free X-ray. Starts with a fictional sample quote. */
export function XRayPlayground() {
  const [lines, setLines] = useState<XLine[]>(sample);
  const [isSample, setIsSample] = useState(true);
  const [policy, setPolicy] = useState<XPolicy>({ ageYears: 3, deductible: 1000, zeroDep: false, idv: 600000 });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-white p-3 pl-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-ink-600">
          <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${isSample ? 'bg-amber-100 text-amber-900' : 'bg-ink-950 text-signal'}`}>{isSample ? 'Sample quote' : 'Your quote'}</span>
          {isSample ? 'Fictional figures. Replace them with your workshop’s lines.' : 'Calculated on your device. Nothing is uploaded.'}
        </p>
        <div className="flex shrink-0 gap-2">
          {isSample ? (
            <button type="button" onClick={() => { setLines([newLine()]); setIsSample(false); }} className="vs-btn-secondary py-2">Start with my quote</button>
          ) : (
            <button type="button" onClick={() => { setLines(sample()); setIsSample(true); }} className="vs-btn-secondary py-2"><RotateCcw className="h-3.5 w-3.5" /> Load sample</button>
          )}
          <Link href="/login?next=%2Fdecision%2Fextract" className="vs-btn-primary py-2"><FileUp className="h-3.5 w-3.5" /> Read a PDF</Link>
        </div>
      </div>
      <XRay lines={lines} onLinesChange={(l) => { setLines(l); setIsSample(false); }} policy={policy} onPolicyChange={setPolicy} />
    </div>
  );
}
