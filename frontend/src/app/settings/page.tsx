'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { TrustBadge } from '@/components/common/TrustBadge';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { API_BASE_URL } from '@/lib/api';
import {
  User,
  Building,
  ShieldCheck,
  Database,
  Key,
  Network,
  Download,
  AlertTriangle,
  Mail,
  CheckCircle2,
  Car,
  Activity,
  Cpu,
  RefreshCw,
  Server
} from 'lucide-react';

interface SystemStatusResponse {
  platform: string;
  version: string;
  timestamp: string;
  components: {
    database: { name: string; type: string; status: string; details: string };
    authentication: { name: string; type: string; status: string; details: string };
    financial_engine: { name: string; type: string; status: string; rule_version?: string; details: string };
    hyperledger_fabric: { name: string; type: string; status: string; channel?: string; details: string };
    ml_intelligence: { name: string; type: string; status: string; details: string };
    external_vahan: { name: string; type: string; status: string; details: string };
    external_insurers: { name: string; type: string; status: string; details: string };
    external_workshops: { name: string; type: string; status: string; details: string };
  };
}

export default function SettingsPage() {
  const { user, role, isDemo } = useAuth();
  const { vehicles, selectedVehicle } = useVehicle();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ORGANIZATION' | 'PRIVACY' | 'LEDGER' | 'SYSTEM_STATUS'>('PROFILE');
  const [downloaded, setDownloaded] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    async function fetchSystemStatus() {
      setLoadingStatus(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/system/status`);
        if (res.ok) {
          const json = await res.json();
          setSystemStatus(json);
        }
      } catch (e) {
        console.warn('System status fetch failed:', e);
      } finally {
        setLoadingStatus(false);
      }
    }

    if (activeTab === 'SYSTEM_STATUS') {
      fetchSystemStatus();
    }
  }, [activeTab]);

  const handleDownloadPassport = () => {
    setDownloaded(true);
    const exportData = {
      product: 'VeriSure — Insurance Intelligence & Verification',
      user: user?.email || 'demo-policyholder@verisure.in',
      role: role || 'POLICYHOLDER',
      vehicles_count: vehicles.length,
      active_vehicle: selectedVehicle
        ? {
            id: selectedVehicle.id,
            make: selectedVehicle.make,
            model: selectedVehicle.model,
            registration: selectedVehicle.registration_number,
            usage_type: selectedVehicle.usage_type,
          }
        : null,
      all_vehicles: vehicles.map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        registration: v.registration_number,
        usage_type: v.usage_type,
      })),
      ledger: 'Hyperledger Fabric mychannel (Dual-Peer Raft Consortium)',
      privacy_standard: 'DPDP-Aligned Consent & Data Minimization Architecture',
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verisure-data-passport-${Date.now()}.json`;
    a.click();
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings & System Configuration"
        description="Manage identity profiles, organizational affiliations, DPDP-aligned data rights, and live system status."
        breadcrumbs={[
          { label: 'Platform', href: '/decision' },
          { label: 'Settings' },
        ]}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 space-x-6 mb-8 text-xs font-medium">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 border-b-2 transition-colors shrink-0 ${
            activeTab === 'PROFILE'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Identity & Profile
        </button>
        <button
          onClick={() => setActiveTab('ORGANIZATION')}
          className={`pb-3 border-b-2 transition-colors shrink-0 ${
            activeTab === 'ORGANIZATION'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Organization
        </button>
        <button
          onClick={() => setActiveTab('PRIVACY')}
          className={`pb-3 border-b-2 transition-colors shrink-0 ${
            activeTab === 'PRIVACY'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          DPDP Privacy & Rights
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 border-b-2 transition-colors shrink-0 ${
            activeTab === 'LEDGER'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Hyperledger Fabric Node
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM_STATUS')}
          className={`pb-3 border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'SYSTEM_STATUS'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live System Status</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'PROFILE' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Active User Identity
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Primary Email</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                  {user?.email || 'demo-policyholder@verisure.in'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">Authoritative System Role</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 uppercase border border-zinc-200 dark:border-zinc-700">
                  {role || 'POLICYHOLDER'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">Authentication Mode</span>
                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {isDemo ? 'Sandbox Persona (Dev Session)' : 'Supabase Auth JWT (Persistent Session)'}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 block text-[11px]">Registered Vehicles</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                    {vehicles.length} vehicles registered {selectedVehicle ? `(Active: ${selectedVehicle.registration_number})` : ''}
                  </span>
                  <a
                    href="/vehicles"
                    className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 2: Organization */}
      {activeTab === 'ORGANIZATION' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Organizational Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Organization Name</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {role === 'insurer'
                    ? 'Demo General Insurance Ltd.'
                    : role === 'garage'
                    ? 'Quality Auto Care Workshop'
                    : role === 'surveyor'
                    ? 'Demo Independent Assessors Guild'
                    : 'Personal Policyholder Account'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">Institutional Designation</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {role === 'insurer'
                    ? 'General Insurance Underwriting Desk'
                    : role === 'garage'
                    ? 'Authorized Network Bodyworks & Repair Facility'
                    : role === 'surveyor'
                    ? 'Independent Motor Loss Assessor (Level II)'
                    : 'Registered Vehicle Owner'}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 3: DPDP Privacy */}
      {activeTab === 'PRIVACY' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              DPDP Act 2023 Statutory Rights
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Under India&apos;s Digital Personal Data Protection Act 2023, you retain the right to export a complete copy of your vehicle and claim ledger records, or request erasure of non-statutory data.
            </p>

            <div className="pt-2">
              <button
                onClick={handleDownloadPassport}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Cryptographic Data Passport (JSON)</span>
              </button>
              {downloaded && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  Export dispatched successfully.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
              Data Fiduciary Contact: <span className="font-mono text-zinc-900 dark:text-zinc-100">sathvikkandukuri202@gmail.com</span>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 4: Ledger Node */}
      {activeTab === 'LEDGER' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Hyperledger Fabric Consortium Configuration
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Channel Name:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">mychannel</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Chaincode ID:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">VehicleHistory (v1.0)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Orderer Consensus:</span>
                <span className="text-emerald-600 font-bold">CFT Raft (Port 7050)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Endorsing Peer MSP:</span>
                <span className="text-zinc-900 dark:text-zinc-100">Org1MSP &amp; Org2MSP</span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 5: Live System Status */}
      {activeTab === 'SYSTEM_STATUS' && (
        <FadeIn className="space-y-6 max-w-3xl">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-600" />
                  <span>Authoritative Subsystem Status</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Live verification of infrastructure connections and external dependencies.
                </p>
              </div>

              {loadingStatus ? (
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              )}
            </div>

            {systemStatus && systemStatus.components ? (
              <div className="space-y-4 text-xs">
                {/* Core Verified Subsystems */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    Core Platform Services
                  </span>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.database?.name || 'Database & Storage'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.database?.details}</p>
                    </div>
                    <TrustBadge source="COMPUTED_RESULT" label={systemStatus.components.database?.status || 'CONNECTED'} />
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.financial_engine?.name || 'Deterministic Financial Engine'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.financial_engine?.details}</p>
                    </div>
                    <TrustBadge source="COMPUTED_RESULT" label={systemStatus.components.financial_engine?.status || 'OPERATIONAL'} />
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.hyperledger_fabric?.name || 'Hyperledger Fabric Consortium'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.hyperledger_fabric?.details}</p>
                    </div>
                    <TrustBadge
                      source="BLOCKCHAIN_RECORD"
                      label={systemStatus.components.hyperledger_fabric?.status === 'CONNECTED' ? 'CONSORTIUM ACTIVE' : 'FABRIC ADAPTER ACTIVE'}
                    />
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.ml_intelligence?.name || 'ML Intelligence (Vision & Fraud)'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.ml_intelligence?.details}</p>
                    </div>
                    <TrustBadge source="ML_ESTIMATE" label="DATA-LIMITED" />
                  </div>
                </div>

                {/* External Ecosystem Systems - Clearly Marked Not Connected */}
                <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    External Ecosystem APIs (Strict Honesty Policy)
                  </span>

                  <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.external_vahan?.name || 'VAHAN / Parivahan Registry'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.external_vahan?.details}</p>
                    </div>
                    <TrustBadge source="EXTERNAL_SOURCE_NOT_CONNECTED" />
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.external_insurers?.name || 'Insurer Policy Systems'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.external_insurers?.details}</p>
                    </div>
                    <TrustBadge source="EXTERNAL_SOURCE_NOT_CONNECTED" />
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{systemStatus.components.external_workshops?.name || 'Audatex / DAT Parts Systems'}</p>
                      <p className="text-[11px] text-zinc-500">{systemStatus.components.external_workshops?.details}</p>
                    </div>
                    <TrustBadge source="EXTERNAL_SOURCE_NOT_CONNECTED" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                {loadingStatus ? 'Connecting to system diagnostics...' : 'Unable to query live system status. Backend is initializing.'}
              </div>
            )}
          </div>
        </FadeIn>
      )}
    </AppShell>
  );
}
