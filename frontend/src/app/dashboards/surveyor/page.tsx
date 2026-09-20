'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState, SkeletonCard } from '@/components/common/EmptyState';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatDate } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api';
import {
  ClipboardList,
  Camera,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
  FileText,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';

type ClaimAssignment = {
  id: string;
  policy_id: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
};

type VisionResult = {
  status: string;
  image_hash: string;
  detected_damages: any[];
  limitations: string;
  recommendations: string[];
};

export default function SurveyorDashboard() {
  const [assignments, setAssignments] = useState<ClaimAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [surveyPhoto, setSurveyPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/claims`, {
        headers: { Authorization: 'Bearer dev-surveyor' },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch surveyor assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSurveyPhoto(e.target.files[0]);
      setVisionResult(null);
      setErrorMessage(null);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!surveyPhoto || !selectedClaim) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', surveyPhoto);

      const res = await fetch(
        `${API_BASE_URL}/api/v1/surveyor/inspect-damage?claim_id=${selectedClaim}`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer dev-surveyor' },
          body: fd,
        }
      );
      if (!res.ok) {
        throw new Error(`Assessment service returned status ${res.status}`);
      }
      const data = await res.json();
      setVisionResult(data);
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setErrorMessage(err.message || 'Damage vision service encountered an issue.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Surveyor Assessment Workspace"
        description="Licensed motor loss assessor portal: inspect assigned claims, evaluate physical parts admissibility per IRDAI schedules, and record damage photo SHA-256 hashes."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Enterprise Roles' },
          { label: 'Surveyor Assessment' },
        ]}
        actions={
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Assignments</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Surveys"
          value={assignments.length}
          subtext="Assigned loss assessments"
          icon={ClipboardList}
        />
        <StatCard
          label="Assessor Mode"
          value="INDEPENDENT"
          subtext="Standard Motor Assessment"
          icon={ShieldCheck}
        />
        <StatCard
          label="Tariff Standard"
          value="IRDAI 2026"
          subtext="Metal / Plastic / Glass Norms"
          icon={Scale}
        />
        <StatCard
          label="Damage Vision Mode"
          value="EXPERIMENTAL"
          subtext="Advisory Only (Assessor Decides)"
          icon={Camera}
          trend={{ value: 'ADVISORY', isNeutral: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Assignments Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Assigned Inspections Queue
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {assignments.length} pending
              </span>
            </div>

            {loading ? (
              <SkeletonCard lines={3} />
            ) : assignments.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No Inspections Assigned"
                description="Your inspection queue is clear. New claims filed by policyholders will appear here for damage assessment."
              />
            ) : (
              <div className="space-y-2">
                {assignments.map((item) => {
                  const isSelected = selectedClaim === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedClaim(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {item.id}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-zinc-500">Estimate:</span>
                        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatINR(item.estimated_repair_cost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                        <span>Policy: {item.policy_id || 'POL-REAL-101'}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* IRDAI Parts Admissibility Guide Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-5 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              Statutory Depreciation Schedule Reference
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Rubber, Nylon & Plastic Parts:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">50% Depreciation</span>
              </div>
              <div className="flex justify-between">
                <span>Glass Components:</span>
                <span className="font-bold text-emerald-600">0% (Nil Depreciation)</span>
              </div>
              <div className="flex justify-between">
                <span>Fiberglass Components:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">30% Depreciation</span>
              </div>
              <div className="flex justify-between">
                <span>Metal Parts (Age-Graduated):</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">0% to 50%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Photo & Vision Evidence Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Damage Photo Evidence & Hash Sealing
              </h3>
              {selectedClaim && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Target: {selectedClaim}
                </span>
              )}
            </div>

            {!selectedClaim ? (
              <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
                Select an assigned inspection claim from the left queue to evaluate photos.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center space-y-2">
                  <Camera className="w-8 h-8 text-zinc-400 mx-auto mb-1" />
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Upload Physical Inspection Photo
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Photo will be hashed with SHA-256 and committed to the claim audit trail.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 pt-2"
                  />
                </div>

                <button
                  onClick={uploadAndAnalyze}
                  disabled={uploading || !surveyPhoto}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing Cryptographic Hash & Running Vision...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Seal Photo Hash & Analyze</span>
                    </>
                  )}
                </button>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {visionResult && (
                  <FadeIn className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Evidence Sealed</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">
                        {visionResult.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 break-all">
                      <span className="text-zinc-400 block text-[10px] uppercase">Photo SHA-256 Digest:</span>
                      {visionResult.image_hash}
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200 dark:border-amber-900/30">
                      <div className="font-semibold text-amber-900 dark:text-amber-200 text-[11px] mb-0.5">
                        Advisory Limitation Notice:
                      </div>
                      {visionResult.limitations ||
                        'Damage vision analysis is experimental advisory support. Final assessment must be certified by the licensed surveyor.'}
                    </div>
                  </FadeIn>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
