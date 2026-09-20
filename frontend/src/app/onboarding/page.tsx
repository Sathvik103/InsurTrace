'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';
import {
  Scale,
  FileSearch,
  Car,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingOption {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: any;
  targetRoute: string;
  bulletPoints: string[];
}

const ONBOARDING_OPTIONS: OnboardingOption[] = [
  {
    id: 'decision',
    title: 'Decide whether to claim or pay myself',
    subtitle: 'Evaluate if an insurance claim makes financial sense after deductible & lost NCB.',
    badge: 'Most Popular',
    icon: Scale,
    targetRoute: '/decision',
    bulletPoints: [
      'Compare out-of-pocket repair costs vs insurance payout',
      'See exact 3-year No-Claim Bonus (NCB) premium loss',
      'Calculated using standard Indian Motor Tariff rules',
    ],
  },
  {
    id: 'extract',
    title: 'Review a garage repair estimate or policy',
    subtitle: 'Upload a repair bill or insurance document to check admissible amounts & depreciation.',
    icon: FileSearch,
    targetRoute: '/decision/extract',
    bulletPoints: [
      'Automatic extraction of line items, parts, and labour',
      'Checks plastic, glass, and metal depreciation schedules',
      'Side-by-side comparison with your insurance terms',
    ],
  },
  {
    id: 'register',
    title: 'Register my vehicle and track records',
    subtitle: 'Organize your vehicle registration, policy terms, and lifecycle events in one place.',
    icon: Car,
    targetRoute: '/vehicles/new',
    bulletPoints: [
      'Takes less than 60 seconds with simple registration number',
      'Keeps active policy, IDV, and NCB history synced',
      'Tamper-evident record verification',
    ],
  },
  {
    id: 'fleet',
    title: 'I manage a commercial fleet or business vehicles',
    subtitle: 'Track commercial passenger cabs, goods delivery trucks, or transport fleets.',
    icon: Truck,
    targetRoute: '/fleet',
    bulletPoints: [
      'Calculate daily business downtime losses during repairs',
      'Track fitness certificate and permit expiry schedules',
      'Fleet-wide policy and claim visibility',
    ],
  },
  {
    id: 'demo',
    title: 'Explore the platform with sample records',
    subtitle: 'Browse pre-populated personal and commercial vehicles in our demo sandbox.',
    badge: 'Instant Access',
    icon: Sparkles,
    targetRoute: '/vehicles',
    bulletPoints: [
      'No registration required — interactive demo mode',
      'Explore Hyundai Creta, Tata Nexon EV, and Mahindra Bolero',
      'Inspect real Hyperledger Fabric cryptographic ledger events',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('decision');

  const selectedOption = ONBOARDING_OPTIONS.find((o) => o.id === selectedId)!;

  const handleProceed = () => {
    router.push(selectedOption.targetRoute);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="flex justify-center mb-4">
                <VeriSureLogo size="lg" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Welcome to VeriSure
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Understand your vehicle, insurance, claims, and verified records in one place.
                <br className="hidden sm:inline" /> What would you like to accomplish first?
              </p>
            </div>
          </FadeIn>

          {/* Intent Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Options List */}
            <div className="md:col-span-7 space-y-3">
              {ONBOARDING_OPTIONS.map((option) => {
                const isSelected = option.id === selectedId;
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedId(option.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-start gap-3.5 relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-500 bg-white dark:bg-zinc-900 ring-2 ring-sky-500/20 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {option.title}
                        </span>
                        {option.badge && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {option.subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute right-4 top-4 text-sky-600 dark:text-sky-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preview & Action Column */}
            <div className="md:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm sticky top-28 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Selected Path
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Instant Transition
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {selectedOption.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {selectedOption.subtitle}
                </p>
              </div>

              {/* Highlights */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  What you get
                </span>
                <ul className="space-y-1.5">
                  {selectedOption.bulletPoints.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                    >
                      <span className="text-sky-600 font-bold mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleProceed}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity shadow-sm mt-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
