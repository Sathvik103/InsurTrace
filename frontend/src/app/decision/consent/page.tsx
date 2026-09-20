'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { formatDate } from '@/lib/formatters';
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
} from 'lucide-react';

type ConsentItem = {
  id: string;
  vehicle_id: string;
  requesting_org_id: string;
  valid_until: string;
  created_at: string;
  organizations?: { name: string };
};

export default function ConsentDashboard() {
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/consents', {
        headers: { Authorization: 'Bearer dev-policyholder' },
      });
      if (res.ok) {
        const data = await res.json();
        setConsents(data || []);
      }
    } catch (e) {
      console.error('Failed to load consents:', e);
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
      const res = await fetch(`http://localhost:8000/api/v1/consents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dev-policyholder' },
      });
      if (res.ok) {
        setConsents((prev) => prev.filter((c) => c.id !== id));
        setGrantSuccess('Consent privilege revoked and recorded in the audit log.');
      }
    } catch (e) {
      console.error('Failed to revoke consent:', e);
      alert('Failed to revoke consent.');
    } finally {
      setActionLoading(false);
    }
  };

  const grantAccessToGarage = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/consents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-policyholder',
        },
        body: JSON.stringify({
          vehicle_id: 'V-REAL-101',
          requesting_org_id: '00000000-0000-0000-0000-000000000003', // Quality Garage
        }),
      });
      if (res.ok) {
        await fetchConsents();
        setGrantSuccess('Data sharing permission authorized for Quality Garage & Bodyworks.');
      }
    } catch (e) {
      console.error('Failed to grant consent:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Consent & Privacy Controls"
        description="Statutory consent governance built with DPDP-aligned consent and data minimization patterns. Grant, inspect, or revoke external access to your vehicle's records."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Consent & Privacy' },
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
          subtext="Organizations with read rights"
          icon={ShieldCheck}
        />
        <StatCard
          label="Privacy Standard"
          value="DPDP ALIGNED"
          subtext="Consent & Revocation Patterns"
          icon={Lock}
        />
        <StatCard
          label="Revocation Rights"
          value="INSTANT"
          subtext="Zero Lock-in Policy"
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
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Active Data Sharing Grants
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {consents.length} active
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading consents...</div>
            ) : consents.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Active Data Sharing Grants"
                description="No external workshops, surveyors, or insurers currently have permission to query your vehicle history ledger."
              />
            ) : (
              <div className="space-y-2">
                {consents.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {c.organizations?.name || 'Authorized Partner Organization'}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        Vehicle: {c.vehicle_id}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Expires: {c.valid_until ? formatDate(c.valid_until) : '30 Days'}
                      </div>
                    </div>
                    <button
                      onClick={() => revoke(c.id)}
                      disabled={actionLoading}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grant New Permission Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Authorize Partner Access
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When visiting an authorized workshop for a repair estimate, grant them time-bounded permission to access your vehicle's previous ledger records:
            </p>

            <button
              onClick={grantAccessToGarage}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Grant Access to Quality Garage (30 Days)</span>
            </button>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                DPDP Notice:
              </div>
              <p>
                Consent tokens grant read-only access strictly for claim estimation. You may revoke access at any moment with immediate cryptographic revocation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
