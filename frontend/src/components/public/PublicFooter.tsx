'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, ExternalLink, Mail } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 dark:bg-zinc-950/50 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Column 1: Brand & Philosophy */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                VeriSure
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-zinc-500 dark:text-zinc-400">
              Insurance Intelligence & Verification. Deterministic financial decision engines,
              multi-party cryptographic audit trails on Hyperledger Fabric, and automated claim adjudication
              grounded in IRDAI regulatory guidelines.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Cryptographic state hashes sealed on Hyperledger Fabric Raft consensus.</span>
            </div>
          </div>

          {/* Column 2: Architecture & Technology */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-3">
              Architecture
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/technology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  System Architecture
                </Link>
              </li>
              <li>
                <Link href="/technology#fabric" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Hyperledger Fabric Ledger
                </Link>
              </li>
              <li>
                <Link href="/technology#math" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Deterministic Math Engine
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  PostgreSQL RLS & RBAC
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Workspaces */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-3">
              Workspaces
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/decision" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Claim Decision Calculator
                </Link>
              </li>
              <li>
                <Link href="/dashboards/insurer" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Insurer Command Center
                </Link>
              </li>
              <li>
                <Link href="/dashboards/surveyor" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Surveyor Workspace
                </Link>
              </li>
              <li>
                <Link href="/dashboards/garage" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Garage Workshop Portal
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Ledger Verification Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Contact */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-3">
              Compliance & Contact
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Regulatory Disclaimer
                </Link>
              </li>
              <li>
                <a
                  href="mailto:sathvikkandukuri202@gmail.com"
                  className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <Mail className="w-3 h-3" />
                  <span>Contact Engineer</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} VeriSure. All rights reserved.</p>
          <p className="max-w-xl text-center sm:text-right">
            VeriSure is a decision-support and cryptographic verification platform. Financial figures are deterministic projections calculated from policy schedules and garage estimates.
          </p>
        </div>
      </div>
    </footer>
  );
}
