'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';
import {
  FileUp,
  FileCheck,
  AlertCircle,
  Lock,
  Scan,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Edit3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function ProvenanceBadge({ field, isEdited }: { field?: any; isEdited?: boolean }) {
  if (isEdited) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        Entered by you
      </span>
    );
  }
  if (!field) {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
        Not in document
      </span>
    );
  }
  if (field.provenance === 'EXTRACTED') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        From uploaded document (Page {field.page || 1})
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      Verified
    </span>
  );
}

export default function DocumentExtractionPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<'POLICY' | 'ESTIMATE'>('POLICY');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Policy Form State
  const [policyData, setPolicyData] = useState({
    registration_number: '',
    idv_amount: '',
    deductible: '1000',
    ncb_percentage: '20',
    policy_number: '',
    insurer: '',
    vehicle_age: '3',
  });

  // Estimate Form State
  const [estimateData, setEstimateData] = useState({
    repair_cost: '45000',
    part_category: 'metal',
    total_parts: '35000',
    total_labour: '10000',
    gst: '8100',
    grand_total: '53100',
  });

  const [humanCorrectedFields, setHumanCorrectedFields] = useState<Record<string, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setFile(e.target.files[0]);
    setErrorMessage(null);
  };

  const markFieldEdited = (fieldKey: string) => {
    setHumanCorrectedFields((prev) => ({ ...prev, [fieldKey]: true }));
  };

  const processDocument = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', docType);

      const res = await fetch(`${API_BASE_URL}/api/v1/documents/extract`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || 'Extraction failed');
      }

      const data = await res.json();
      setExtractedData(data);

      if (docType === 'POLICY') {
        const f = data.extracted_fields || {};
        setPolicyData({
          registration_number: f.registration_number?.value || '',
          idv_amount: f.idv_amount?.value ? String(f.idv_amount.value) : '',
          deductible: f.compulsory_deductible?.value ? String(f.compulsory_deductible.value) : '1000',
          ncb_percentage: f.ncb_percentage?.value ? String(f.ncb_percentage.value) : '20',
          policy_number: f.policy_number?.value || '',
          insurer: f.insurer?.value || '',
          vehicle_age: '3',
        });
      } else {
        const est = data.extracted_fields || {};
        setEstimateData({
          repair_cost: est.grand_total ? String(est.grand_total) : '45000',
          part_category: 'metal',
          total_parts: est.total_parts ? String(est.total_parts) : '35000',
          total_labour: est.total_labour ? String(est.total_labour) : '10000',
          gst: est.gst ? String(est.gst) : '8100',
          grand_total: est.grand_total ? String(est.grand_total) : '53100',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToDecisionEngine = () => {
    const query = new URLSearchParams({
      vehicle_reg: policyData.registration_number,
      idv: policyData.idv_amount,
      deductible: policyData.deductible,
      ncb: policyData.ncb_percentage,
      policy_num: policyData.policy_number,
      insurer: policyData.insurer,
      repair_cost: estimateData.repair_cost || estimateData.grand_total,
      part_category: estimateData.part_category,
      vehicle_age: policyData.vehicle_age,
      from_extract: 'true',
    }).toString();

    router.push(`/decision?${query}`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Document Review"
        description="Upload an insurance policy schedule or garage repair estimate to verify line items, check depreciation, and auto-populate claim math."
        breadcrumbs={[
          { label: 'Platform', href: '/decision' },
          { label: 'Document Review' },
        ]}
      />

      {/* Stepper progress */}
      <div className="mb-8 grid grid-cols-3 gap-2 text-xs">
        <div
          className={`p-3 rounded-lg border ${
            !extractedData
              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500'
          }`}
        >
          1. Upload Document
        </div>
        <div
          className={`p-3 rounded-lg border ${
            extractedData
              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500'
          }`}
        >
          2. Review & Verify
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
          3. Claim Decision
        </div>
      </div>

      {/* Error / Edge Case Banner */}
      {errorMessage && (
        <FadeIn className="mb-6">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
            {errorMessage.includes('password') ? (
              <Lock className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            )}
            <div>
              <div className="font-bold">
                {errorMessage.includes('password') ? 'Encrypted PDF Protected' : 'Document Ingestion Error'}
              </div>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Ingestion & Verification UI */}
      {!extractedData ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Select Document Category
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose the type of document you are uploading for optical parsing
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setDocType('POLICY');
                setFile(null);
                setErrorMessage(null);
              }}
              className={`p-5 rounded-xl border text-left transition-all ${
                docType === 'POLICY'
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <ShieldCheck className="w-6 h-6 text-zinc-800 dark:text-zinc-200 mb-2" />
              <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Motor Insurance Policy Schedule
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Extracts IDV, current NCB, compulsory deductible, and insurer
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocType('ESTIMATE');
                setFile(null);
                setErrorMessage(null);
              }}
              className={`p-5 rounded-xl border text-left transition-all ${
                docType === 'ESTIMATE'
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Wrench className="w-6 h-6 text-zinc-800 dark:text-zinc-200 mb-2" />
              <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Garage Repair Estimate Bill
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Extracts parts breakdown, labour operations, GST, and grand total
              </div>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Select {docType === 'POLICY' ? 'Policy PDF Schedule' : 'Garage Estimate PDF'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Multi-page supported • Password-protected PDFs safely flagged
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800"
            />
            <button
              onClick={processDocument}
              disabled={!file || loading}
              className="mt-3 px-5 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Text & Tables...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Optical Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Human Verification View */
        <FadeIn className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Human Verification & Provenance Confirmation
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Parsed from: <span className="font-mono text-zinc-800 dark:text-zinc-200">{extractedData.filename}</span>
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {extractedData.total_pages} Page(s) Processed
              </span>
            </div>

            {docType === 'POLICY' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Vehicle Registration Number
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.registration_number}
                      isEdited={humanCorrectedFields['registration_number']}
                    />
                  </div>
                  <input
                    type="text"
                    value={policyData.registration_number}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, registration_number: e.target.value });
                      markFieldEdited('registration_number');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Insured Declared Value (IDV ₹)
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.idv_amount}
                      isEdited={humanCorrectedFields['idv_amount']}
                    />
                  </div>
                  <input
                    type="number"
                    value={policyData.idv_amount}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, idv_amount: e.target.value });
                      markFieldEdited('idv_amount');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Compulsory Deductible (₹)
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.compulsory_deductible}
                      isEdited={humanCorrectedFields['deductible']}
                    />
                  </div>
                  <input
                    type="number"
                    value={policyData.deductible}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, deductible: e.target.value });
                      markFieldEdited('deductible');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      No-Claim Bonus (NCB %)
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.ncb_percentage}
                      isEdited={humanCorrectedFields['ncb_percentage']}
                    />
                  </div>
                  <input
                    type="number"
                    value={policyData.ncb_percentage}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, ncb_percentage: e.target.value });
                      markFieldEdited('ncb_percentage');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Policy Certificate Number
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.policy_number}
                      isEdited={humanCorrectedFields['policy_number']}
                    />
                  </div>
                  <input
                    type="text"
                    value={policyData.policy_number}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, policy_number: e.target.value });
                      markFieldEdited('policy_number');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Insurance Underwriter
                    </label>
                    <ProvenanceBadge
                      field={extractedData.extracted_fields?.insurer}
                      isEdited={humanCorrectedFields['insurer']}
                    />
                  </div>
                  <input
                    type="text"
                    value={policyData.insurer}
                    onChange={(e) => {
                      setPolicyData({ ...policyData, insurer: e.target.value });
                      markFieldEdited('insurer');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Total Parts Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={estimateData.total_parts}
                    onChange={(e) => setEstimateData({ ...estimateData, total_parts: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Total Labour Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={estimateData.total_labour}
                    onChange={(e) => setEstimateData({ ...estimateData, total_labour: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Applicable GST (18% ₹)
                  </label>
                  <input
                    type="number"
                    value={estimateData.gst}
                    onChange={(e) => setEstimateData({ ...estimateData, gst: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Grand Total Estimate (₹)
                  </label>
                  <input
                    type="number"
                    value={estimateData.grand_total}
                    onChange={(e) =>
                      setEstimateData({
                        ...estimateData,
                        grand_total: e.target.value,
                        repair_cost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setExtractedData(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Upload Different File
              </button>

              <button
                onClick={proceedToDecisionEngine}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <span>Transfer Verified Parameters to Decision Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </FadeIn>
      )}
    </AppShell>
  );
}
