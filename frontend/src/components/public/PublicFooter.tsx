import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/Logo';
import { BRAND } from '@/lib/brand';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/xray', label: 'Repair-quote X-ray' },
      { href: '/for-fleets', label: 'For fleets' },
      { href: '/for-workshops', label: 'For workshops' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/learn', label: 'Car insurance guide' },
      { href: '/learn/ncb', label: 'No-Claim Bonus' },
      { href: '/learn/idv', label: 'IDV explained' },
      { href: '/learn/claim-or-pay', label: 'Claim or pay yourself?' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/security', label: 'Security' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/disclaimer', label: 'Disclaimer' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <BrandLogo size="sm" asLink href="/" />
          <p className="max-w-xs text-sm leading-relaxed text-navy-500">{BRAND.descriptor}. Independent: not an insurer and never decides claims.</p>
          <a href={`mailto:${BRAND.contactEmail}`} className="text-sm font-medium text-steel-700 hover:underline">{BRAND.contactEmail}</a>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold text-navy-900">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-navy-500 transition hover:text-navy-900">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-navy-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-navy-400 sm:flex-row sm:justify-between">
          <p>© 2026 {BRAND.name}. All rights reserved.</p>
          <p>Estimates use standard motor-insurance rules. Your insurer and surveyor decide the actual settlement.</p>
        </div>
      </div>    </footer>
  );
}
