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
      <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <p>{isSample ? 'Showing a fictional sample quote. Replace the lines with your workshop’s quote.' : 'Your quote. Everything is calculated on your device; nothing is uploaded.'}</p>
        <div className="flex shrink-0 gap-2">
          {isSample ? (
            <button type="button" onClick={() => { setLines([newLine()]); setIsSample(false); }} className="rounded-xl bg-white px-3 py-1.5 font-semibold text-amber-900 ring-1 ring-amber-200">Start with my quote</button>
          ) : (
            <button type="button" onClick={() => { setLines(sample()); setIsSample(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 font-semibold text-amber-900 ring-1 ring-amber-200"><RotateCcw className="h-3.5 w-3.5" /> Load sample</button>
          )}
          <Link href="/login?next=%2Fdecision%2Fextract" className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-1.5 font-semibold text-white"><FileUp className="h-3.5 w-3.5" /> Read a PDF</Link>
        </div>
      </div>
      <XRay lines={lines} onLinesChange={(l) => { setLines(l); setIsSample(false); }} policy={policy} onPolicyChange={setPolicy} />
    </div>
  );
}
