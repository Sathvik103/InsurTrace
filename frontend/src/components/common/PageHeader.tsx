'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  isSandbox?: boolean;
}

export function PageHeader({
  title,
  description,
  subtitle,
  breadcrumbs,
  actions,
  isSandbox = false,
}: PageHeaderProps) {
  const displayDesc = description || subtitle;
  return (
    <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-xs text-zinc-500 mb-2 font-medium">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-400" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-800 dark:text-zinc-200">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            {isSandbox && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Demo Sandbox
              </span>
            )}
          </div>
          {displayDesc && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl">
              {displayDesc}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
