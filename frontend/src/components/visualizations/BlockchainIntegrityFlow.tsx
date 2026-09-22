'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Fingerprint, 
  Database, 
  Key, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Info,
  ExternalLink,
  Lock
} from 'lucide-react';

interface BlockchainIntegrityFlowProps {
  entityId?: string;
  txId?: string;
  payloadHash?: string;
  timestamp?: string;
  isVerified?: boolean;
  channelName?: string;
  organizations?: string[];
  className?: string;
}

export function BlockchainIntegrityFlow({
  entityId,
  txId = 'e14646ae8491c944358bb7488fc831f28b',
  payloadHash = 'c72cb5b63e5a4cfb44169df2191f2fd233665b9abb73d8a3422eaac132678a2c',
  timestamp = '2026-04-12T10:30:00Z',
  isVerified = true,
  channelName = 'mychannel',
  organizations = ['Org1MSP (Insurer Node)', 'Org2MSP (Assessor Node)'],
  className = '',
}: BlockchainIntegrityFlowProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const stages = [
    {
      num: 1,
      name: 'Record',
      desc: 'Canonical JSON data created',
      icon: FileText,
    },
    {
      num: 2,
      name: 'Fingerprint',
      desc: 'SHA-256 hash computed',
      icon: Fingerprint,
    },
    {
      num: 3,
      name: 'Private Ledger',
      desc: 'Committed to Hyperledger Fabric',
      icon: Database,
    },
    {
      num: 4,
      name: 'Transaction ID',
      desc: 'Raft consensus receipt',
      icon: Key,
    },
    {
      num: 5,
      name: 'Verification',
      desc: 'Tamper-evident audit trail',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 ${className}`}>
      {/* Top Main Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Record Integrity Verified
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Ledger Confirmed
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              This record has not changed since it was cryptographically committed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
        >
          <span>{showExplanation ? 'Hide Process' : 'How does this work?'}</span>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Visual Flow Stages */}
      <div className="mt-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {stages.map((stage, sIdx) => {
            const Icon = stage.icon;
            const isLast = sIdx === stages.length - 1;

            return (
              <div
                key={stage.num}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isLast
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-zinc-400">0{stage.num}</span>
                    <Icon className={`w-3.5 h-3.5 ${isLast ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`} />
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stage.name}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                  {stage.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded How It Works Section */}
      {showExplanation && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4 text-xs">
          {/* Plain Language Explanation */}
          <div className="bg-sky-50/50 dark:bg-sky-950/30 p-3.5 rounded-lg border border-sky-200/60 dark:border-sky-800/50 space-y-2">
            <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>How VeriSure Verifies Record Integrity:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-sky-800 dark:text-sky-300 leading-relaxed text-[11px]">
              <li>VeriSure generates a standardized, deterministic JSON representation of the record.</li>
              <li>A cryptographic SHA-256 fingerprint is calculated from that payload.</li>
              <li>The fingerprint is recorded on the private Hyperledger Fabric network across peer organizations.</li>
              <li>The network validates consensus via Raft ordering and returns an immutable transaction ID.</li>
              <li>VeriSure compares the live database representation against the ledger to confirm zero tampering.</li>
            </ol>

            {/* Critical Honesty Disclaimer */}
            <div className="pt-2 border-t border-sky-200/50 dark:border-sky-800/40 text-[11px] text-sky-900 dark:text-sky-200 font-medium">
              <strong>Note on verification:</strong> Blockchain verification confirms that the recorded digital data has remained intact and unchanged since entry. It does not certify external real-world physical events.
            </div>
          </div>

          {/* Technical Metadata Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{showTechnical ? 'Hide Ledger Technical Details' : 'View Ledger Transaction & Channel Details'}</span>
            </button>

            {showTechnical && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Consortium Network:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Private Hyperledger Fabric (Dual-Peer Raft)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Ledger Channel:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{channelName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Transaction ID:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 break-all">{txId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Payload Hash (SHA-256):</span>
                  <span className="text-zinc-700 dark:text-zinc-300 break-all">{payloadHash}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{timestamp}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-zinc-500">Endorsing Orgs:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{organizations.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
