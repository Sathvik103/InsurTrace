'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { FadeIn } from '@/components/motion/MotionPrimitives';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export default function SettingsPage() {
  const { user, role, isDemo, activePersona } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ORGANIZATION' | 'PRIVACY' | 'LEDGER'>('PROFILE');
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPassport = () => {
    setDownloaded(true);
    const mockData = {
      user: user?.email,
      role: role,
      ledger: 'Hyperledger Fabric mychannel',
      standards: 'DPDP Act 2023 & IRDAI Motor Tariff 2026',
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
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
        description="Manage identity profiles, organizational affiliations, DPDP data protection rights, and Hyperledger Fabric RPC connectivity."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Governance' },
          { label: 'Settings' },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6 mb-8 text-xs font-medium">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'PROFILE'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Identity & Profile
        </button>
        <button
          onClick={() => setActiveTab('ORGANIZATION')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'ORGANIZATION'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Organization
        </button>
        <button
          onClick={() => setActiveTab('PRIVACY')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'PRIVACY'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          DPDP Privacy & Rights
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'LEDGER'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Hyperledger Fabric Node
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'PROFILE' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Active User Identity
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Primary Email</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                  {user?.email || 'demo-policyholder@insuretrace.in'}
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
                  {isDemo ? 'Sandbox Persona (Dev Token)' : 'Supabase Auth JWT (ES256)'}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 2: Organization */}
      {activeTab === 'ORGANIZATION' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Organizational Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Organization Name</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {role === 'insurer'
                    ? 'HDFC ERGO General Insurance Co. Ltd.'
                    : role === 'garage'
                    ? 'Quality Garage & Bodyworks'
                    : role === 'surveyor'
                    ? 'Independent Motor Loss Assessor Desk'
                    : 'Personal Policyholder Account'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">IRDAI License / Code</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {role === 'insurer' ? 'IRDAI/NL-01/HDFC' : role === 'surveyor' ? 'SLA-99201-IND' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tab 3: DPDP Privacy */}
      {activeTab === 'PRIVACY' && (
        <FadeIn className="space-y-6 max-w-2xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              DPDP Act 2023 Statutory Rights
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Under India's Digital Personal Data Protection Act 2023, you retain the absolute right to export a complete copy of your vehicle and claim ledger records, or request erasure of non-statutory data.
            </p>

            <div className="pt-2">
              <button
                onClick={handleDownloadPassport}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center gap-2"
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
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Hyperledger Fabric Consortium Configuration
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Channel Name:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">mychannel</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Chaincode ID:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">VehicleHistory (v1.0)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Orderer Consensus:</span>
                <span className="text-emerald-600 font-bold">CFT Raft (Port 7050)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-sans">Endorsing Peer MSP:</span>
                <span className="text-zinc-900 dark:text-zinc-100">Org1MSP & Org2MSP</span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}
    </AppShell>
  );
}
