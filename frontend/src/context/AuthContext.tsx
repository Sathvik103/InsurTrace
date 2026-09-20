'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getAuthToken, setAuthToken, clearAuthTokens } from '@/lib/supabase';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

export interface Persona {
  role: string;
  label: string;
  name: string;
  email: string;
  token: string;
  targetRoute: string;
  desc: string;
}

export const DEMO_PERSONAS: Persona[] = [
  {
    role: 'POLICYHOLDER',
    label: 'Policyholder',
    name: 'Rahul Sharma (Demo)',
    email: 'demo-policyholder@verisure.in',
    token: 'dev-policyholder',
    targetRoute: '/decision',
    desc: 'Vehicle owner evaluating claim math, deductible, NCB protection & blockchain history.',
  },
  {
    role: 'INSURER',
    label: 'Insurer Underwriter',
    name: 'Demo Insurer Officer',
    email: 'demo-insurer@verisure.in',
    token: 'dev-insurer',
    targetRoute: '/dashboards/insurer',
    desc: 'Underwriting officer auditing claim dossiers, loss ratios & fraud indicators.',
  },
  {
    role: 'SURVEYOR',
    label: 'Motor Loss Assessor',
    name: 'Demo Motor Loss Assessor',
    email: 'demo-surveyor@verisure.in',
    token: 'dev-surveyor',
    targetRoute: '/dashboards/surveyor',
    desc: 'Licensed independent assessor verifying physical vehicle damage & admissible parts.',
  },
  {
    role: 'GARAGE',
    label: 'Authorized Workshop',
    name: 'Demo Auto Workshop',
    email: 'demo-garage@verisure.in',
    token: 'dev-garage',
    targetRoute: '/dashboards/garage',
    desc: 'Authorized workshop uploading itemized repair estimates and parts invoices.',
  },
  {
    role: 'ADMIN',
    label: 'Ledger Auditor',
    name: 'System Security Auditor',
    email: 'demo-admin@verisure.in',
    token: 'dev-admin',
    targetRoute: '/verification',
    desc: 'Auditor verifying Hyperledger Fabric SHA-256 state proofs and tamper resistance.',
  },
];

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  role: string | null;
  status: AuthStatus;
  loading: boolean;
  initialized: boolean;
  isDemo: boolean;
  activePersona: Persona | null;
  token: string | null;
  signOut: () => Promise<void>;
  setDemoPersona: (persona: Persona) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  status: 'hydrating',
  loading: true,
  initialized: false,
  isDemo: false,
  activePersona: null,
  token: null,
  signOut: async () => {},
  setDemoPersona: () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('hydrating');
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  const applyDemoPersona = (persona: Persona) => {
    setIsDemo(true);
    setActivePersona(persona);
    setRole(persona.role.toLowerCase());
    setUser({
      id: 'demo-' + persona.role.toLowerCase(),
      email: persona.email,
      role: persona.role.toLowerCase(),
    });
    setTokenState(persona.token);
    setAuthToken(persona.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('verisure_demo_persona', JSON.stringify(persona));
    }
    setStatus('authenticated');
  };

  const applySupabaseSession = (sess: Session) => {
    setSession(sess);
    setTokenState(sess.access_token);
    setAuthToken(sess.access_token);
    const userRole = (sess.user.user_metadata?.role || 'policyholder').toLowerCase();
    setUser({
      id: sess.user.id,
      email: sess.user.email,
      role: userRole,
    });
    setRole(userRole);
    setIsDemo(false);
    setActivePersona(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('verisure_demo_persona');
    }
    setStatus('authenticated');
  };

  const clearSession = () => {
    setSession(null);
    setUser(null);
    setRole(null);
    setIsDemo(false);
    setActivePersona(null);
    setTokenState(null);
    clearAuthTokens();
    setStatus('unauthenticated');
  };

  const refreshSession = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (currentSession?.user) {
        applySupabaseSession(currentSession);
      }
    } catch (e) {
      console.warn('Manual session refresh error:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. First priority: Check real Supabase Auth session from client storage
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error);
        }

        if (initialSession?.user) {
          if (isMounted) applySupabaseSession(initialSession);
          return;
        }

        // 2. Second priority: Check if an active demo persona was saved in localStorage
        if (typeof window !== 'undefined') {
          const savedDemo = localStorage.getItem('verisure_demo_persona');
          if (savedDemo) {
            try {
              const persona: Persona = JSON.parse(savedDemo);
              const matched = DEMO_PERSONAS.find((p) => p.token === persona.token || p.role === persona.role);
              if (matched && isMounted) {
                applyDemoPersona(matched);
                return;
              }
            } catch (e) {
              console.warn('Failed parsing saved demo persona', e);
            }
          }

          // Legacy token fallback for demo
          const legacyToken = localStorage.getItem('verisure_token') || localStorage.getItem('insuretrace_token');
          if (legacyToken) {
            const matched = DEMO_PERSONAS.find((p) => p.token === legacyToken);
            if (matched && isMounted) {
              applyDemoPersona(matched);
              return;
            }
          }
        }

        // 3. Neither Supabase session nor demo persona found -> unauthenticated
        if (isMounted) {
          setStatus('unauthenticated');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setStatus('unauthenticated');
      }
    }

    initAuth();

    // Subscribe to all Supabase auth state change events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            if (currentSession?.user) {
              applySupabaseSession(currentSession);
            }
            break;
          case 'TOKEN_REFRESHED':
            if (currentSession?.user) {
              // Seamless refresh: update tokens without interrupting user
              setSession(currentSession);
              setTokenState(currentSession.access_token);
              setAuthToken(currentSession.access_token);
            }
            break;
          case 'USER_UPDATED':
            if (currentSession?.user) {
              applySupabaseSession(currentSession);
            }
            break;
          case 'SIGNED_OUT':
            clearSession();
            break;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setDemoPersona = (persona: Persona) => {
    applyDemoPersona(persona);
  };

  const signOut = async () => {
    clearSession();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
  };

  const loading = status === 'hydrating';
  const initialized = status !== 'hydrating';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        status,
        loading,
        initialized,
        isDemo,
        activePersona,
        token,
        signOut,
        setDemoPersona,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

