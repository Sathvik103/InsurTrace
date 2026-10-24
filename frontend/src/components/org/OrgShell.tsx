'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Car, ClipboardList, FileText, Inbox, LayoutDashboard, LogOut, Settings, Share2, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/brand/Logo';

type Item = { href: string; label: string; icon: typeof Car };

export type OrgKind = 'fleet' | 'workshop' | 'review';

const NAV: Record<OrgKind, Item[]> = {
  fleet: [
    { href: '/org/fleet', label: 'Claim triage', icon: LayoutDashboard },
    { href: '/org/fleet/vehicles', label: 'Vehicles', icon: Truck },
    { href: '/org/records', label: 'Saved records', icon: ClipboardList },
    { href: '/decision/consent', label: 'Sharing', icon: Share2 },
  ],
  workshop: [
    { href: '/org/workshop', label: 'Estimates', icon: Wrench },
    { href: '/org/workshop/shared', label: 'Shared with us', icon: Car },
    { href: '/org/records', label: 'Saved records', icon: ClipboardList },
    { href: '/decision/extract', label: 'Read a PDF', icon: FileText },
  ],
  review: [
    { href: '/org/review', label: 'Shared records', icon: Inbox },
    { href: '/verification', label: 'Verify a record', icon: ShieldCheck },
    { href: '/decision/extract', label: 'Read a PDF', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
};

const KIND_LABEL: Record<OrgKind, string> = { fleet: 'Fleet', workshop: 'Workshop', review: 'Review' };

export const ORG_ROLES = ['fleet_operator', 'garage', 'insurer', 'surveyor', 'admin'];

export function orgKindFor(role?: string | null): OrgKind {
  const r = role?.toLowerCase();
  if (r === 'garage') return 'workshop';
  if (r === 'insurer' || r === 'surveyor') return 'review';
  return 'fleet';
}

const HOME: Record<OrgKind, string> = { fleet: '/org/fleet', workshop: '/org/workshop', review: '/org/review' };
export const orgHomeFor = (role?: string | null) => HOME[orgKindFor(role)];

/** Operations console for organisations: dense, sidebar-led, mobile tab bar. */
export function OrgShell({ children, title, subtitle, actions }: { children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, status, initialized, signOut, activePersona } = useAuth();
  const roleKey = (role || '').toLowerCase();
  const allowed = ORG_ROLES.includes(roleKey);
  // Each organisation only opens its own workspace; admins can open any.
  const wrongWorkspace =
    allowed && roleKey !== 'admin' && Object.entries(HOME).some(([k, href]) => pathname.startsWith(href) && k !== orgKindFor(roleKey));

  useEffect(() => {
    if (!initialized) return;
    if (status === 'unauthenticated') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === 'authenticated' && !allowed) router.replace('/vehicles');
    else if (status === 'authenticated' && wrongWorkspace) router.replace(orgHomeFor(roleKey));
  }, [initialized, status, allowed, wrongWorkspace, roleKey, pathname, router]);

  if (!initialized || status !== 'authenticated' || !user || !allowed || wrongWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-steel-400 border-t-transparent" />
      </div>
    );
  }

  // Admins see whichever workspace they opened.
  const kind: OrgKind =
    roleKey === 'admin' ? (pathname.startsWith('/org/workshop') ? 'workshop' : pathname.startsWith('/org/review') ? 'review' : 'fleet') : orgKindFor(roleKey);
  const items = NAV[kind];
  const active = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-[#f4f6fb] lg:pl-64 print:bg-white print:pl-0">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 print:!hidden flex-col bg-navy-950 text-navy-200 lg:flex">
        <Link href={items[0].href} className="flex items-center gap-2.5 px-6 py-5">
          <BrandMark size={30} />
          <span className="text-[17px] font-semibold text-white">Clear<span className="text-steel-300">Claim</span></span>
        </Link>
        <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-400">{KIND_LABEL[kind]} workspace</p>
        <nav className="flex-1 space-y-1 px-3" aria-label="Workspace">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? 'page' : undefined} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active(i.href) ? 'text-white' : 'hover:bg-white/5 hover:text-white'}`}>
              {active(i.href) && <motion.span layoutId="org-nav" className="absolute inset-0 rounded-xl bg-white/10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <i.icon className="relative h-4 w-4" />
              <span className="relative">{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{activePersona?.name || user.email}</p>
          <div className="mt-2 flex gap-2">
            <Link href="/settings" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"><Settings className="h-3.5 w-3.5" /> Settings</Link>
            <button type="button" onClick={async () => { await signOut(); router.replace('/login'); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-950 px-4 py-3 text-white lg:hidden print:hidden">
        <span className="flex items-center gap-2"><BrandMark size={26} /><span className="font-semibold">{KIND_LABEL[kind]}</span></span>
        <button type="button" onClick={async () => { await signOut(); router.replace('/login'); }} aria-label="Sign out" className="rounded-lg p-2 hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-navy-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 print:hidden border-t border-navy-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Workspace">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active(i.href) ? 'text-navy-950' : 'text-navy-400'}`}>
            <i.icon className="h-5 w-5" />
            {i.label.split(' ')[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
