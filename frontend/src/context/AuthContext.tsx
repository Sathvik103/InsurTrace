'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getAuthToken, setAuthToken } from '@/lib/supabase';

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
    email: 'demo-policyholder@insuretrace.in',
    token: 'dev-policyholder',
    targetRoute: '/decision',
    desc: 'Vehicle owner evaluating claim math, deductible, NCB protection & blockchain history.',
  },
  {
    role: 'INSURER',
    label: 'Insurer Underwriter',
    name: 'Demo Insurer Officer',
    email: 'demo-insurer@insuretrace.in',
    token: 'dev-insurer',
    targetRoute: '/dashboards/insurer',
    desc: 'Underwriting officer auditing claim dossiers, loss ratios & fraud indicators.',
  },
  {
    role: 'SURVEYOR',
    label: 'Motor Loss Assessor',
    name: 'Demo Motor Loss Assessor',
    email: 'demo-surveyor@insuretrace.in',
    token: 'dev-surveyor',
    targetRoute: '/dashboards/surveyor',
    desc: 'Licensed independent assessor verifying physical vehicle damage & admissible parts.',
  },
  {
    role: 'GARAGE',
    label: 'Authorized Workshop',
    name: 'Demo Auto Workshop',
    email: 'demo-garage@insuretrace.in',
    token: 'dev-garage',
    targetRoute: '/dashboards/garage',
    desc: 'Authorized workshop uploading itemized repair estimates and parts invoices.',
  },
  {
    role: 'ADMIN',
    label: 'Ledger Auditor',
    name: 'System Security Auditor',
    email: 'demo-admin@insuretrace.in',
    token: 'dev-admin',
    targetRoute: '/verification',
    desc: 'Auditor verifying Hyperledger Fabric SHA-256 state proofs and tamper resistance.',
  },
];

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  isDemo: boolean;
  activePersona: Persona | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setDemoPersona: (persona: Persona) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isDemo: false,
  activePersona: null,
  loading: true,
  signOut: async () => {},
  setDemoPersona: () => {},
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = getAuthToken();
        setTokenState(storedToken);

        if (storedToken) {
          // Check if token matches a demo persona
          const matchedPersona = DEMO_PERSONAS.find((p) => p.token === storedToken);
          if (matchedPersona) {
            setIsDemo(true);
            setActivePersona(matchedPersona);
            setRole(matchedPersona.role.toLowerCase());
            setUser({
              id: 'demo-' + matchedPersona.role.toLowerCase(),
              email: matchedPersona.email,
              role: matchedPersona.role.toLowerCase(),
            });
            setLoading(false);
            return;
          }

          // Real Supabase session check
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              role: (session.user.user_metadata?.role || 'policyholder').toLowerCase(),
            });
            setRole((session.user.user_metadata?.role || 'policyholder').toLowerCase());
            setIsDemo(false);
            setActivePersona(null);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthToken(session.access_token);
        setTokenState(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: (session.user.user_metadata?.role || 'policyholder').toLowerCase(),
        });
        setRole((session.user.user_metadata?.role || 'policyholder').toLowerCase());
        setIsDemo(false);
        setActivePersona(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setDemoPersona = (persona: Persona) => {
    setAuthToken(persona.token);
    setTokenState(persona.token);
    setIsDemo(true);
    setActivePersona(persona);
    setRole(persona.role.toLowerCase());
    setUser({
      id: 'demo-' + persona.role.toLowerCase(),
      email: persona.email,
      role: persona.role.toLowerCase(),
    });
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('insuretrace_token');
    }
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setIsDemo(false);
    setActivePersona(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isDemo,
        activePersona,
        loading,
        signOut,
        setDemoPersona,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
