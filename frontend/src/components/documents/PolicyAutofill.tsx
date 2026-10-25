'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, FileUp, RotateCcw } from 'lucide-react';
import { apiFetch, describeApiError } from '@/lib/api';
import { rupees } from '@/lib/claimCheck';

/** Values a policy schedule can give us. Anything not found stays undefined. */
export interface PolicyValues {
  idv?: number;
  ncb?: number;
  deductible?: number;
  premium?: number;
  zeroDep?: boolean;
  policyNumber?: string;
  registration?: string;
  validTo?: string;
}

type Field = { value: string | number | boolean | null };
interface ExtractResponse {
  ocr_used?: boolean;
  is_scanned?: boolean;
  extracted_fields: Record<string, Field>;
}

const num = (f?: Field) => (f && f.value !== null && f.value !== '' && Number.isFinite(Number(f.value)) ? Number(f.value) : undefined);
const str = (f?: Field) => (f && f.value !== null && f.value !== '' ? String(f.value) : undefined);

function toValues(fields: Record<string, Field>): PolicyValues {
  return {
    idv: num(fields.idv_amount),
    ncb: num(fields.ncb_percentage),
    deductible: num(fields.compulsory_deductible),
    premium: num(fields.od_premium),
    zeroDep: fields.has_zero_dep?.value === true ? true : undefined,
    policyNumber: str(fields.policy_number),
    registration: str(fields.registration_number)?.replace(/[\s-]/g, '').toUpperCase(),
    validTo: str(fields.valid_to),
  };
}

// The fields shown back to the user, in order, with how to display each.
const SHOWN: { key: 'idv' | 'ncb' | 'deductible' | 'premium' | 'zeroDep'; label: string; show: (v: PolicyValues) => string }[] = [
  { key: 'idv', label: 'IDV', show: (v) => rupees(v.idv!) },
  { key: 'ncb', label: 'No-Claim Bonus', show: (v) => `${v.ncb}%` },
  { key: 'deductible', label: 'Deductible', show: (v) => rupees(v.deductible!) },
  { key: 'premium', label: 'Own-damage premium', show: (v) => rupees(v.premium!) },
  { key: 'zeroDep', label: 'Zero-dep cover', show: () => 'Yes' },
];

/**
 * "Upload your policy and we'll fill this in." Reads a PDF, a scanned PDF or a
 * photo (OCR on the server), then hands the values to the form. The user still
 * sees and can change every field.
 */
export function PolicyAutofill({ onApply, compact = false }: { onApply: (v: PolicyValues) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [found, setFound] = useState<PolicyValues>({});
  const [ocr, setOcr] = useState(false);
  const [message, setMessage] = useState('');

  const read = async (file: File) => {
    setState('reading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', 'POLICY');
      const data = await apiFetch<ExtractResponse>('/api/v1/documents/extract', { method: 'POST', body: fd, timeoutMs: 90000 });
      const v = toValues(data.extracted_fields || {});
      setFound(v);
      setOcr(!!data.ocr_used);
      onApply(v);
      setState('done');
      if (!SHOWN.some((f) => v[f.key] !== undefined)) {
        setMessage('We couldn’t find the figures in this document. Please type them below.');
        setState('error');
      }
    } catch (e) {
      setMessage(describeApiError(e).message);
      setState('error');
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept="application/pdf,image/jpeg,image/png"
      className="sr-only"
      aria-label="Upload your policy document"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) read(f);
        e.target.value = '';
      }}
    />
  );

  if (compact && state === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        {picker}
        <button type="button" onClick={() => input.current?.click()} className="font-semibold text-forest-700 underline-offset-2 hover:underline">
          Can’t find it? Upload your policy and we’ll read it
        </button>
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-paper p-4">
      {picker}
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink-950">Have your policy schedule?</p>
              <p className="text-sm text-ink-500">Upload the PDF or a photo of it and we’ll fill these in. You can check and change every value.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => input.current?.click()} className="vs-btn-primary py-2.5">
                <FileUp className="h-4 w-4" /> Upload policy
              </button>
            </div>
          </motion.div>
        )}

        {state === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" className="space-y-2">
            <p className="flex items-center gap-2 font-semibold text-ink-950"><Camera className="h-4 w-4 text-forest-700" /> Reading your policy…</p>
            <div className="h-1.5 overflow-hidden rounded-sm bg-ink-100">
              <motion.div className="h-full w-1/3 bg-forest-600" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <p className="text-xs text-ink-500">Photos and scanned pages take a little longer.</p>
          </motion.div>
        )}

        {(state === 'done' || state === 'error') && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {state === 'done' ? (
              <>
                <p className="font-semibold text-ink-950">Filled in from your policy{ocr ? ' photo' : ''}. Please check each value.</p>
                <ul className="flex flex-wrap gap-1.5">
                  {SHOWN.map((f) =>
                    found[f.key] !== undefined ? (
                      <li key={f.key} className="rounded-md bg-white px-2 py-1 text-xs ring-1 ring-ink-100">
                        <span className="text-ink-500">{f.label}</span> <span className="font-semibold text-ink-950">{f.show(found)}</span>
                      </li>
                    ) : (
                      <li key={f.key} className="rounded-md border border-dashed border-loss/40 px-2 py-1 text-xs text-loss">{f.label}: not found</li>
                    )
                  )}
                </ul>
                {ocr && <p className="text-xs text-amber-800">Read from an image with OCR, which can misread digits. Compare with your document.</p>}
              </>
            ) : (
              <p className="text-sm text-loss">{message}</p>
            )}
            <button type="button" onClick={() => input.current?.click()} className="vs-btn-secondary py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Use another file
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
