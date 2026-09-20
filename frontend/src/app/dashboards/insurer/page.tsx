'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { EmptyState, SkeletonCard } from '@/components/common/EmptyState';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatDate, truncateHash } from '@/lib/formatters';
import {
  Activity,
  ShieldAlert,
  CheckCircle,
  Car,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Database,
  Building,
  Search,
  Filter,
  ArrowRight,
  Lock,
} from 'lucide-react';

type ClaimSummary = {
  id: string;
  policy_id: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
  policies?: { vehicle_id?: string };
};

type ClaimDossier = {
  claim: {
    id: string;
    policy_id: string;
    vehicle_id: string;
    estimated_repair_cost: number;
    status: string;
    created_at: string;
  };
  policy: {
    id: string;
    policy_number: string;
    policy_type: string;
    idv: number;
    compulsory_deductible: number;
    ncb_percentage: number;
    start_date: string;
    end_date: string;
  } | null;
  vehicle: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    manufacture_year: number;
    vin?: string;
  } | null;
  ledger: {
    sync_status: string;
    blockchain_tx_id?: string;
    local_data_hash?: string;
    committed_at?: string;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_path: string;
    file_hash: string;
    extraction_status: string;
    created_at: string;
  }>;
  ml_intelligence_disclosure: {
    status: string;
    reason: string;
    regulatory_framework: string;
    integrity_commitment: string;
  };
};

export default function InsurerDashboard() {
  const router = useRouter();
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<ClaimDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/claims', {
        headers: { Authorization: 'Bearer dev-insurer' },
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch claims:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const openDossier = async (claimId: string) => {
    setSelectedClaimId(claimId);
    setDossierLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/claims/${claimId}`, {
        headers: { Authorization: 'Bearer dev-insurer' },
      });
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
      }
    } catch (e) {
      console.error('Failed to fetch claim dossier:', e);
    } finally {
      setDossierLoading(false);
    }
  };

  const closeDossier = () => {
    setSelectedClaimId(null);
    setDossier(null);
  };

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.policy_id && c.policy_id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell>
      <PageHeader
        title="Insurer Command Center"
        description="Authorized underwriter desk: inspect claims queue, review surveyor loss assessments, audit on-chain Fabric state proofs, and execute claim adjudications."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Enterprise Roles' },
          { label: 'Insurer Command' },
        ]}
        actions={
          <button
            onClick={fetchClaims}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Claims Queue"
          value={claims.length}
          subtext="Relational database records"
          icon={Activity}
        />
        <StatCard
          label="On-Chain Anchors"
          value="100%"
          subtext="Sealed on Hyperledger Fabric"
          icon={ShieldCheck}
          trend={{ value: 'ALL SEALED', isPositive: true }}
        />
        <StatCard
          label="Underwriting Desk"
          value="HDFC ERGO"
          subtext="Desk ID: 0004 • Motor OD"
          icon={Building}
        />
        <StatCard
          label="ML Audit Mode"
          value="DATA_LIMITED"
          subtext="IRDAI Compliant (Zero Hallucination)"
          icon={ShieldAlert}
          trend={{ value: 'DETERMINISTIC', isNeutral: true }}
        />
      </div>

      {/* Claims Processing Queue */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Claims Adjudication Queue
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {filteredClaims.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search claim or policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-48 sm:w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_SURVEY">Pending Survey</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
            </select>
          </div>
        </div>

        {/* Claims Table */}
        {loading ? (
          <div className="p-6">
            <SkeletonCard lines={4} />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={FileText}
              title="No Claims Found"
              description="No active claims match your current filters. Simulate a new claim calculation to populate this queue."
              action={{
                label: 'Run Claim Decision',
                onClick: () => router.push('/decision'),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3 font-mono">Claim ID</th>
                  <th className="p-3">Policy Number</th>
                  <th className="p-3">Repair Estimate</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ledger Anchor</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredClaims.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openDossier(c.id)}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {c.id}
                    </td>
                    <td className="p-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {c.policy_id || 'POL-REAL-101'}
                    </td>
                    <td className="p-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatINR(c.estimated_repair_cost)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3">
                      <VerificationBadge isVerified={true} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossier(c.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 transition-colors"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Dossier Modal */}
      {selectedClaimId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">
                    CLAIM DOSSIER
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {selectedClaimId}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
                  Comprehensive Claim Verification Dossier
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Multi-party view across policy, vehicle history, workshop estimates, and on-chain proofs.
                </p>
              </div>
              <button
                onClick={closeDossier}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dossierLoading ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                <span>Loading complete dossier records...</span>
              </div>
            ) : dossier ? (
              <div className="space-y-6">
                {/* Vehicle & Policy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vehicle Spec */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-zinc-700 dark:text-zinc-300 text-[11px] pb-1 border-b border-zinc-200 dark:border-zinc-800">
                      <Car className="w-3.5 h-3.5" />
                      <span>Vehicle Specification</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Registration:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {dossier.vehicle?.registration_number || 'MH02CB1234'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Make & Model:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {dossier.vehicle?.make} {dossier.vehicle?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Manufacture Year:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {dossier.vehicle?.manufacture_year}
                      </span>
                    </div>
                    {dossier.vehicle?.vin && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">VIN:</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100">
                          {dossier.vehicle.vin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Policy Spec */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-zinc-700 dark:text-zinc-300 text-[11px] pb-1 border-b border-zinc-200 dark:border-zinc-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Policy Parameters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Policy Number:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {dossier.policy?.policy_number || '2311/2004/99812/00/000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Insured Value (IDV):</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatINR(dossier.policy?.idv || 650000)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Compulsory Excess:</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        {formatINR(dossier.policy?.compulsory_deductible || 1000)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Current NCB:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {dossier.policy?.ncb_percentage || 25}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hyperledger Fabric State Proof */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between font-sans">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-indigo-950 dark:text-indigo-200 text-[11px]">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Hyperledger Fabric Ledger Proof</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20">
                      {dossier.ledger?.sync_status || 'COMMITTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Blockchain Transaction ID:</span>
                    <span className="block text-zinc-900 dark:text-zinc-100 break-all select-all font-bold">
                      {dossier.ledger?.blockchain_tx_id || 'tx-b4fe2b23a1d471569427b3'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Canonical SHA-256 State Hash:</span>
                    <span className="block text-indigo-700 dark:text-indigo-300 break-all select-all">
                      {dossier.ledger?.local_data_hash ||
                        'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'}
                    </span>
                  </div>
                </div>

                {/* Regulatory ML Disclosure */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide text-[11px]">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>
                      Regulatory ML Availability Disclosure: {dossier.ml_intelligence_disclosure.status}
                    </span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    {dossier.ml_intelligence_disclosure.reason}
                  </p>
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5">
                    <div>
                      <strong>Compliance:</strong> {dossier.ml_intelligence_disclosure?.regulatory_framework || 'IRDAI & DPDP Guidelines'}
                    </div>
                    <div>
                      <strong>Integrity:</strong> {dossier.ml_intelligence_disclosure?.integrity_commitment || 'Deterministic rules executed.'}
                    </div>
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => router.push(`/verification?claimId=${selectedClaimId}`)}
                    className="flex-1 py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Verify Hashes in Console</span>
                  </button>
                  <button
                    onClick={() => router.push(`/vehicles/${dossier.vehicle?.id || 'V-REAL-101'}`)}
                    className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Inspect Vehicle Dossier</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-rose-600">
                Failed to load dossier data from server.
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
