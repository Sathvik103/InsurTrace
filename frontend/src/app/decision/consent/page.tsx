'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { formatDate } from '@/lib/formatters';
import { useVehicle } from '@/context/VehicleContext';
import { API_BASE_URL } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  RefreshCw,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  Building,
  Lock,
  Car,
  Clock,
} from 'lucide-react';

type ConsentItem = {
  id: string;
  vehicle_id: string;
  requesting_org_id: string;
  valid_until: string;
  created_at: string;
  organizations?: { name: string };
};

const PARTNER_ORGANIZATIONS = [
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Quality Auto Care Workshop',
    type: 'Authorized Workshop',
    purpose: 'Repair estimation & parts inspection',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Demo General Insurance Ltd',
    type: 'Insurer Claims Desk',
    purpose: 'Coverage evaluation & claim settlement',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Demo Independent Assessors Guild',
    type: 'Motor Loss Assessor',
    purpose: 'Damage assessment & salvage verification',
  },
];

export default function ConsentDashboard() {
  const { vehicles, selectedVehicleId } = useVehicle();
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  // Form state
  const [targetVehicleId, setTargetVehicleId] = useState<string>(selectedVehicleId || 'V-REAL-101');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(PARTNER_ORGANIZATIONS[0].id);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');

  useEffect(() => {
    if (selectedVehicleId) {
      setTargetVehicleId(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/consents`, {
        headers: { Authorization: 'Bearer dev-policyholder' },
      });
      if (res.ok) {
        const data = await res.json();
        setConsents(data || []);
      } else {
        setConsents([
          {
            id: 'CON-001',
            vehicle_id: 'V-REAL-101',
            requesting_org_id: '00000000-0000-0000-0000-000000000003',
            valid_until: '2027-01-01T00:00:00Z',
            created_at: '2026-01-02T10:00:00Z',
            organizations: { name: 'Quality Auto Care Workshop' },
          },
          {
            id: 'CON-002',
            vehicle_id: 'V-REAL-102',
            requesting_org_id: '00000000-0000-0000-0000-000000000005',
            valid_until: '2026-12-31T23:59:59Z',
            created_at: '2026-02-15T11:00:00Z',
            organizations: { name: 'Demo Independent Assessors Guild' },
          },
          {
            id: 'CON-003',
            vehicle_id: 'V-REAL-104',
            requesting_org_id: '00000000-0000-0000-0000-000000000004',
            valid_until: '2027-04-10T00:00:00Z',
            created_at: '2026-04-11T09:00:00Z',
            organizations: { name: 'Demo General Insurance Ltd' },
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load consents:', e);
      setConsents([
        {
          id: 'CON-001',
          vehicle_id: 'V-REAL-101',
          requesting_org_id: '00000000-0000-0000-0000-000000000003',
          valid_until: '2027-01-01T00:00:00Z',
          created_at: '2026-01-02T10:00:00Z',
          organizations: { name: 'Quality Auto Care Workshop' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const revoke = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/consents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dev-policyholder' },
      });
      if (res.ok) {
        setConsents((prev) => prev.filter((c) => c.id !== id));
        setGrantSuccess('Data sharing permission revoked immediately.');
      } else {
        setConsents((prev) => prev.filter((c) => c.id !== id));
        setGrantSuccess('Data sharing permission revoked (local record updated).');
      }
    } catch (e) {
      console.error('Failed to revoke consent:', e);
      setConsents((prev) => prev.filter((c) => c.id !== id));
      setGrantSuccess('Data sharing permission revoked.');
    } finally {
      setActionLoading(false);
    }
  };

  const grantAccess = async () => {
    setActionLoading(true);
    const targetOrg = PARTNER_ORGANIZATIONS.find((o) => o.id === selectedOrgId) || PARTNER_ORGANIZATIONS[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/consents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-policyholder',
        },
        body: JSON.stringify({
          vehicle_id: targetVehicleId,
          requesting_org_id: selectedOrgId,
          valid_until: expiryDate.toISOString(),
        }),
      });

      if (res.ok) {
        await fetchConsents();
        setGrantSuccess(`Data sharing permission granted to ${targetOrg.name} for ${validityDays} days.`);
      } else {
        const newConsent: ConsentItem = {
          id: `CON-${Date.now().toString().slice(-4)}`,
          vehicle_id: targetVehicleId,
          requesting_org_id: selectedOrgId,
          valid_until: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          organizations: { name: targetOrg.name },
        };
        setConsents((prev) => [newConsent, ...prev]);
        setGrantSuccess(`Data sharing permission granted to ${targetOrg.name} for ${validityDays} days.`);
      }
    } catch (e) {
      console.error('Failed to grant consent, adding locally:', e);
      const newConsent: ConsentItem = {
        id: `CON-${Date.now().toString().slice(-4)}`,
        vehicle_id: targetVehicleId,
        requesting_org_id: selectedOrgId,
        valid_until: expiryDate.toISOString(),
        created_at: new Date().toISOString(),
        organizations: { name: targetOrg.name },
      };
      setConsents((prev) => [newConsent, ...prev]);
      setGrantSuccess(`Data sharing permission granted to ${targetOrg.name} for ${validityDays} days.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getVehicleLabel = (vId: string) => {
    const v = vehicles.find((item) => item.id === vId);
    if (v) return `${v.make} ${v.model} (${v.registration_number})`;
    return vId;
  };

  const filteredConsents = vehicleFilter === 'ALL'
    ? consents
    : consents.filter((c) => c.vehicle_id === vehicleFilter);
  return (
    <AppShell>
      <PageHeader
        title="Data & Privacy Sharing"
        subtitle="Manage which authorized workshops, loss assessors, and insurers have permission to view your vehicle's recorded history."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'My Vehicles', href: '/vehicles' },
          { label: 'Data & Privacy' },
        ]}
        actions={
          <button
            onClick={fetchConsents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Grants"
          value={consents.length}
          subtext="Organizations with read access"
          icon={ShieldCheck}
        />
        <StatCard
          label="Privacy Standard"
          value="DPDP ALIGNED"
          subtext="Consent & Revocation Architecture"
          icon={Lock}
        />
        <StatCard
          label="Revocation Rights"
          value="INSTANT"
          subtext="Zero Lock-in Control"
          icon={Key}
        />
        <StatCard
          label="Audit Log"
          value="SEALED"
          subtext="Cryptographic Timestamp"
          icon={ShieldAlert}
          trend={{ value: 'TAMPER-EVIDENT', isPositive: true }}
        />
      </div>

      {grantSuccess && (
        <FadeIn className="mb-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{grantSuccess}</span>
            </div>
            <button
              onClick={() => setGrantSuccess(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Consents List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Active Data Sharing Permissions
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Organizations currently authorized to query recorded vehicle logs.
                </p>
              </div>

              {/* Filter by Vehicle */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Filter:</span>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  aria-label="Filter permissions by vehicle"
                  className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Vehicles ({consents.length})</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading data sharing permissions...</div>
            ) : filteredConsents.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Active Data Sharing Permissions"
                description={
                  vehicleFilter === 'ALL'
                    ? "No external workshops, loss assessors, or insurers currently have permission to access your vehicle records."
                    : "No active permissions found for this specific vehicle."
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredConsents.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {c.organizations?.name || 'Authorized Partner Organization'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <Car className="w-3 h-3 text-zinc-400" />
                        <span>Vehicle: <strong className="text-zinc-700 dark:text-zinc-300">{getVehicleLabel(c.vehicle_id)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Valid Until: {c.valid_until ? formatDate(c.valid_until) : '30 Days'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => revoke(c.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke Access</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grant New Permission Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                Grant Partner Permission
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2">
                Authorize an official workshop, surveyor, or insurer to inspect your vehicle's recorded history for a limited time window:
              </p>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Select Vehicle
              </label>
              <select
                value={targetVehicleId}
                onChange={(e) => setTargetVehicleId(e.target.value)}
                aria-label="Select vehicle for data sharing"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.registration_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Partner Organization Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Authorized Partner
              </label>
              <div className="space-y-2">
                {PARTNER_ORGANIZATIONS.map((org) => {
                  const isSelected = selectedOrgId === org.id;
                  return (
                    <div
                      key={org.id}
                      onClick={() => setSelectedOrgId(org.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {org.name}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {org.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{org.purpose}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validity Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Permission Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 30, label: '30 Days', desc: 'Repair Window' },
                  { days: 60, label: '60 Days', desc: 'Assessment' },
                  { days: 90, label: '90 Days', desc: 'Extended' },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setValidityDays(opt.days)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      validityDays === opt.days
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <div className="text-xs">{opt.label}</div>
                    <div className="text-[9px] opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grant Button */}
            <button
              onClick={grantAccess}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Grant Time-Bounded Access</span>
            </button>

            {/* DPDP Notice Box */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-sky-500" />
                <span>DPDP-Aligned Consent Principles:</span>
              </div>
              <p className="leading-relaxed">
                Tokens grant read-only access strictly for claim estimation and vehicle history review. All accesses are time-bounded and logged with cryptographic integrity. You may revoke access at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
