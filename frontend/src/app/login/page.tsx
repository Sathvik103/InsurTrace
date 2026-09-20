'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { setAuthToken, getAuthToken, supabase } from '@/lib/supabase';
import { useAuth, DEMO_PERSONAS, Persona } from '@/context/AuthContext';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';
import {
  Shield,
  User,
  Building,
  Wrench,
  FileSearch,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Terminal,
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string;
  organization?: {
    name: string;
    type: string;
  };
}

const ROLE_ROUTES: Record<string, string> = {
  POLICYHOLDER: '/decision',
  INSURER: '/dashboards/insurer',
  SURVEYOR: '/dashboards/surveyor',
  GARAGE: '/dashboards/garage',
  ADMIN: '/verification',
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const { user, role, setDemoPersona, status, initialized } = useAuth();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const isDemoEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false' &&
    process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

  // Helper for safe internal redirects (prevent open redirect vulnerabilities)
  const getSafeRedirect = (defaultRoute: string) => {
    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
      return decodeURIComponent(nextParam);
    }
    return defaultRoute;
  };

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (initialized && status === 'authenticated' && user) {
      const defaultRoute = ROLE_ROUTES[role?.toUpperCase() || ''] || '/decision';
      router.replace(getSafeRedirect(defaultRoute));
    }
  }, [initialized, status, user, role, router, nextParam]);

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setActiveProfile(null);
        return;
      }
      const res = await fetch('http://localhost:8000/api/v1/profiles/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
      setActiveProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const handleProductionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        setAuthError('No access token returned by authentication provider.');
        return;
      }

      // 2. Pass JWT to backend for cryptographic verification & authoritative profile lookup
      setAuthToken(accessToken);
      const profileRes = await fetch('http://localhost:8000/api/v1/profiles/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        const errDetail = await profileRes.json().catch(() => ({}));
        setAuthError(`Backend authentication rejected: ${errDetail.detail || 'Unauthorized'}`);
        return;
      }

      const profile: Profile = await profileRes.json();
      setActiveProfile(profile);

      // 3. Route according to authoritative backend role or preserved next param
      const targetRoute = getSafeRedirect(ROLE_ROUTES[profile.role] || '/decision');
      router.push(targetRoute);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoPersona = async (persona: Persona) => {
    setSwitching(persona.role);
    setAuthError(null);
    try {
      setDemoPersona(persona);
      setAuthToken(persona.token);

      // Verify persona profile from backend
      const res = await fetch('http://localhost:8000/api/v1/profiles/me', {
        headers: { Authorization: `Bearer ${persona.token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setActiveProfile(profile);
      }
      const targetRoute = getSafeRedirect(persona.targetRoute);
      router.push(targetRoute);
    } catch (e: any) {
      console.error('Demo switch error:', e);
      setAuthError('Failed to activate demo persona.');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="text-center max-w-xl mx-auto mb-10">
              <div className="flex justify-center mb-5">
                <VeriSureLogo size="lg" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Sign In to Your Workspace
              </h1>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Access your vehicles, verified records, and insurance analytics
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-3xl mx-auto">
            {/* Supabase Production Login */}
            <div className="md:col-span-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Account Sign In
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Secure Supabase Auth with authoritative role resolution
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleProductionLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </form>
            </div>

            {/* Quarantined Sandbox Demo Switcher */}
            {isDemoEnabled && (
              <div className="md:col-span-6 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/50 pb-3">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Demo Sandbox Personas</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                    DEV ONLY
                  </span>
                </div>

                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  Quickly switch between pre-seeded role personas to evaluate multi-party workflows. Role switching is isolated and locked out in production.
                </p>

                <div className="space-y-2">
                  {DEMO_PERSONAS.map((persona) => (
                    <button
                      key={persona.role}
                      onClick={() => handleSelectDemoPersona(persona)}
                      disabled={switching !== null}
                      className="w-full text-left p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-zinc-900 hover:border-amber-400 dark:hover:border-amber-700 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{persona.label}</span>
                          <span className="text-[10px] font-mono text-zinc-400 font-normal">
                            ({persona.role})
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                          {persona.desc}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
          <VeriSureLogo size="md" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

