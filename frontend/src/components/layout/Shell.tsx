'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Car,
  Check,
  ChevronDown,
  FileSearch,
  FileText,
  LayoutGrid,
  LogOut,
  Plus,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Activity,
  Truck,
  UserRound,
  Wrench,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { BrandLogo } from '@/components/brand/Logo';
import { AttentionCenter } from '@/components/common/AttentionCenter';
import { CommandPalette } from '@/components/common/CommandPalette';

interface ShellProps {
  children: React.ReactNode;
}

type NavItem = { label: string; href: string; icon: typeof Car; match?: (p: string) => boolean; roles?: string[] };

export const PRIMARY_NAV: NavItem[] = [
  { label: 'My cars', href: '/vehicles', icon: Car, match: (p) => p === '/vehicles' || (p.startsWith('/vehicles/') && p !== '/vehicles/new') },
  { label: 'Check a claim', href: '/decision', icon: Scale, match: (p) => p === '/decision' },
  { label: 'Documents', href: '/decision/extract', icon: FileSearch },
  { label: 'Verify a record', href: '/verification', icon: ShieldCheck },
];

export const MORE_NAV: NavItem[] = [
  { label: 'Vehicle passport', href: '/reports', icon: FileText },
  { label: 'Data & privacy', href: '/decision/consent', icon: Lock },
  { label: 'Review workspace', href: '/org/review', icon: Building2, roles: ['insurer', 'surveyor', 'admin'] },
  { label: 'Workshop workspace', href: '/org/workshop', icon: Wrench, roles: ['garage', 'admin'] },
  { label: 'Fleet workspace', href: '/org/fleet', icon: Truck, roles: ['fleet_operator', 'admin'] },
];

const isActive = (item: NavItem, pathname: string) => (item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`));

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [ref, onOutside]);
}

const menuMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut, isDemo, activePersona, status, initialized } = useAuth();
  const { vehicles, selectedVehicle, setSelectedVehicleId, isDemoActive } = useVehicle();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);

  // Redirect unauthenticated visitors after render, never during it.
  useEffect(() => {
    if (initialized && status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, status, pathname, router]);


  // Ctrl/Cmd+K toggles search from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!initialized || status === 'hydrating' || status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <BrandLogo size="lg" />
        </motion.div>
        <div className="flex items-center gap-2.5 text-sm text-navy-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-steel-500 border-t-transparent" />
          {status === 'unauthenticated' ? 'Taking you to sign in…' : 'Loading your account…'}
        </div>
      </div>
    );
  }

  const roleKey = (role || '').toLowerCase();
  const more = MORE_NAV.filter((i) => !i.roles || i.roles.includes(roleKey));

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f5f0] text-navy-900">
      {isDemoActive && (
        <div className="bg-navy-950 px-4 py-2 text-center text-xs text-white/70">
          <span className="mr-2 rounded-md bg-amber-300 px-2 py-0.5 font-semibold text-navy-950">Sample data</span>
          Calculations are real; the cars, policies and records are fictional.{' '}
          <Link href="/onboarding" className="font-semibold text-white underline-offset-2 hover:underline">Add your own car</Link>
        </div>
      )}

      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-xl border border-navy-100/80 bg-white/80 pl-4 pr-2 shadow-[0_8px_30px_-14px_rgba(20,19,16,0.25)] backdrop-blur-xl">
          <Link href="/vehicles" className="mr-2 shrink-0" aria-label="ClearClaim home">
            <BrandLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors xl:px-3.5 ${active ? 'text-white' : 'text-navy-600 hover:text-navy-900'}`}
                >
                  {active && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-md bg-navy-950" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
            <MoreMenu items={more} pathname={pathname} />
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-navy-100 bg-white px-3 py-2 text-sm text-navy-500 transition hover:border-navy-200 md:flex"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="hidden rounded-md bg-navy-50 px-1.5 py-0.5 font-mono text-[10px] text-navy-500 xl:inline">⌘K</kbd>
            </button>
            <AttentionCenter />
            <VehicleSwitcher vehicles={vehicles} selected={selectedVehicle} onSelect={(v) => {
              setSelectedVehicleId(v.id);
              if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles/new') router.push(`/vehicles/${v.id}`);
            }} />
            <ProfileMenu
              name={activePersona?.name || user.email || 'Account'}
              roleLabel={activePersona?.label || (role ? role[0].toUpperCase() + role.slice(1) : 'Member')}
              isDemo={isDemo}
              onSignOut={async () => {
                await signOut();
                router.replace('/login');
              }}
            />
          </div>
        </div>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-8 lg:pb-16"
      >
        {children}
      </motion.main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-50 mb-[env(safe-area-inset-bottom)] rounded-xl bg-navy-950 p-1.5 shadow-[0_18px_40px_-12px_rgba(20,19,16,0.6)] lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center gap-0.5 rounded-md py-2 text-[10px] font-medium">
                {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-md bg-white/10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <item.icon className={`relative h-5 w-5 ${active ? 'text-signal' : 'text-white/50'}`} />
                <span className={`relative ${active ? 'text-white' : 'text-white/50'}`}>{item.label.replace('Verify a record', 'Verify').replace('Check a claim', 'Check')}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMobileMore((v) => !v)} className="flex flex-col items-center gap-0.5 rounded-md py-2 text-[10px] font-medium text-white/50" aria-expanded={mobileMore}>
            <LayoutGrid className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMore && (
          <>
            <motion.div className="fixed inset-0 z-[55] bg-navy-950/20 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMore(false)} />
            <motion.div
              className="fixed inset-x-3 bottom-24 z-[56] rounded-2xl border border-navy-100 bg-white p-2 shadow-2xl lg:hidden"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              {[...more, { label: 'Settings', href: '/settings', icon: Settings }].map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setMobileMore(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-navy-800 hover:bg-navy-50">
                  <i.icon className="h-5 w-5 text-navy-500" /> {i.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {cmdOpen && <CommandPalette isOpen onClose={() => setCmdOpen(false)} />}
    </div>
  );
}

function MoreMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const active = items.some((i) => isActive(i, pathname));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-navy-100 text-navy-900' : 'text-navy-600 hover:text-navy-900'}`}
      >
        More <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...menuMotion} role="menu" className="absolute left-0 top-12 w-64 origin-top-left rounded-2xl border border-navy-100 bg-white p-1.5 shadow-xl">
            {items.map((i) => (
              <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(i, pathname) ? 'bg-navy-50 text-navy-900' : 'text-navy-700 hover:bg-navy-50'}`}>
                <i.icon className="h-4 w-4 text-navy-400" /> {i.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VehicleSwitcher({ vehicles, selected, onSelect }: { vehicles: Vehicle[]; selected?: Vehicle | null; onSelect: (v: Vehicle) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-md border border-navy-100 bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:border-navy-200"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-50 text-navy-700"><Car className="h-4 w-4" /></span>
        <span className="hidden max-w-[140px] sm:block">
          <span className="block truncate text-xs font-semibold leading-tight text-navy-900">{selected ? `${selected.make} ${selected.model}` : 'Choose a car'}</span>
          <span className="block truncate text-[10px] leading-tight text-navy-500">{selected?.registration_number}{selected?.is_demo ? ' · Demo' : ''}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-navy-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...menuMotion} className="absolute right-0 top-12 w-72 origin-top-right rounded-2xl border border-navy-100 bg-white p-1.5 shadow-xl" role="listbox" aria-label="Your cars">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Your cars</p>
            <div className="max-h-72 overflow-y-auto">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === v.id}
                  onClick={() => {
                    onSelect(v);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-navy-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy-900">{v.make} {v.model}</span>
                    <span className="block text-xs text-navy-500">{v.registration_number}{v.is_demo ? ' · Demo' : ''}{v.is_local_only ? ' · This browser only' : ''}</span>
                  </span>
                  {selected?.id === v.id && <Check className="h-4 w-4 text-navy-900" />}
                </button>
              ))}
            </div>
            <Link href="/onboarding" className="mt-1 flex items-center gap-2 rounded-xl border-t border-navy-50 px-3 py-2.5 text-sm font-semibold text-steel-700 hover:bg-steel-50">
              <Plus className="h-4 w-4" /> Add a car
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu({ name, roleLabel, isDemo, onSignOut }: { name: string; roleLabel: string; isDemo: boolean; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const initials = name.replace(/\(.*\)/, '').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white ring-2 ring-white transition hover:ring-navy-100">
        {initials || <UserRound className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...menuMotion} role="menu" className="absolute right-0 top-12 w-64 origin-top-right rounded-2xl border border-navy-100 bg-white p-1.5 shadow-xl">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-navy-900">{name}</p>
              <p className="text-xs text-navy-500">{roleLabel}{isDemo ? ' · Demo account' : ''}</p>
            </div>
            <div className="my-1 h-px bg-navy-50" />
            {[
              { label: 'Settings', href: '/settings', icon: Settings },
              { label: 'System status', href: '/settings?tab=status', icon: Activity },
            ].map((i) => (
              <Link key={i.href} href={i.href} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
                <i.icon className="h-4 w-4 text-navy-400" /> {i.label}
              </Link>
            ))}
            <button type="button" role="menuitem" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-loss hover:bg-loss-soft">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Shell as AppShell };
