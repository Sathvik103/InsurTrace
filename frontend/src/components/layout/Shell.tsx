'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  Scale,
  FileSearch,
  ShieldCheck,
  Truck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Search,
  Building2,
  FileCheck2,
  Wrench,
  Check,
  AlertTriangle,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';
import { AttentionCenter } from '@/components/common/AttentionCenter';
import { CommandPalette } from '@/components/common/CommandPalette';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut, isDemo, activePersona, status, initialized } = useAuth();
  const { vehicles, selectedVehicle, selectedVehicleId, setSelectedVehicleId, isDemoActive } =
    useVehicle();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  const switcherRef = useRef<HTMLDivElement>(null);
  const portalsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
      if (portalsRef.current && !portalsRef.current.contains(event.target as Node)) {
        setPortalsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setSwitcherOpen(false);
    if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles/new') {
      router.push(`/vehicles/${vehicle.id}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  // 1. Session Hydration Guard
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

  // 2. Unauthenticated Guard
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

  const primaryNav = [
    { label: 'Vehicles', href: '/vehicles', icon: Car },
    { label: 'Claim Decision', href: '/decision', icon: Scale },
    { label: 'Documents', href: '/decision/extract', icon: FileSearch },
    { label: 'History & Integrity', href: '/verification', icon: ShieldCheck },
    { label: 'Fleet', href: '/fleet', icon: Truck },
    { label: 'Reports', href: '/reports', icon: FileText },
  ];

  const enterprisePortals = [
    { label: 'Insurer Command', href: '/dashboards/insurer', icon: Building2 },
    { label: 'Surveyor Assessment', href: '/dashboards/surveyor', icon: FileCheck2 },
    { label: 'Garage Workshop', href: '/dashboards/garage', icon: Wrench },
  ];

  const isVehicleWorkspace = pathname.startsWith('/vehicles/') && pathname !== '/vehicles/new';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* 1. Global Demo Mode Notice Banner */}
      {isDemoActive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 dark:bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200 shrink-0">
              Demo Mode
            </span>
            <span className="truncate">
              You are viewing sample vehicle records. Add your own vehicle to use VeriSure with your data.
            </span>
            <Link
              href="/vehicles/new"
              className="ml-auto underline font-semibold text-amber-950 dark:text-amber-100 hover:text-amber-800 shrink-0 hidden sm:inline"
            >
              Add My Vehicle →
            </Link>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Bar (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-6 shrink-0">
              <VeriSureLogo size="sm" asLink href="/" />

              {/* Desktop Primary Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {primaryNav.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Enterprise Portals Dropdown */}
                <div className="relative" ref={portalsRef}>
                  <button
                    type="button"
                    onClick={() => setPortalsOpen(!portalsOpen)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  >
                    <span>Portals</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {portalsOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1.5 z-50 text-xs">
                      {enterprisePortals.map((p) => {
                        const Icon = p.icon;
                        return (
                          <Link
                            key={p.href}
                            href={p.href}
                            onClick={() => setPortalsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                          >
                            <Icon className="w-4 h-4 text-zinc-500" />
                            <span>{p.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right: Actions, Search, Attention, Vehicle Switcher, Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Command Palette Trigger */}
              <button
                type="button"
                onClick={() => setCmdPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                title="Search or Run Command (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quick Search...</span>
                <kbd className="hidden md:inline text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Attention Center Popover */}
              <AttentionCenter />

              {/* Active Vehicle Switcher */}
              <div className="relative" ref={switcherRef}>
                <button
                  type="button"
                  onClick={() => setSwitcherOpen(!switcherOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold transition-all max-w-[200px] sm:max-w-[260px]"
                >
                  <Car className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <div className="truncate text-left">
                    <div className="truncate text-zinc-900 dark:text-zinc-100 leading-tight">
                      {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Select Vehicle'}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">
                      {selectedVehicle?.registration_number || 'None'} • {isDemoActive ? 'Demo' : 'My Car'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0 ml-auto" />
                </button>

                {switcherOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Switch Active Vehicle
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 my-1">
                      {vehicles.map((v) => {
                        const isSelected = v.id === selectedVehicleId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVehicle(v)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                              isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {v.make} {v.model}
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400">
                                {v.registration_number} • {v.is_demo ? 'Demo Record' : 'My Vehicle'}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 px-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Link
                        href="/vehicles/new"
                        onClick={() => setSwitcherOpen(false)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-zinc-800 dark:text-zinc-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Vehicle</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu Trigger */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:ring-2 hover:ring-sky-500/30"
                  title="Profile & Settings"
                >
                  {user?.email ? user.email.slice(0, 2).toUpperCase() : 'VS'}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {user?.email || 'Authenticated User'}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-mono mt-0.5">
                        Role: {role || 'Policyholder'}
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Settings & Privacy</span>
                    </Link>

                    <Link
                      href="/settings?tab=status"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>System Status</span>
                    </Link>

                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Contextual Vehicle Sub-Navigation Bar */}
        {isVehicleWorkspace && selectedVehicle && (
          <div className="bg-zinc-100/70 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-10 overflow-x-auto text-xs">
                {/* Active Context Marker */}
                <div className="flex items-center gap-2 shrink-0 pr-4">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </span>
                  <span className="font-mono text-zinc-500 text-[11px]">
                    ({selectedVehicle.registration_number})
                  </span>
                  {selectedVehicle.is_demo ? (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Demo
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      My Vehicle
                    </span>
                  )}
                </div>

                {/* Subnav Tabs */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/vehicles/${selectedVehicle.id}`}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      pathname === `/vehicles/${selectedVehicle.id}`
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    Command Center
                  </Link>

                  <Link
                    href={`/decision?vehicle_id=${selectedVehicle.id}`}
                    className="px-2.5 py-1 rounded-md font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                  >
                    Check Claim
                  </Link>

                  <Link
                    href="/decision/extract"
                    className="px-2.5 py-1 rounded-md font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                  >
                    Documents
                  </Link>

                  <Link
                    href="/decision/consent"
                    className="px-2.5 py-1 rounded-md font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                  >
                    Share Records
                  </Link>

                  <Link
                    href={`/reports?vehicle_id=${selectedVehicle.id}`}
                    className="px-2.5 py-1 rounded-md font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                  >
                    Report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 4. Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2">
              Primary Navigation
            </div>
            {primaryNav.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2">
              Enterprise Portals
            </div>
            {enterprisePortals.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Icon className="w-4 h-4" />
                  <span>{p.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
            <span className="text-zinc-500">{user?.email || 'Guest'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* 6. Command Palette Modal */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </div>
  );
}

export { Shell as AppShell };
