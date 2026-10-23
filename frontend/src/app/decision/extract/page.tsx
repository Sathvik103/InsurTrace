'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileCheck2, FileText, FileUp, Lock, Plus, RotateCcw, ScanLine, Trash2, Wrench } from 'lucide-react';
import { AppShell } from '@/components/layout/Shell';
import { apiFetch, ApiError } from '@/lib/api';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { PartCategory, rupees } from '@/lib/claimCheck';
import { saveHandoff } from '@/lib/extractHandoff';
import { useAssistant } from '@/context/AssistantContext';

const EASE = [0.16, 1, 0.3, 1] as const;
type DocType = 'POLICY' | 'ESTIMATE';

interface ExtractedField {
  value: string | number | null;
  confidence?: number;
  source_page?: number | null;
}

interface ExtractResponse {
  document_type: DocType;
  filename: string;
  is_scanned: boolean;
  total_pages: number;
  extracted_fields: Record<string, ExtractedField> & {
    line_items?: { part_name: string; category: string; estimated_cost: number; source_page?: number }[];
    gst?: number | null;
    document_total?: number | null;
    grand_total?: number | null;
  };
}

const POLICY_FIELDS: { key: string; label: string; money?: boolean; help?: string }[] = [
  { key: 'idv_amount', label: 'IDV (Insured Declared Value)', money: true, help: 'What is IDV?' },
  { key: 'ncb_percentage', label: 'No-Claim Bonus (%)', help: 'How does No-Claim Bonus (NCB) work?' },
  { key: 'compulsory_deductible', label: 'Compulsory deductible', money: true, help: 'What is a deductible?' },
  { key: 'policy_number', label: 'Policy number' },
  { key: 'registration_number', label: 'Registration number' },
  { key: 'insurer', label: 'Insurer' },
  { key: 'valid_from', label: 'Cover starts' },
  { key: 'valid_to', label: 'Cover ends' },
];

const CATEGORIES: { value: PartCategory; label: string }[] = [
  { value: 'metal', label: 'Metal part' },
  { value: 'plastic', label: 'Plastic / rubber part' },
  { value: 'glass', label: 'Glass' },
  { value: 'fiberglass', label: 'Fibreglass' },
  { value: 'labour', label: 'Labour / painting' },
];

const SAMPLES: Record<DocType, { file: string; name: string }> = {
  POLICY: { file: '/samples/sample-policy-schedule.pdf', name: 'sample-policy-schedule.pdf' },
  ESTIMATE: { file: '/samples/sample-workshop-estimate.pdf', name: 'sample-workshop-estimate.pdf' },
};

interface LineItem {
  label: string;
  category: PartCategory;
  cost: string;
  page?: number;
  edited?: boolean;
}

export default function DocumentsPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { open } = useAssistant();
  const inputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<DocType>('ESTIMATE');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [isSample, setIsSample] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<LineItem[]>([]);

  const run = useCallback(
    async (f: File, type: DocType, sample = false) => {
      setFile(f);
      setIsSample(sample);
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('document_type', type);
        const [data] = await Promise.all([
          apiFetch<ExtractResponse>('/api/v1/documents/extract', { method: 'POST', body: fd, timeoutMs: 90000 }),
          new Promise((r) => setTimeout(r, reduce ? 0 : 1100)),
        ]);
        setResult(data);
        setEdited({});
        if (type === 'POLICY') {
          const v: Record<string, string> = {};
          for (const fdef of POLICY_FIELDS) {
            const raw = data.extracted_fields[fdef.key]?.value;
            v[fdef.key] = raw === null || raw === undefined ? '' : String(raw);
          }
          setValues(v);
        } else {
          setItems(
            (data.extracted_fields.line_items || []).map((i) => ({
              label: i.part_name,
              category: (CATEGORIES.some((c) => c.value === i.category) ? i.category : 'metal') as PartCategory,
              cost: String(Math.round(i.estimated_cost)),
              page: i.source_page,
            }))
          );
          setValues({ total: data.extracted_fields.document_total ? String(data.extracted_fields.document_total) : '' });
        }
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [reduce]
  );

  const pick = (f?: File | null) => {
    if (!f) return;
    if (f.type && f.type !== 'application/pdf') {
      setError(new ApiError('validation', 'Not a PDF', { detail: 'Please choose a PDF file. Photos and scans without text can’t be read yet.' }));
      return;
    }
    run(f, docType);
  };

  const trySample = async () => {
    const s = SAMPLES[docType];
    const blob = await fetch(s.file).then((r) => r.blob());
    run(new File([blob], s.name, { type: 'application/pdf' }), docType, true);
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setItems([]);
    setValues({});
  };

  const itemsTotal = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
  const num = (k: string) => {
    const n = parseFloat((values[k] || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  };

  const continueToCheck = () => {
    if (!result) return;
    if (result.document_type === 'POLICY') {
      saveHandoff({
        policy: {
          idv: num('idv_amount'),
          ncb: num('ncb_percentage'),
          deductible: num('compulsory_deductible'),
          policyNumber: values.policy_number || undefined,
          registrationNumber: values.registration_number?.replace(/[\s-]/g, '').toUpperCase() || undefined,
        },
      });
    } else {
      saveHandoff({
        items: items.filter((i) => parseFloat(i.cost) > 0).map((i) => ({ label: i.label || 'Repair item', category: i.category, cost: parseFloat(i.cost) })),
        total: items.length ? undefined : num('total'),
      });
    }
    router.push('/decision?from_extract=true');
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <span className="vs-chip"><FileText className="h-3.5 w-3.5 text-steel-600" /> Documents</span>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Read a policy or repair estimate</h1>
          <p className="text-base text-navy-600">Upload a PDF and VeriSure picks out the numbers that matter. You check them before anything is used.</p>
        </header>

        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.section key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: EASE }} className="vs-surface space-y-6 p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['ESTIMATE', 'Workshop estimate', 'The repair quote with parts and labour', Wrench],
                  ['POLICY', 'Policy schedule', 'The page with your IDV, NCB and deductible', FileCheck2],
                ] as const).map(([t, title, body, Icon]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    aria-pressed={docType === t}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${docType === t ? 'border-navy-900 bg-navy-900 text-white shadow-lg' : 'border-navy-100 bg-white hover:border-navy-300'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${docType === t ? 'bg-white/10' : 'bg-navy-50 text-navy-600'}`}><Icon className="h-5 w-5" /></span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className={`block text-xs ${docType === t ? 'text-navy-200' : 'text-navy-500'}`}>{body}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pick(e.dataTransfer.files?.[0]);
                }}
                className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${dragging ? 'border-steel-500 bg-steel-50' : 'border-navy-200 bg-navy-50/30'}`}
              >
                <motion.span animate={dragging ? { y: -6, scale: 1.05 } : { y: 0, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-sm ring-1 ring-navy-100">
                  <FileUp className="h-6 w-6" />
                </motion.span>
                <p className="font-semibold text-navy-900">Drop your PDF here</p>
                <p className="text-sm text-navy-500">Text-based PDFs up to 10 MB. Photographed or scanned pages can’t be read yet.</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="vs-btn-primary mt-2">Choose a file</button>
                <input ref={inputRef} type="file" accept="application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose a PDF" />
              </div>

              {error != null && <ApiErrorNotice error={error} onRetry={file ? () => run(file, docType, isSample) : undefined} />}

              <div className="flex flex-col gap-3 border-t border-navy-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-navy-500"><Lock className="h-4 w-4" /> Read on the VeriSure server and not stored.</p>
                <button type="button" onClick={trySample} className="font-semibold text-steel-700 hover:underline">
                  No document handy? Try a sample {docType === 'POLICY' ? 'policy' : 'estimate'} →
                </button>
              </div>
            </motion.section>
          )}

          {loading && (
            <motion.section key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="vs-surface flex flex-col items-center gap-6 p-12 text-center" role="status">
              <div className="relative h-32 w-24 overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
                {[18, 30, 42, 54, 66, 78, 90].map((y, i) => (
                  <span key={y} className="absolute left-3 h-1.5 rounded-full bg-navy-100" style={{ top: y, width: i % 3 === 0 ? 48 : 64 }} />
                ))}
                <motion.span className="absolute inset-x-0 h-8 bg-gradient-to-b from-steel-400/0 via-steel-400/40 to-steel-400/0" animate={{ top: [-32, 128] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
              </div>
              <div>
                <p className="flex items-center justify-center gap-2 font-semibold text-navy-900"><ScanLine className="h-4 w-4" /> Reading {file?.name}</p>
                <p className="text-sm text-navy-500">Looking for {docType === 'POLICY' ? 'IDV, No-Claim Bonus and deductible' : 'parts, labour and totals'}…</p>
              </div>
            </motion.section>
          )}

          {result && !loading && (
            <motion.section key="review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="space-y-5">
              <div className="vs-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gain-soft text-gain"><FileCheck2 className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-900">{result.filename}</p>
                  <p className="text-sm text-navy-500">{result.total_pages} page{result.total_pages > 1 ? 's' : ''} read{isSample ? ' · fictional sample document' : ''}. Check each value below.</p>
                </div>
                <button type="button" onClick={reset} className="vs-btn-secondary py-2"><RotateCcw className="h-4 w-4" /> Different file</button>
              </div>

              {result.is_scanned && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">This looks like a scanned page with no readable text, so nothing could be extracted. Please enter the values yourself.</p>
              )}

              {result.document_type === 'POLICY' ? (
                <div className="vs-surface divide-y divide-navy-50">
                  {POLICY_FIELDS.map((f, i) => {
                    const src = result.extracted_fields[f.key];
                    const found = src?.value !== null && src?.value !== undefined;
                    return (
                      <motion.div key={f.key} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="grid gap-2 p-4 sm:grid-cols-[1fr_220px] sm:items-center">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium text-navy-900">
                            {f.label}
                            {f.help && <button type="button" onClick={() => open(f.help)} className="text-xs font-normal text-steel-700 hover:underline">What’s this?</button>}
                          </p>
                          <FieldBadge found={found} edited={!!edited[f.key]} page={src?.source_page} />
                        </div>
                        <input
                          value={values[f.key] ?? ''}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, [f.key]: e.target.value }));
                            setEdited((x) => ({ ...x, [f.key]: true }));
                          }}
                          placeholder={found ? '' : 'Not found: please enter'}
                          className={`vs-input py-2.5 text-sm ${f.money ? 'tabular' : ''} ${!found && !values[f.key] ? 'border-amber-300 bg-amber-50/40' : ''}`}
                          aria-label={f.label}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="vs-surface p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-navy-900">Repair items</h2>
                    <p className="text-sm text-navy-500">Material decides how much insurers deduct.</p>
                  </div>
                  {items.length === 0 && (
                    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                      No itemised table was found.{' '}
                      {values.total ? `The document shows a total of ${rupees(parseFloat(values.total))}.` : 'Add the items from your quote below.'} For the most accurate estimate, add each part.
                    </p>
                  )}
                  <ul className="mt-4 space-y-2">
                    <AnimatePresence initial={false}>
                      {items.map((it, idx) => (
                        <motion.li key={idx} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: reduce ? 0 : idx * 0.04 }} className="grid gap-2 rounded-2xl border border-navy-100 p-3 sm:grid-cols-[1fr_170px_130px_auto] sm:items-center">
                          <div>
                            <input value={it.label} onChange={(e) => setItems((all) => all.map((x, k) => (k === idx ? { ...x, label: e.target.value, edited: true } : x)))} className="w-full bg-transparent text-sm font-medium text-navy-900 focus:outline-none" aria-label="Item description" />
                            <FieldBadge found={it.page !== undefined} edited={!!it.edited} page={it.page} />
                          </div>
                          <select value={it.category} onChange={(e) => setItems((all) => all.map((x, k) => (k === idx ? { ...x, category: e.target.value as PartCategory, edited: true } : x)))} className="vs-input py-2 text-sm" aria-label="Material">
                            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <input value={it.cost} inputMode="numeric" onChange={(e) => setItems((all) => all.map((x, k) => (k === idx ? { ...x, cost: e.target.value.replace(/[^\d.]/g, ''), edited: true } : x)))} className="vs-input tabular py-2 text-sm" aria-label="Cost in rupees" />
                          <button type="button" onClick={() => setItems((all) => all.filter((_, k) => k !== idx))} className="justify-self-end rounded-full p-2 text-navy-300 hover:bg-navy-50 hover:text-loss" aria-label={`Remove ${it.label}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <button type="button" onClick={() => setItems((all) => [...all, { label: '', category: 'metal', cost: '', edited: true }])} className="vs-chip mt-3 hover:border-navy-300"><Plus className="h-3.5 w-3.5" /> Add an item</button>
                  <div className="mt-5 flex flex-col gap-1 border-t border-navy-100 pt-4 text-sm sm:flex-row sm:justify-between">
                    <span className="text-navy-600">Total of items (before GST)</span>
                    <span className="tabular text-lg font-semibold text-navy-900">{rupees(itemsTotal)}</span>
                  </div>
                  {result.extracted_fields.gst ? <p className="mt-1 text-xs text-navy-500">The document also lists GST of {rupees(result.extracted_fields.gst)}. Insurers usually reimburse GST on admissible amounts.</p> : null}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-navy-500">Values you change are marked “Edited by you” so it stays clear where each number came from.</p>
                <button type="button" onClick={continueToCheck} disabled={result.document_type === 'ESTIMATE' && itemsTotal <= 0 && !num('total')} className="vs-btn-primary shrink-0">
                  Use in a claim check <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function FieldBadge({ found, edited, page }: { found: boolean; edited: boolean; page?: number | null }) {
  if (edited) return <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Edited by you</span>;
  if (!found) return <span className="mt-1 inline-block rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-500">Not found in document</span>;
  return <span className="mt-1 inline-block rounded-full bg-steel-50 px-2 py-0.5 text-[11px] font-medium text-steel-700">From your document{page ? `, page ${page}` : ''}</span>;
}
