import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

/** ClearClaim mark: a "C" that opens into a check. Clear answer, verified. */
export function BrandMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#111a31" />
      <path d="M27.5 12.6A10.5 10.5 0 1 0 29.8 24" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" fill="none" />
      <path d="M15.5 20.2l3.6 3.6 9.2-9.6" stroke="#45a0d6" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDescriptor?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
  inverted?: boolean;
}

const SIZES = { sm: { mark: 28, text: 'text-[17px]' }, md: { mark: 32, text: 'text-lg' }, lg: { mark: 40, text: 'text-2xl' }, xl: { mark: 52, text: 'text-3xl' } };

export function BrandLogo({ size = 'md', className = '', asLink, href = '/', inverted }: LogoProps) {
  const s = SIZES[size];
  const body = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={s.mark} />
      <span className={`${s.text} font-semibold tracking-tight ${inverted ? 'text-white' : 'text-navy-950'}`}>
        Clear<span className={inverted ? 'text-steel-300' : 'text-steel-600'}>Claim</span>
      </span>
    </span>
  );
  return asLink ? (
    <Link href={href} aria-label={`${BRAND.name} home`}>
      {body}
    </Link>
  ) : (
    body
  );
}
