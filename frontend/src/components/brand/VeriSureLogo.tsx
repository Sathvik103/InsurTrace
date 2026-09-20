'use client';

import React from 'react';
import Link from 'next/link';

interface VeriSureLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'mark-only';
  showDescriptor?: boolean;
  inverted?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
}

export function VeriSureMark({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Navy to slate gradient for left facet */}
        <linearGradient id="vs_navy_grad" x1="4" y1="4" x2="26" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>

        {/* Vibrant cool blue / cyan gradient for checkmark / right facet */}
        <linearGradient id="vs_blue_grad" x1="14" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>

        {/* Soft highlight reflection */}
        <linearGradient id="vs_accent_grad" x1="18" y1="6" x2="34" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>

        {/* Subtle drop shadow */}
        <filter id="vs_shadow" x="0" y="2" width="40" height="38" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Protective Shield Base Curve */}
      <g filter="url(#vs_shadow)">
        {/* Left shield boundary / V down-stroke */}
        <path
          d="M7 8C7 7.44772 7.44772 7 8 7H14.5C15.1189 7 15.6811 7.37792 15.9082 7.94565L20 18.175L14.0918 28.0543C13.8647 28.6221 13.3025 29 12.6836 29H8C7.44772 29 7 28.5523 7 28V8Z"
          fill="url(#vs_navy_grad)"
        />

        {/* Main Verification Wing / Dynamic Checkmark */}
        <path
          d="M13.2 24.5L18.8 33.2C19.2 33.8 20.05 33.95 20.65 33.55C20.85 33.4 21.05 33.15 21.2 32.85L33.2 10.4C33.55 9.75 33.3 8.95 32.65 8.6C32.4 8.45 32.1 8.4 31.8 8.4H25.4C24.75 8.4 24.15 8.8 23.85 9.4L17.5 21.5L15.3 18.2C14.9 17.6 14.1 17.45 13.5 17.85C12.9 18.25 12.75 19.05 13.15 19.65L13.2 24.5Z"
          fill="url(#vs_blue_grad)"
        />

        {/* Crisp Top Accent / Verified Ray */}
        <path
          d="M21.5 8.5C21.5 7.67157 22.1716 7 23 7H31C31.5523 7 32 7.44772 32 8C32 8.22 31.92 8.43 31.78 8.6L24.8 20.5L21.5 15.2V8.5Z"
          fill="url(#vs_accent_grad)"
          opacity="0.95"
        />

        {/* Central Trust Node (Core verification pivot) */}
        <circle cx="20" cy="20" r="2" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function VeriSureLogo({
  size = 'md',
  variant = 'full',
  showDescriptor = true,
  inverted = false,
  className = '',
  asLink = false,
  href = '/',
}: VeriSureLogoProps) {
  const markDimensions = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 50,
  };

  const textStyles = {
    sm: {
      brand: 'text-base',
      descriptor: 'text-[8px]',
    },
    md: {
      brand: 'text-lg',
      descriptor: 'text-[9.5px]',
    },
    lg: {
      brand: 'text-2xl',
      descriptor: 'text-[11px]',
    },
    xl: {
      brand: 'text-3xl',
      descriptor: 'text-[12px]',
    },
  };

  const markSize = markDimensions[size];
  const styles = textStyles[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Vector SVG Mark */}
      <VeriSureMark size={markSize} />

      {/* Typography Wordmark */}
      {variant !== 'mark-only' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline tracking-tight">
            <span
              className={`font-extrabold ${styles.brand} ${
                inverted ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              Veri
            </span>
            <span
              className={`font-extrabold ${styles.brand} ${
                inverted ? 'text-sky-400' : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              Sure
            </span>
          </div>

          {variant === 'full' && showDescriptor && (
            <span
              className={`mt-1 font-semibold uppercase tracking-wider ${styles.descriptor} ${
                inverted ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Insurance Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg group"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default VeriSureLogo;
