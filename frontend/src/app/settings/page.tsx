'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, CircleDashed, Download, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { useSystemStatus } from '@/lib/useSystemStatus';
import { orgHomeFor, ORG_ROLES } from '@/components/org/OrgShell';
import { ApiErrorNotice } from '@/components/common/ApiErrorNotice';
import { BRAND } from '@/lib/brand';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Profile {
  email?: string | null;
  full_name?: string | null;
  role: string;
  organization?: { name: string; type?: string } | null;
}

const ROLE_WORDS: Record<string, string> = {
  POLICYHOLDER: 'Car owner',
  FLEET_OPERATOR: 'Fleet operator',
  GARAGE: 'Workshop',
  INSURER: 'Insurer',
  SURVEYOR: 'Surveyor',
  ADMIN: 'Administrator',
};

// Uses the server's own badge classification so the two never disagree.
const OK = ['connected', 'operational'];
const OFF = ['not_connected', 'not_integrated', 'data_limited'];

function Card({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className="rounded-2xl border border-navy-100 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

export default function SettingsPage() {
  const { user, role, isDemo } = useAuth();
  const { vehicles } = useVehicle();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exporting, setExporting] = useState(false);
  const { status, error: statusError, loading: statusLoading } = useSystemStatus();
  const roleKey = (profile?.role || role || 'POLICYHOLDER').toUpperCase();
  const isOrg = ORG_ROLES.includes(roleKey.toLowerCase()) && roleKey !== 'ADMIN';

  useEffect(() => {
    apiFetch<Profile>('/api/v1/profiles/me').then(setProfile).catch(() => setProfile(null));
  }, []);

  // Exports what the server actually holds for this account, not a summary.
  const exportData = async () => {
    setExporting(true);
    try {
      const [claims, consents] = await Promise.all([
        apiFetch<unknown[]>('/api/v1/claims').catch(() => []),
        apiFetch<unknown[]>('/api/v1/consent').catch(() => []),
      ]);
      const body = {
        exported_by: BRAND.name,
        exported_at: new Date().toISOString(),
        demo_session: isDemo,
        profile: profile ?? { email: user?.email, role: roleKey },
        vehicles,
        saved_records: claims,
        sharing_permissions: consents,
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearclaim-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your data was downloaded.');
    } catch (e) {
      toast.error(describeApiError(e).title);
    } finally {
      setExporting(false);
    }
  };

  const rows: [string, string][] = [
    ['Email', profile?.email || user?.email || 'Not available'],
    ['Name', profile?.full_name || 'Not set'],
    ['Account type', ROLE_WORDS[roleKey] || roleKey],
    ['Organisation', profile?.organization?.name || (isOrg ? 'Not linked' : 'Personal account')],
    ['Sign-in', isDemo ? 'Demo session (sample data, nothing is kept)' : 'Email account'],
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Settings</h1>
          <p className="mt-2 text-navy-500">Your account, your data, and whether each part of {BRAND.name} is working right now.</p>
        </div>

        <Card title="Account">
          <dl className="divide-y divide-navy-50">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-navy-500">{k}</dt>
                <dd className="text-sm font-medium text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {['POLICYHOLDER', 'FLEET_OPERATOR'].includes(roleKey) && (
              <Link href="/vehicles" className="rounded-xl border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">My cars ({vehicles.length})</Link>
            )}
            {isOrg && <Link href={orgHomeFor(roleKey)} className="rounded-xl border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">Open workspace</Link>}
          </div>
        </Card>

        <Card title="Your data" delay={0.05}>
          <p className="text-sm leading-relaxed text-navy-600">
            Download everything stored for your account: cars, saved records and who you have shared them with. To have your data deleted, email us from the address on your account. We handle requests in line with India&apos;s DPDP Act.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={exportData} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Download my data'}
            </button>
            <Link href="/decision/consent" className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              <Share2 className="h-4 w-4" /> Manage sharing
            </Link>
            <a href={`mailto:${BRAND.contactEmail}?subject=${encodeURIComponent('Data deletion request')}`} className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
              <Mail className="h-4 w-4" /> Request deletion
            </a>
          </div>
        </Card>

        <Card title="Service status" delay={0.1}>
          {statusError != null ? (
            <ApiErrorNotice error={statusError} />
          ) : statusLoading || !status ? (
            <div className="vs-shimmer h-40 rounded-2xl" />
          ) : (
            <>
              <ul className="divide-y divide-navy-50">
                {Object.entries(status.components).map(([key, c]) => {
                  const ok = OK.includes(c.badge_variant || '');
                  const off = OFF.includes(c.badge_variant || '');
                  const Icon = ok ? CheckCircle2 : off ? CircleDashed : CircleAlert;
                  return (
                    <li key={key} className="flex items-start gap-3 py-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? 'text-gain' : off ? 'text-navy-300' : 'text-amber-600'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{c.name}</p>
                        {c.details && <p className="text-xs leading-relaxed text-navy-500">{c.details}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-navy-400">
                {status.data_mode === 'DEMO_SANDBOX' ? 'This server runs on sample data.' : 'Connected to the live database.'} Grey items are not part of {BRAND.name} yet; we never show them as working.
              </p>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
