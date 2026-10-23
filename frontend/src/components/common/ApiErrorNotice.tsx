'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff, WifiOff } from 'lucide-react';
import { ApiError, describeApiError } from '@/lib/api';

interface ApiErrorNoticeProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Inline, plain-language explanation of an API failure with an optional retry. */
export function ApiErrorNotice({ error, onRetry, retrying, className = '' }: ApiErrorNoticeProps) {
  const { title, message, retryable } = describeApiError(error);
  const kind = error instanceof ApiError ? error.kind : 'server';
  const Icon = kind === 'network' || kind === 'timeout' ? WifiOff : kind === 'config' ? ServerOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed opacity-90">{message}</p>
      </div>
      {onRetry && retryable && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  );
}
