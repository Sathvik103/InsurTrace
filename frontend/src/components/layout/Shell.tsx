'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
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
  ShieldAlert,
  ChevronDown,
  Plus,
  Truck,
  Scale,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut, isDemo, activePersona, status, initialized } = useAuth();
  const { vehicles, selectedVehicle, selectedVehicleId, setSelectedVehicleId, isDemoActive } =
    useVehicle();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setSwitcherOpen(false);
    // If currently on a vehicle detail page, navigate to the selected one
    if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles/new') {
      router.push(`/vehicles/${vehicle.id}`);
    }
  };

  const navSections = [
    {
      title: 'Vehicle & Insurance',
      items: [
        {
          label: 'My Vehicles',
          href: '/vehicles',
          icon: Car,
          roles: ['policyholder', 'insurer', 'surveyor', 'garage', 'admin', null],
        },
        {
          label: 'Claim Decision',
          href: '/decision',
          icon: Scale,
          roles: ['policyholder', 'insurer', 'surveyor', 'admin', null],
        },
        {
          label: 'Document Review',
          href: '/decision/extract',
          icon: FileSearch,
          roles: ['policyholder', 'insurer', 'surveyor', 'admin', null],
        },
        {
          label: 'Fleet Management',
          href: '/fleet',
          icon: Truck,
          roles: ['policyholder', 'admin', null],
        },
        {
          label: 'Data & Privacy',
          href: '/decision/consent',
          icon: ShieldAlert,
          roles: ['policyholder', 'admin', null],
        },
      ],
    },
    {
      title: 'Enterprise Portals',
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
          label: 'Record Verification',
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
    router.replace('/login');
  };

  // 1. Session Hydration Guard: show branded loading state, never prematurely redirect
  if (!initialized || status === 'hydrating') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <VeriSureLogo size="lg" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2">
            <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span>Restoring your session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Guard: redirect to login preserving current route in `next`
  if (status === 'unauthenticated' || !user) {
    if (typeof window !== 'undefined') {
      const nextTarget = encodeURIComponent(pathname);
      router.replace(`/login?next=${nextTarget}`);
    }
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <VeriSureLogo size="md" />
          <p className="text-xs text-zinc-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40">
        <VeriSureLogo size="sm" asLink href="/" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-zinc-600 dark:text-zinc-300"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-4">
          {/* Active vehicle switcher in mobile menu */}
          <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Active Vehicle
            </div>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                const found = vehicles.find((v) => v.id === e.target.value);
                if (found) handleSelectVehicle(found);
              }}
              className="w-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>

          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
            <span className="text-zinc-500">{user?.email || 'Guest'}</span>
            <button
              onClick={handleLogout}
              className="text-rose-600 font-medium hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800/80">
          {!collapsed ? (
            <VeriSureLogo size="sm" asLink href="/" />
          ) : (
            <VeriSureLogo size="sm" variant="mark-only" asLink href="/" className="mx-auto" />
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1 rounded-md"
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
                <div className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">
                  {role || 'Viewer'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area with Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Global Header: Vehicle Context Switcher + Environment Indicator */}
        <header className="hidden md:flex h-14 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 lg:px-8 items-center justify-between gap-4 sticky top-0 z-30">
          {/* Left: Global Vehicle Switcher */}
          <div className="relative" ref={switcherRef}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                My Vehicle:
              </span>

              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-colors shadow-2xs"
                aria-expanded={switcherOpen}
              >
                <span>
                  {selectedVehicle ? (
                    <>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </span>{' '}
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                        ({selectedVehicle.registration_number})
                      </span>
                    </>
                  ) : (
                    'Select Vehicle'
                  )}
                </span>
                {selectedVehicle?.usage_type && selectedVehicle.usage_type !== 'PERSONAL' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    {selectedVehicle.usage_type.replace('_', ' ')}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>

            {/* Switcher Dropdown Popover */}
            {switcherOpen && (
              <div className="absolute left-0 mt-2 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Switch Vehicle</span>
                  <span className="font-mono">{vehicles.length} Available</span>
                </div>

                <div className="max-h-64 overflow-y-auto px-1.5 py-1 space-y-1">
                  {vehicles.map((v) => {
                    const isSelected = v.id === selectedVehicleId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVehicle(v)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 font-semibold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">
                              {v.make} {v.model}
                            </span>
                            {v.usage_type && v.usage_type !== 'PERSONAL' && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 shrink-0">
                                {v.usage_type === 'GOODS_CARRIER' ? 'Goods' : v.usage_type}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {v.registration_number} • {v.manufacture_year}
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-zinc-100 dark:border-zinc-800 px-2 flex items-center justify-between text-xs">
                  <Link
                    href="/vehicles/new"
                    onClick={() => setSwitcherOpen(false)}
                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 font-medium py-1 px-2 rounded-md hover:bg-sky-50 dark:hover:bg-sky-950/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Vehicle</span>
                  </Link>

                  <Link
                    href="/vehicles"
                    onClick={() => setSwitcherOpen(false)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 py-1 px-2 rounded-md"
                  >
                    All Vehicles →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Explicit Demo Environment vs Live Data Badge */}
          <div className="flex items-center gap-3">
            {isDemoActive ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold tracking-tight">DEMO ENVIRONMENT</span>
                <span className="text-amber-400 dark:text-amber-600">•</span>
                <span className="text-[11px] opacity-85">Sample Records Only</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold tracking-tight">MY DATA</span>
                <span className="text-emerald-400 dark:text-emerald-600">•</span>
                <span className="text-[11px] opacity-85">Active User Record</span>
              </div>
            )}

            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Quick Start Guide"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Guide</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export { Shell as AppShell, Shell };
