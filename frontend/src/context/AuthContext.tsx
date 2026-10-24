'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getAuthToken, setAuthToken, clearAuthTokens } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';

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
    email: 'demo-policyholder@clearclaim.demo',
    token: 'dev-policyholder',
    targetRoute: '/decision',
    desc: 'Car owner with sample cars: check claims, read policies, share records.',
  },
  {
    role: 'INSURER',
    label: 'Insurer Underwriter',
    name: 'Demo Insurer Officer',
    email: 'demo-insurer@clearclaim.demo',
    token: 'dev-insurer',
    targetRoute: '/org/review',
    desc: 'Reviews claim records that owners shared, with integrity checks.',
  },
  {
    role: 'SURVEYOR',
    label: 'Motor Loss Assessor',
    name: 'Demo Motor Loss Assessor',
    email: 'demo-surveyor@clearclaim.demo',
    token: 'dev-surveyor',
    targetRoute: '/org/review',
    desc: 'Reviews shared records and reads repair estimates.',
  },
  {
    role: 'GARAGE',
    label: 'Authorized Workshop',
    name: 'Demo Auto Workshop',
    email: 'demo-garage@clearclaim.demo',
    token: 'dev-garage',
    targetRoute: '/org/workshop',
    desc: 'Builds estimates and shows customers their insurance split.',
  },
  {
    role: 'FLEET_OPERATOR',
    label: 'Fleet manager',
    name: 'Demo Fleet Manager',
    email: 'demo-fleet@clearclaim.example',
    token: 'dev-fleet',
    targetRoute: '/org/fleet',
    desc: 'Runs a cab and delivery fleet; plans which damage to claim.',
  },
  {
    role: 'ADMIN',
    label: 'Ledger Auditor',
    name: 'System Security Auditor',
    email: 'demo-admin@clearclaim.demo',
    token: 'dev-admin',
    targetRoute: '/verification',
    desc: 'Sees every workspace, for testing.',
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
    // user_metadata is editable by the user, so it is never trusted for the role;
    // start as policyholder and take the authoritative role from the backend.
    const userRole = 'policyholder';
    apiFetch<{ role: string }>('/api/v1/profiles/me')
      .then((p) => p?.role && setRole(p.role.toLowerCase()))
      .catch(() => {});
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

