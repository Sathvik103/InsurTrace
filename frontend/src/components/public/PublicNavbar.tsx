'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#questions', label: 'Common questions' },
  { href: '/about', label: 'About' },
  { href: '/security', label: 'Security' },
];

export function PublicNavbar() {
  const { status } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signedIn = status === 'authenticated';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-navy-100/80 bg-white/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <VeriSureLogo size="md" asLink href="/" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-navy-600 transition hover:text-navy-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link href="/vehicles" className="vs-btn-primary py-2.5">Go to my cars</Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-50">Sign in</Link>
              <Link href="/login?next=%2Fdecision" className="vs-btn-primary py-2.5">Check a claim</Link>
            </>
          )}
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full p-2 text-navy-700 md:hidden" aria-expanded={open} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-navy-100 bg-white md:hidden">
            <div className="space-y-1 p-4">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-base font-medium text-navy-800 hover:bg-navy-50">{l.label}</Link>
              ))}
              <Link href={signedIn ? '/vehicles' : '/login?next=%2Fdecision'} className="vs-btn-primary mt-2 w-full">{signedIn ? 'Go to my cars' : 'Check a claim'}</Link>
              {!signedIn && <Link href="/login" className="vs-btn-secondary w-full">Sign in</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
