'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand/Logo';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/xray', label: 'Quote X-ray' },
  { href: '/for-fleets', label: 'Fleets' },
  { href: '/for-workshops', label: 'Workshops' },
  { href: '/learn', label: 'Guide' },
  { href: '/system', label: 'System' },
];

/**
 * Floating pill navigation. `tone="dark"` starts transparent over a dark hero
 * and turns into frosted glass once the page scrolls.
 */
export function PublicNavbar({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signedIn = status === 'authenticated';
  const dark = tone === 'dark' && !scrolled;

  return (
    <>
    {/* Fixed header takes no space; light pages need a spacer, dark heroes sit underneath. */}
    {tone === 'light' && <div className="h-20 sm:h-24" aria-hidden="true" />}
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:pt-4">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`pointer-events-auto mx-auto flex h-14 max-w-5xl items-center justify-between rounded-xl pl-4 pr-2 transition-[background-color,box-shadow,border-color] duration-500 ${
          dark
            ? 'border border-white/10 bg-white/[0.04] text-white backdrop-blur-md'
            : 'border border-navy-100/80 bg-white/75 text-navy-900 shadow-[0_8px_30px_-12px_rgba(20,19,16,0.25)] backdrop-blur-xl'
        }`}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="ClearClaim home">
          <BrandMark size={28} />
          <span className="font-display text-[17px] font-semibold tracking-tight">
            Clear<span className={dark ? 'text-signal' : 'text-steel-600'}>Claim</span>
          </span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-navy-500 hover:text-navy-950'} ${active ? (dark ? 'text-white' : 'text-navy-950') : ''}`}
              >
                {active && <motion.span layoutId="pub-nav" className={`absolute inset-0 rounded-md ${dark ? 'bg-white/10' : 'bg-navy-50'}`} />}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          {!signedIn && (
            <Link href="/login" className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${dark ? 'text-white/80 hover:text-white' : 'text-navy-700 hover:text-navy-950'}`}>
              Sign in
            </Link>
          )}
          <Link href={signedIn ? '/vehicles' : '/login?next=%2Fdecision'} className={dark ? 'vs-btn-signal px-4 py-2.5 text-sm' : 'vs-btn-primary py-2.5'}>
            {signedIn ? 'My cars' : 'Check a claim'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} className={`rounded-md p-2.5 lg:hidden ${dark ? 'text-white' : 'text-navy-800'}`} aria-expanded={open} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl border border-navy-100 bg-white p-3 shadow-2xl lg:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.div key={l.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3.5 font-display text-lg font-medium text-navy-900 hover:bg-navy-50">
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <div className="mt-2 grid gap-2">
              <Link href={signedIn ? '/vehicles' : '/login?next=%2Fdecision'} className="vs-btn-primary w-full py-3.5">
                {signedIn ? 'My cars' : 'Check a claim'} <ArrowRight className="h-4 w-4" />
              </Link>
              {!signedIn && <Link href="/login" className="vs-btn-secondary w-full py-3.5">Sign in</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
