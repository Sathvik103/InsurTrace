'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, Car, ChevronDown, ClipboardCheck, Eye, EyeOff, ShieldCheck, Wrench } from 'lucide-react';
import { supabase, setAuthToken } from '@/lib/supabase';
import { useAuth, DEMO_PERSONAS, Persona } from '@/context/AuthContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';

const EASE = [0.16, 1, 0.3, 1] as const;

const ROLE_ROUTES: Record<string, string> = {
  POLICYHOLDER: '/vehicles',
  INSURER: '/dashboards/insurer',
  SURVEYOR: '/dashboards/surveyor',
  GARAGE: '/dashboards/garage',
  ADMIN: '/verification',
};

const PERSONA_ICON: Record<string, typeof Car> = { POLICYHOLDER: Car, INSURER: Building2, SURVEYOR: ClipboardCheck, GARAGE: Wrench, ADMIN: ShieldCheck };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const params = useSearchParams();
  const next = params.get('next');
  const { user, role, setDemoPersona, status, initialized } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPro, setShowPro] = useState(false);

  // Only allow same-site relative redirects.
  const safeNext = (fallback: string) => (next && next.startsWith('/') && !next.startsWith('//') ? next : fallback);

  useEffect(() => {
    if (initialized && status === 'authenticated' && user) {
      router.replace(safeNext(ROLE_ROUTES[role?.toUpperCase() || ''] || '/vehicles'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, status, user, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: name.trim() } } });
        if (err) throw err;
        if (!data.session) {
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('signin');
          return;
        }
        setAuthToken(data.session.access_token);
        router.push(safeNext('/onboarding'));
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (err) throw err;
      if (!data.session) throw new Error('Sign-in did not return a session.');
      setAuthToken(data.session.access_token);
      const profile = await apiFetch<{ role: string }>('/api/v1/profiles/me');
      router.push(safeNext(ROLE_ROUTES[profile.role] || '/vehicles'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(
        /fetch|network|Failed/i.test(msg)
          ? 'We couldn’t reach the sign-in service. Please try again, or explore with sample data below.'
          : msg && !/HTTP \d/.test(msg)
            ? msg
            : describeApiError(err).message
      );
    } finally {
      setBusy(false);
    }
  };

  const choosePersona = (p: Persona) => {
    setDemoPersona(p);
    setAuthToken(p.token);
    router.push(safeNext(p.role === 'POLICYHOLDER' ? '/vehicles' : p.targetRoute));
  };

  const owner = DEMO_PERSONAS.find((p) => p.role === 'POLICYHOLDER');
  const pros = DEMO_PERSONAS.filter((p) => p.role !== 'POLICYHOLDER');

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-steel-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="vs-grid-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
        <motion.div aria-hidden="true" className="absolute -bottom-40 -left-20 h-[460px] w-[460px] rounded-full bg-steel-500/30 blur-3xl" animate={reduce ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <Link href="/" className="relative w-fit rounded-2xl bg-white px-3 py-2"><VeriSureLogo size="sm" /></Link>
        <div className="relative space-y-6">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Understand your car insurance before you make a call.</h2>
          <ul className="space-y-3 text-navy-100">
            {['See what your insurer might pay', 'Know if claiming costs you more than it saves', 'Keep a tamper-evident history of your car'].map((t, i) => (
              <motion.li key={t} initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1, ease: EASE, duration: 0.6 }} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10"><ShieldCheck className="h-3.5 w-3.5 text-steel-300" /></span>
                {t}
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-navy-300">VeriSure is independent. It is not an insurer and never files or decides claims.</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="w-full max-w-md space-y-8">
          <div className="space-y-3 lg:hidden"><Link href="/"><VeriSureLogo size="md" /></Link></div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="text-navy-600">{mode === 'signin' ? 'Sign in to see your cars and saved checks.' : 'Free. Takes less than a minute.'}</p>
          </div>

          <div className="inline-flex w-full rounded-2xl bg-navy-50 p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(null); }} className="relative flex-1 rounded-xl py-2.5 text-sm font-semibold text-navy-700">
                {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className="relative">{m === 'signin' ? 'Sign in' : 'Create account'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <label htmlFor="name" className="text-sm font-medium text-navy-800">Your name</label>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required={mode === 'signup'} className="vs-input mt-1.5" />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-navy-800">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="vs-input mt-1.5" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-navy-800">Password</label>
              <div className="relative mt-1.5">
                <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : undefined} required className="vs-input pr-12" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 hover:text-navy-700" aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && <p className="mt-1 text-xs text-navy-500">At least 8 characters.</p>}
            </div>
            {error && <p role="alert" className="rounded-2xl bg-loss-soft px-4 py-3 text-sm text-loss">{error}</p>}
            {notice && <p role="status" className="rounded-2xl bg-gain-soft px-4 py-3 text-sm text-gain">{notice}</p>}
            <button type="submit" disabled={busy} className="vs-btn-primary w-full py-3.5">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="relative text-center text-xs text-navy-400">
            <span className="relative z-10 bg-background px-3">or</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-navy-100" />
          </div>

          <div className="space-y-3">
            {owner && (
              <button type="button" onClick={() => choosePersona(owner)} className="vs-surface group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-steel-50 text-steel-700"><Car className="h-5 w-5" /></span>
                <span className="flex-1">
                  <span className="block font-semibold text-navy-900">Explore with sample data</span>
                  <span className="block text-sm text-navy-500">Try VeriSure as a car owner with fictional cars and policies</span>
                </span>
                <ArrowRight className="h-4 w-4 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-navy-700" />
              </button>
            )}
            <button type="button" onClick={() => setShowPro((v) => !v)} aria-expanded={showPro} className="flex w-full items-center justify-center gap-1 text-sm font-medium text-navy-500 hover:text-navy-800">
              Professional demo roles <ChevronDown className={`h-4 w-4 transition ${showPro ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {showPro && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid gap-2 overflow-hidden sm:grid-cols-2">
                  {pros.map((p) => {
                    const Icon = PERSONA_ICON[p.role] || ShieldCheck;
                    return (
                      <button key={p.role} type="button" onClick={() => choosePersona(p)} className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3 text-left text-sm transition hover:border-navy-300">
                        <Icon className="h-4 w-4 text-steel-600" />
                        <span className="font-medium text-navy-800">{p.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-center text-xs text-navy-400">
            By continuing you agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy notice</Link>.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
