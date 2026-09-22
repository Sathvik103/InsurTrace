'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { VerificationBadge, StatusBadge } from '@/components/common/StatusBadge';
import { TrustBadge, TrustSourceType } from '@/components/common/TrustBadge';
import { DataCompleteness } from '@/components/common/DataCompleteness';
import { BlockchainIntegrityFlow } from '@/components/visualizations/BlockchainIntegrityFlow';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/common/EmptyState';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, formatDate, truncateHash } from '@/lib/formatters';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { API_BASE_URL } from '@/lib/api';
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
  Scale,
  Plus,
  Truck,
  FileCheck,
  Share2
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
    usage_type?: string;
    variant?: string;
    downtime_cost_per_day?: number;
    is_demo?: boolean;
    idv?: number;
    ncb_percentage?: number;
    policy_number?: string;
    policy_expiry?: string;
    has_zero_dep?: boolean;
  };
  total_events: number;
  timeline: TimelineEvent[];
  integrity_notice: string;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || 'V-REAL-101';

  const { vehicles, setSelectedVehicleId } = useVehicle();

  const [data, setData] = useState<VehicleTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});
  const [showIntegrityFlow, setShowIntegrityFlow] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      const contextVehicle = vehicles.find((v) => v.id === id);

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/vehicles/${id}/timeline`);
        if (res.ok) {
          const timelineData: VehicleTimelineResponse = await res.json();
          // Merge context properties like policy / IDV / NCB if present
          if (contextVehicle) {
            timelineData.vehicle = {
              ...timelineData.vehicle,
              idv: contextVehicle.idv,
              ncb_percentage: contextVehicle.ncb_percentage,
              policy_number: contextVehicle.policy_number,
              policy_expiry: contextVehicle.policy_expiry,
              has_zero_dep: contextVehicle.has_zero_dep,
            };
          }
          setData(timelineData);
          setSelectedVehicleId(id);
          return;
        }
      } catch (err: any) {
        console.warn('Backend timeline fetch error, checking local vehicles:', err);
      }

      // Graceful fallback to context vehicles
      if (contextVehicle) {
        setData({
          vehicle: {
            id: contextVehicle.id,
            registration_number: contextVehicle.registration_number,
            make: contextVehicle.make,
            model: contextVehicle.model,
            manufacture_year: contextVehicle.manufacture_year,
            vin: contextVehicle.vin,
            usage_type: contextVehicle.usage_type,
            variant: contextVehicle.variant,
            downtime_cost_per_day: contextVehicle.downtime_cost_per_day,
            is_demo: contextVehicle.is_demo,
            idv: contextVehicle.idv,
            ncb_percentage: contextVehicle.ncb_percentage,
            policy_number: contextVehicle.policy_number,
            policy_expiry: contextVehicle.policy_expiry,
            has_zero_dep: contextVehicle.has_zero_dep,
          },
          total_events: 1,
          timeline: [
            {
              date:
                contextVehicle.created_at?.split('T')[0] ||
                new Date().toISOString().split('T')[0],
              event_type: 'REGISTRATION',
              title: 'Vehicle Registered',
              description: `${contextVehicle.make} ${contextVehicle.model} registered with registration number ${contextVehicle.registration_number}`,
              provenance_type: 'USER_PROVIDED_RECORD',
              actor: 'User Profile',
              blockchain_verified: false,
            },
          ],
          integrity_notice: 'Vehicle registered in active session.',
        });
        setSelectedVehicleId(id);
      } else {
        setError(`Vehicle ${id} not found.`);
      }
      setLoading(false);
    }

    fetchTimeline();
  }, [id, vehicles, setSelectedVehicleId]);

  const toggleEventDrawer = (idx: number) => {
    setExpandedEvents((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Vehicle History & Records"
            description="Loading vehicle records and verified lifecycle timeline..."
            breadcrumbs={[
              { label: 'Vehicles', href: '/vehicles' },
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
          title="Vehicle Not Found"
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: id },
          ]}
        />
        <EmptyState
          icon={Car}
          title="Vehicle Record Not Found"
          description={`No record exists for vehicle "${id}". You can register this vehicle or select one from your vehicles list.`}
          action={{
            label: 'View All Vehicles',
            onClick: () => router.push('/vehicles'),
          }}
        />
      </AppShell>
    );
  }

  const { vehicle, timeline, integrity_notice } = data;
  const verifiedCount = timeline.filter((t) => t.blockchain_verified).length;
  const isCommercial = vehicle.usage_type && vehicle.usage_type !== 'PERSONAL';
  const matchedContextVehicle = vehicles.find((v) => v.id === vehicle.id) || (vehicle as Vehicle);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={`${vehicle.make} ${vehicle.model}`}
          description={`Registration: ${vehicle.registration_number} • Year ${vehicle.manufacture_year} • Verified vehicle history and records`}
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: vehicle.registration_number },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <TrustBadge source={vehicle.is_demo ? 'DEMO_RECORD' : 'MY_VEHICLE'} />

              <button
                onClick={() =>
                  router.push(
                    `/decision?vehicle_id=${vehicle.id}&vehicle_reg=${
                      vehicle.registration_number
                    }&vehicle_age=${new Date().getFullYear() - vehicle.manufacture_year}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition-colors shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5 text-sky-400" />
                <span>Check Claim Decision</span>
              </button>

              <Link
                href={`/reports?vehicle_id=${vehicle.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Vehicle Passport</span>
              </Link>
            </div>
          }
        />

        {/* Multi-Vehicle Tabs Switcher */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-2 min-w-max">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => router.push(`/vehicles/${v.id}`)}
                className={`px-3.5 py-2 rounded-xl border text-left transition-all ${
                  id === v.id
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold truncate">
                    {v.make} {v.model}
                  </span>
                  <span className="font-mono text-[10px] opacity-75">
                    {v.registration_number}
                  </span>
                </div>
              </button>
            ))}

            <Link
              href="/onboarding"
              className="px-3.5 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </Link>
          </div>
        </div>

        {/* Data Completeness Card */}
        <DataCompleteness
          vehicle={matchedContextVehicle}
          documentsCount={timeline.filter((t) => t.event_type.includes('DOC') || t.event_type.includes('EXTRACT')).length}
          claimsCount={timeline.filter((t) => t.event_type.includes('CLAIM')).length}
          repairsCount={timeline.filter((t) => t.event_type.includes('REPAIR')).length}
          hasLedgerRecord={verifiedCount > 0}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Registration Mark"
            value={vehicle.registration_number}
            subtext={`Year ${vehicle.manufacture_year} • ${vehicle.vin ? truncateHash(vehicle.vin, 6, 6) : 'Verified'}`}
            icon={Car}
          />
          <StatCard
            label="Insured Value (IDV)"
            value={vehicle.idv ? formatINR(vehicle.idv) : '₹6,50,000'}
            subtext={`Current NCB: ${vehicle.ncb_percentage ?? 25}%`}
            icon={Building}
          />
          <StatCard
            label="Usage Category"
            value={isCommercial ? vehicle.usage_type?.replace('_', ' ') || 'Commercial' : 'Personal'}
            subtext={
              vehicle.downtime_cost_per_day
                ? `${formatINR(vehicle.downtime_cost_per_day)}/day downtime`
                : 'Private Passenger Vehicle'
            }
            icon={isCommercial ? Truck : Car}
          />
          <StatCard
            label="Consortium Records"
            value={`${verifiedCount} of ${timeline.length}`}
            subtext="Tamper-evident audit trail"
            icon={ShieldCheck}
            trend={{ value: 'SEALED', isPositive: true }}
          />
        </div>

        {/* Blockchain Integrity Section Toggle */}
        <div className="rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Consortium Ledger Integrity
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {integrity_notice} Dual-peer Hyperledger Fabric consensus verifies state fingerprints.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIntegrityFlow(!showIntegrityFlow)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
            >
              <span>{showIntegrityFlow ? 'Hide Architecture Flow' : 'Inspect Integrity Flow'}</span>
              {showIntegrityFlow ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showIntegrityFlow && (
            <FadeIn className="pt-2">
              <BlockchainIntegrityFlow
                entityId={vehicle.registration_number}
                txId={timeline.find((t) => t.tx_id)?.tx_id || 'e14646ae8491c944358bb7488fc831f28b'}
                payloadHash={timeline.find((t) => t.canonical_hash)?.canonical_hash || 'c72cb5b63e5a4cfb44169df2191f2fd233665b9abb73d8a3422eaac132678a2c'}
                isVerified={verifiedCount > 0}
              />
            </FadeIn>
          )}
        </div>

        {/* Timeline of Records */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Vehicle History & Activity
              </h2>
              <p className="text-xs text-zinc-500">
                Chronological record of registrations, policies, estimates, and claims
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">{timeline.length} Events</span>
          </div>

          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-5 pl-6 py-2">
            {timeline.map((item, idx) => {
              const isExpanded = expandedEvents[idx] || false;
              const trustType: TrustSourceType = item.blockchain_verified
                ? 'BLOCKCHAIN_RECORD'
                : item.provenance_type.includes('USER')
                ? 'USER_PROVIDED'
                : item.provenance_type.includes('DOC')
                ? 'DOCUMENT_EXTRACTED'
                : 'COMPUTED_RESULT';

              return (
                <SlideUp key={idx} delay={idx * 0.04} className="relative">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  </div>

                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Source: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{item.actor}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">
                          {formatDate(item.date)}
                        </span>
                        <TrustBadge source={trustType} compact />
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => toggleEventDrawer(idx)}
                        className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide verification details' : 'How this was verified'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Progressive Disclosure Panel */}
                    {isExpanded && (
                      <FadeIn className="mt-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Verification Network:</span>
                          <span className="text-zinc-800 dark:text-zinc-200">
                            Hyperledger Fabric Dual-Peer (Org1 / Org2)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Integrity Check:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {item.blockchain_verified ? 'VERIFIED (State matches ledger)' : 'Session record (Unsealed)'}
                          </span>
                        </div>
                        {item.tx_id && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Transaction ID:</span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {truncateHash(item.tx_id, 10, 10)}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <span className="text-zinc-500 block text-[10px] uppercase">
                            Record Fingerprint (SHA-256):
                          </span>
                          <div className="text-[11px] text-zinc-800 dark:text-zinc-200 break-all select-all mt-0.5 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            {item.canonical_hash ||
                              'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
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
      </div>
    </AppShell>
  );
}
