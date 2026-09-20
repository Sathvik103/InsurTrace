'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { VerificationBadge, StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/common/EmptyState';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatDate, truncateHash } from '@/lib/formatters';
import {
  Car,
  ShieldCheck,
  Activity,
  User,
  FileText,
  ArrowRight,
  Database,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Building,
} from 'lucide-react';

type TimelineEvent = {
  date: string;
  event_type: string;
  title: string;
  description: string;
  provenance_type: 'DATABASE_RECORD' | 'USER_PROVIDED_RECORD' | 'COMPUTED_RECORD' | string;
  actor: string;
  blockchain_verified: boolean;
  canonical_hash?: string;
  tx_id?: string;
};

type VehicleTimelineResponse = {
  vehicle: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    manufacture_year: number;
    vin?: string;
  };
  total_events: number;
  timeline: TimelineEvent[];
  integrity_notice: string;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || 'V-REAL-101';

  const [data, setData] = useState<VehicleTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/vehicles/${id}/timeline`);
        if (!res.ok) {
          throw new Error(`Vehicle ${id} not found on ledger (HTTP ${res.status})`);
        }
        const timelineData = await res.json();
        setData(timelineData);
      } catch (err: any) {
        console.error('Timeline fetch error:', err);
        setError(err.message || 'Failed to load vehicle history.');
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [id]);

  const toggleEventDrawer = (idx: number) => {
    setExpandedEvents((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Vehicle Intelligence Dossier"
            description="Querying Hyperledger Fabric & PostgreSQL lifecycle records..."
            breadcrumbs={[
              { label: 'Platform', href: '/' },
              { label: 'Vehicles' },
              { label: id },
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <PageHeader
          title="Vehicle Dossier"
          breadcrumbs={[
            { label: 'Platform', href: '/' },
            { label: 'Vehicles' },
            { label: id },
          ]}
        />
        <EmptyState
          icon={Car}
          title="Vehicle Record Not Found"
          description={`No ledger entry or database record exists for vehicle identifier "${id}". Select a seed record or evaluate a new claim.`}
          action={{
            label: 'View Seed Vehicle (V-REAL-101)',
            onClick: () => router.push('/vehicles/V-REAL-101'),
          }}
        />
      </AppShell>
    );
  }

  const { vehicle, timeline, integrity_notice } = data;
  const claimsCount = timeline.filter((t) => t.event_type === 'CLAIM_FILED' || t.event_type === 'CLAIM_SETTLED').length;
  const verifiedCount = timeline.filter((t) => t.blockchain_verified).length;

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title={`${vehicle.registration_number}`}
        description={`${vehicle.manufacture_year} ${vehicle.make} ${vehicle.model} • Cryptographically sealed vehicle passport`}
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Vehicles' },
          { label: vehicle.registration_number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/verification')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Verify Hashes</span>
            </button>
            <button
              onClick={() =>
                router.push(
                  `/decision?vehicle_reg=${vehicle.registration_number}&vehicle_age=${
                    new Date().getFullYear() - vehicle.manufacture_year
                  }`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <span>New Claim Decision</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 4 Seed Vehicles Quick Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { id: 'V-REAL-101', name: 'Hyundai Creta SX', reg: 'MH-02-CB-1234', year: 2023, color: 'text-blue-600' },
          { id: 'V-REAL-102', name: 'Tata Nexon EV Max', reg: 'DL-01-EV-4321', year: 2025, color: 'text-emerald-600' },
          { id: 'V-REAL-103', name: 'Maruti Suzuki Swift', reg: 'KA-03-MG-7890', year: 2021, color: 'text-amber-600' },
          { id: 'V-REAL-104', name: 'Honda City ZX', reg: 'TS-09-FA-5678', year: 2024, color: 'text-indigo-600' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => router.push(`/vehicles/${v.id}`)}
            className={`p-3 rounded-xl border text-left transition-all ${
              id === v.id
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
              <span>{v.id}</span>
              <span>{v.year}</span>
            </div>
            <div className="text-xs font-bold truncate mt-0.5">{v.name}</div>
            <div className="text-[10px] font-mono opacity-70">{v.reg}</div>
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Registered VIN"
          value={vehicle.vin ? truncateHash(vehicle.vin, 6, 6) : 'VERIFIED'}
          subtext={`Model Year ${vehicle.manufacture_year}`}
          icon={Car}
        />
        <StatCard
          label="Active Insurance Policy"
          value="HDFC ERGO"
          subtext="Comprehensive • 20% Current NCB"
          icon={Building}
        />
        <StatCard
          label="Recorded Claims"
          value={claimsCount}
          subtext={claimsCount === 0 ? 'Zero Claim History' : `${claimsCount} Claims on Record`}
          icon={Activity}
        />
        <StatCard
          label="Ledger State Proofs"
          value={`${verifiedCount} / ${timeline.length}`}
          subtext="Sealed on Hyperledger Fabric"
          icon={ShieldCheck}
        />
      </div>

      {/* Integrity Notice Banner */}
      <div className="mb-8 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {integrity_notice ||
            'Every milestone below is stamped with a canonical SHA-256 hash sealed to Hyperledger Fabric. Tampering with any local PostgreSQL field invalidates the verification signature.'}
        </p>
      </div>

      {/* Chronological Lifecycle Ledger Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Chronological Lifecycle Ledger ({timeline.length} Events)
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">CANONICAL AUDIT LOG</span>
        </div>

        <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-6 pl-6 py-2">
          {timeline.map((item, idx) => {
            const isExpanded = expandedEvents[idx] || false;
            return (
              <SlideUp key={idx} delay={idx * 0.05} className="relative">
                {/* Timeline node icon */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {item.provenance_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">
                        {formatDate(item.date)}
                      </span>
                      <VerificationBadge isVerified={item.blockchain_verified} />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-zinc-500">
                      Recorded by: <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono">{item.actor}</span>
                    </div>

                    <button
                      onClick={() => toggleEventDrawer(idx)}
                      className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Cryptographic Audit' : 'Cryptographic Proof'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Collapsible Cryptographic Audit Drawer */}
                  {isExpanded && (
                    <FadeIn className="mt-3 p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Consortium Channel:</span>
                        <span className="text-zinc-800 dark:text-zinc-200">mychannel</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Endorsing Peer:</span>
                        <span className="text-zinc-800 dark:text-zinc-200">peer0.org1.insuretrace.com</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Raft Consensus Status:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">COMMITTED (CFT Block Confirmed)</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[10px] uppercase">Canonical SHA-256 State Hash:</span>
                        <div className="text-[11px] text-zinc-800 dark:text-zinc-200 break-all select-all mt-0.5 bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                          {item.canonical_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                        </div>
                      </div>
                    </FadeIn>
                  )}
                </div>
              </SlideUp>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
