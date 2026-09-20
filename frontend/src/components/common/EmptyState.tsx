'use client';

import React from 'react';
import { LucideIcon, FolderSearch, AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 p-6 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
          Operation Failed
        </h4>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
          {message || 'Unable to load records from the database. Verify your connection or permissions.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Query</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
      <div className="space-y-1.5 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
}
