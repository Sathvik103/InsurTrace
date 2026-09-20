'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  FileSearch,
  Car,
  ShieldCheck,
  Building2,
  FileCheck2,
  Wrench,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut, isDemo, activePersona } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Core navigation items categorized by role
  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          label: 'Claim Decision',
          href: '/decision',
          icon: LayoutDashboard,
          roles: ['policyholder', 'insurer', 'surveyor', 'admin', null],
        },
        {
          label: 'Document Intelligence',
          href: '/decision/extract',
          icon: FileSearch,
          roles: ['policyholder', 'insurer', 'surveyor', 'admin', null],
        },
        {
          label: 'Vehicle Dossiers',
          href: '/vehicles/demo-vehicle-1',
          icon: Car,
          roles: ['policyholder', 'insurer', 'surveyor', 'garage', 'admin', null],
        },
        {
          label: 'Consent & Privacy',
          href: '/decision/consent',
          icon: ShieldAlert,
          roles: ['policyholder', 'admin', null],
        },
      ],
    },
    {
      title: 'Enterprise Roles',
      items: [
        {
          label: 'Insurer Command',
          href: '/dashboards/insurer',
          icon: Building2,
          roles: ['insurer', 'admin', null],
        },
        {
          label: 'Surveyor Assessment',
          href: '/dashboards/surveyor',
          icon: FileCheck2,
          roles: ['surveyor', 'admin', null],
        },
        {
          label: 'Garage Workshop',
          href: '/dashboards/garage',
          icon: Wrench,
          roles: ['garage', 'admin', null],
        },
      ],
    },
    {
      title: 'Governance',
      items: [
        {
          label: 'Ledger Verification',
          href: '/verification',
          icon: ShieldCheck,
          roles: ['admin', 'insurer', null],
        },
        {
          label: 'Settings',
          href: '/settings',
          icon: Settings,
          roles: ['policyholder', 'insurer', 'surveyor', 'garage', 'admin', null],
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">VeriSure</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-zinc-600 dark:text-zinc-300"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800/80">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight leading-none text-zinc-900 dark:text-zinc-100">
                  VeriSure
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-semibold tracking-wider mt-0.5">
                  Platform
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/" className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
            </Link>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1 rounded-md"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Persona Pill if active */}
        {isDemo && activePersona && !collapsed && (
          <div className="px-3 pt-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">
                <span>Demo Sandbox</span>
                <span className="font-mono">{role || 'GUEST'}</span>
              </div>
              <div className="text-xs font-medium text-amber-900 dark:text-amber-200 truncate mt-0.5">
                {activePersona.label}
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.email || 'Guest User'}
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono uppercase">
                  {role || 'Viewer'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Shell as AppShell, Shell };
