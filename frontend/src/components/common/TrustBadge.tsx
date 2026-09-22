'use client';

import React from 'react';
import { 
  User, 
  FileText, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink,
  Lock,
  AlertCircle,
  Car
} from 'lucide-react';

export type TrustSourceType = 
  | 'USER_PROVIDED'
  | 'DOCUMENT_EXTRACTED'
  | 'COMPUTED_RESULT'
  | 'ML_ESTIMATE'
  | 'BLOCKCHAIN_RECORD'
  | 'EXTERNAL_SOURCE_NOT_CONNECTED'
  | 'EXTERNAL_SOURCE'
  | 'DEMO_RECORD'
  | 'MY_VEHICLE';

interface TrustBadgeProps {
  source: TrustSourceType;
  label?: string;
  sourceDocName?: string;
  pageNumber?: number;
  confidenceNote?: string;
  txId?: string;
  compact?: boolean;
  className?: string;
}

export function TrustBadge({
  source,
  label,
  sourceDocName,
  pageNumber,
  confidenceNote,
  txId,
  compact = false,
  className = '',
}: TrustBadgeProps) {
  switch (source) {
    case 'USER_PROVIDED':
      return (
        <span 
          title="Entered by you. Not externally verified." 
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 ${className}`}
        >
          <User className="w-3 h-3 text-zinc-500" />
          <span>{label || 'User Provided'}</span>
        </span>
      );

    case 'DOCUMENT_EXTRACTED':
      return (
        <span 
          title={confidenceNote || (sourceDocName ? `Extracted from ${sourceDocName}${pageNumber ? ` (p. ${pageNumber})` : ''}` : 'Extracted from uploaded document')}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 ${className}`}
        >
          <FileText className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>{label || 'Document Extracted'}</span>
          {sourceDocName && !compact && (
            <span className="text-[10px] text-sky-500 truncate max-w-[120px]">
              • {sourceDocName}
            </span>
          )}
        </span>
      );

    case 'COMPUTED_RESULT':
      return (
        <span 
          title="Calculated deterministically by the financial engine using Indian Motor Tariff rules."
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 ${className}`}
        >
          <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{label || 'Computed Result'}</span>
        </span>
      );

    case 'ML_ESTIMATE':
      return (
        <span 
          title="Experimental machine learning model output (Data-Limited). Not guaranteed."
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 ${className}`}
        >
          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span>{label || 'ML Estimate (Data-Limited)'}</span>
        </span>
      );

    case 'BLOCKCHAIN_RECORD':
      return (
        <span 
          title={txId ? `Record integrity verified on private Fabric ledger (Tx: ${txId.slice(0, 12)}...)` : 'Record integrity verified on private Hyperledger Fabric ledger'}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 ${className}`}
        >
          <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>{label || 'Record Integrity Verified'}</span>
        </span>
      );

    case 'DEMO_RECORD':
      return (
        <span 
          title="Sandbox demonstration vehicle with sample insurance data and mock history."
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>{label || 'DEMO RECORD'}</span>
        </span>
      );

    case 'MY_VEHICLE':
      return (
        <span 
          title="User-created vehicle record under your personal management."
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/80 ${className}`}
        >
          <Car className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{label || 'MY VEHICLE'}</span>
        </span>
      );

    case 'EXTERNAL_SOURCE_NOT_CONNECTED':
    case 'EXTERNAL_SOURCE':
    default:
      return (
        <span 
          title="Requires authorized partner or government API integration. Currently not connected."
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>{label || 'External Source — Not Connected'}</span>
        </span>
      );
  }
}
