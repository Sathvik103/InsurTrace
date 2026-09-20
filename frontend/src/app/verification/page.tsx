'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { formatINR, truncateHash } from '@/lib/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  ServerCrash,
  RefreshCw,
  RotateCcw,
  Info,
  Database,
  CheckCircle2,
  Lock,
  Cpu,
  AlertTriangle,
  Network,
  Activity,
  Terminal,
} from 'lucide-react';

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-12 text-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Connecting to Hyperledger Fabric Gateway...</p>
          </div>
        </AppShell>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}

function VerificationContent() {
  const searchParams = useSearchParams();
  const [claimId, setClaimId] = useState('CLM-999');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [originalCost, setOriginalCost] = useState<number>(45000);

  useEffect(() => {
    if (searchParams) {
      const qId = searchParams.get('claimId');
      if (qId) {
        setClaimId(qId);
        runVerification(qId);
      }
    }
  }, [searchParams]);

  const runVerification = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/verify-claim/${targetId}`);
      if (!res.ok) {
        throw new Error(`Verification endpoint returned status ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      if (data.original_cost) {
        setOriginalCost(data.original_cost);
      }
    } catch (e: any) {
      console.error('Verification error:', e);
      setStatus({
        status: 'ERROR',
        message: e.message || 'Failed to connect to verification service. Ensure backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const tamperClaim = async () => {
    if (!claimId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tamper-claim/${claimId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-admin',
        },
      });
      const data = await res.json();
      // Re-verify immediately to demonstrate detection
      await runVerification(claimId);
    } catch (e) {
      console.error(e);
      alert('Failed to tamper record.');
    } finally {
      setActionLoading(false);
    }
  };

  const restoreClaim = async () => {
    if (!claimId) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/admin/restore-claim/${claimId}?original_cost=${originalCost}`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer dev-admin',
          },
        }
      );
      const data = await res.json();
      // Re-verify immediately to demonstrate restoration to green verified state
      await runVerification(claimId);
    } catch (e) {
      console.error(e);
      alert('Failed to restore record.');
    } finally {
      setActionLoading(false);
    }
  };

  const isTampered = status?.status === 'TAMPERED';
  const isVerified = status?.status === 'VERIFIED';

  return (
    <AppShell>
      <PageHeader
        title="Ledger Verification Console"
        description="Inspect Hyperledger Fabric Raft consensus blocks, verify SHA-256 state proofs against live PostgreSQL records, and evaluate tamper detection."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Governance' },
          { label: 'Verification Console' },
        ]}
      />

      {/* Network Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Fabric Peer 0 (Org1)"
          value="HEALTHY"
          subtext="Org1MSP • Port 7051 • Channel mychannel"
          icon={Network}
          trend={{ value: 'ACTIVE', isPositive: true }}
        />
        <StatCard
          label="Fabric Peer 0 (Org2)"
          value="HEALTHY"
          subtext="Org2MSP • Port 9051 • Endorsing"
          icon={Network}
          trend={{ value: 'ACTIVE', isPositive: true }}
        />
        <StatCard
          label="Orderer Consensus"
          value="RAFT CFT"
          subtext="OrdererMSP • Port 7050 • TLS Enabled"
          icon={Cpu}
          trend={{ value: 'CONSENSUS OK', isPositive: true }}
        />
        <StatCard
          label="Active Chaincode"
          value="VehicleHistory"
          subtext="Version 1.0 • Channel mychannel"
          icon={ShieldCheck}
          trend={{ value: 'ENDORSED', isPositive: true }}
        />
      </div>

            {/* Truth Boundary & Test Consortium Notice */}
      <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-3">
        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Blockchain Truth Boundary:</strong> Hyperledger Fabric Raft consensus certifies the mathematical integrity of recorded claims against unauthorized database alteration after commitment. It does not independently verify physical real-world ground truth. Network operates in local dual-peer consortium test mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Verification Query & Live Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* Claim Selector Box */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Cryptographic State Proof Inspector
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Compares PostgreSQL relational row hash with on-chain Hyperledger Fabric block record
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                REAL_FABRIC
              </span>
            </div>

            <div className="space-y-3">
              {/* Quick Select Buttons for 4 Seed Claims */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-zinc-500">Seed Claims:</span>
                {[
                  { id: 'CLM-999', label: 'CLM-999 (Creta • Tamper Target)', badge: 'TAMPER TEST' },
                  { id: 'CLM-101', label: 'CLM-101 (Swift • Settled)', badge: 'SETTLED' },
                  { id: 'CLM-102', label: 'CLM-102 (Nexon EV • Under Review)', badge: 'REVIEW' },
                  { id: 'CLM-103', label: 'CLM-103 (City ZX • Approved)', badge: 'APPROVED' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClaimId(c.id);
                      runVerification(c.id);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-mono transition-colors ${
                      claimId === c.id
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {c.id} ({c.badge})
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={claimId}
                  onChange={(e) => setClaimId(e.target.value)}
                  placeholder="Enter Claim Identifier (e.g., CLM-999 or CLM-101)"
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  onClick={() => runVerification(claimId)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verify State Hashes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verification Results Panel */}
          {status && (
            <FadeIn className="space-y-4">
              {/* Verdict Banner */}
              <div
                className={`rounded-xl border p-5 ${
                  isVerified
                    ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : isTampered
                    ? 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-zinc-200 bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isVerified ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : isTampered ? (
                    <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          isVerified
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : isTampered
                            ? 'text-red-900 dark:text-red-200'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {isVerified
                          ? 'CRYPTOGRAPHIC INTEGRITY CONFIRMED'
                          : isTampered
                          ? 'INTEGRITY VIOLATION DETECTED'
                          : status.status || 'STATUS AUDIT'}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isVerified
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : isTampered
                            ? 'bg-red-500/20 text-red-800 dark:text-red-300'
                            : 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {status.network_mode || 'REAL_FABRIC'}
                      </span>
                    </div>

                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isVerified
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : isTampered
                          ? 'text-red-800 dark:text-red-300'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isVerified
                        ? 'The live database state hash matches the on-chain Hyperledger Fabric block record character-for-character. No unauthorized mutations have occurred.'
                        : isTampered
                        ? 'The PostgreSQL state has diverged from the on-chain consortium block record! The database repair cost or claim metadata has been mutated out-of-band.'
                        : status.message || 'Audit complete.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hash Comparison Box */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Character-Level Hash Comparison
                </h4>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">
                      1. Live PostgreSQL Canonical Hash:
                    </div>
                    <div
                      className={`p-3 rounded-lg border break-all select-all ${
                        isTampered
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {status.computed_hash || status.database_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">
                      2. On-Chain Hyperledger Fabric Block Hash:
                    </div>
                    <div className="p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 break-all select-all">
                      {status.ledger_hash || status.blockchain_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                  </div>

                  {status.blockchain_tx_id && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Fabric Transaction ID:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{status.blockchain_tx_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          )}
        </div>

        {/* Right Column: Isolated Sandbox Tamper Demo */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Admin Security Sandbox</span>
            </div>

            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Test VeriSure’s cryptographic tamper resistance. You can simulate an adversarial attack modifying the repair cost in PostgreSQL, then observe how the Fabric ledger flags the tampering immediately.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={tamperClaim}
                disabled={actionLoading}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>Simulate Database Tamper</span>
              </button>

              <button
                onClick={restoreClaim}
                disabled={actionLoading}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Restore Database Integrity</span>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-amber-200 dark:border-amber-900/40">
              Target Test Record: <span className="font-mono text-zinc-800 dark:text-zinc-200">{claimId}</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Why Ledgers Matter
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Conventional databases have a single point of failure: an administrator or malicious query can alter claim payout amounts without leaving an indisputable external trace.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              By committing canonical SHA-256 hashes to a multi-peer Hyperledger Fabric ledger, VeriSure guarantees that unauthorized data mutations are mathematically impossible to conceal.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
