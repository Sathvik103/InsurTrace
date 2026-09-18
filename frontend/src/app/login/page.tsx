"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Building, Wrench, FileSearch, Lock, CheckCircle, ArrowRight, RefreshCw, AlertCircle, LogOut, Terminal } from "lucide-react";
import { setAuthToken, getAuthToken, supabase } from "@/lib/supabase";

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
  POLICYHOLDER: "/decision",
  INSURER: "/dashboards/insurer",
  SURVEYOR: "/dashboards/surveyor",
  GARAGE: "/dashboards/garage",
  ADMIN: "/verification"
};

const DEMO_PERSONAS = [
  {
    role: "POLICYHOLDER",
    label: "Policyholder (Demo)",
    name: "Rahul Sharma",
    email: "user@example.com",
    token: "dev-policyholder",
    targetRoute: "/decision",
    desc: "Vehicle owner evaluating claim math, deductible, NCB protection & blockchain history.",
    icon: User,
    badgeColor: "border-blue-500/30 text-blue-400 bg-blue-500/10"
  },
  {
    role: "INSURER",
    label: "Insurer (Demo)",
    name: "Priya Patel",
    email: "claims@digit.com",
    token: "dev-insurer",
    targetRoute: "/dashboards/insurer",
    desc: "Underwriting officer auditing claim dossiers, loss ratios & fraud indicators.",
    icon: Building,
    badgeColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
  },
  {
    role: "SURVEYOR",
    label: "Surveyor (Demo)",
    name: "Amit Verma",
    email: "surveyor@irda-lic.in",
    token: "dev-surveyor",
    targetRoute: "/dashboards/surveyor",
    desc: "IRDAI-licensed independent assessor verifying physical vehicle damage.",
    icon: FileSearch,
    badgeColor: "border-amber-500/30 text-amber-400 bg-amber-500/10"
  },
  {
    role: "GARAGE",
    label: "Garage (Demo)",
    name: "Rajesh Auto Care",
    email: "garage@repair.com",
    token: "dev-garage",
    targetRoute: "/dashboards/garage",
    desc: "Authorized workshop uploading itemized repair estimates and parts invoices.",
    icon: Wrench,
    badgeColor: "border-purple-500/30 text-purple-400 bg-purple-500/10"
  },
  {
    role: "ADMIN",
    label: "Admin / Auditor (Demo)",
    name: "System Administrator",
    email: "admin@insuretrace.in",
    token: "dev-admin",
    targetRoute: "/verification",
    desc: "Platform regulator auditing Hyperledger Fabric consensus and ledger integrity.",
    icon: Shield,
    badgeColor: "border-rose-500/30 text-rose-400 bg-rose-500/10"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Demo switcher toggle: disabled if explicitly set to false or environment is production
  const isDemoEnabled = 
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false" && 
    process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setActiveProfile(null);
        return;
      }
      const res = await fetch("http://localhost:8000/api/v1/profiles/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.warn("Profile fetch error:", err);
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
        password
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        setAuthError("No access token returned by authentication provider.");
        return;
      }

      // 2. Pass JWT to backend for cryptographic verification & authoritative profile lookup
      setAuthToken(accessToken);
      const profileRes = await fetch("http://localhost:8000/api/v1/profiles/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!profileRes.ok) {
        const errDetail = await profileRes.json().catch(() => ({}));
        setAuthError(`Backend authentication rejected: ${errDetail.detail || "Unauthorized"}`);
        return;
      }

      const profile: Profile = await profileRes.json();
      setActiveProfile(profile);

      // 3. Route according to authoritative backend role (never client-chosen)
      const targetRoute = ROLE_ROUTES[profile.role] || "/decision";
      router.push(targetRoute);
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (persona: typeof DEMO_PERSONAS[0]) => {
    if (!isDemoEnabled) return;
    setSwitching(persona.role);
    setAuthError(null);
    setAuthToken(persona.token);

    try {
      const res = await fetch("http://localhost:8000/api/v1/profiles/me", {
        headers: { Authorization: `Bearer ${persona.token}` }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setAuthError(`Demo authentication rejected by backend: ${errJson.detail || "Unauthorized"}`);
        return;
      }

      const profile = await res.json();
      setActiveProfile(profile);
      setTimeout(() => {
        router.push(persona.targetRoute);
      }, 300);
    } catch (err: any) {
      setAuthError("Backend connection error: " + err.message);
    } finally {
      setSwitching(null);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setActiveProfile(null);
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">InsureTrace India</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enterprise Motor Insurance Intelligence & Distributed Ledger Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Active Session Status Card */}
        {activeProfile && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 backdrop-blur shadow-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Authenticated Session</div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <span>{activeProfile.full_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-indigo-300 font-mono font-bold">
                    {activeProfile.role}
                  </span>
                </div>
                {activeProfile.organization && (
                  <div className="text-xs text-zinc-400">{activeProfile.organization.name}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const target = ROLE_ROUTES[activeProfile.role] || "/decision";
                  router.push(target);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all"
              >
                Go to Workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {authError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* PRIMARY PRODUCTION AUTHENTICATION */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-5">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Production Enterprise Authentication
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in with your enterprise credentials. Role and permissions are authoritatively assigned by PostgreSQL Row-Level Security.
            </p>
          </div>

          <form onSubmit={handleProductionLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@insurer.com or name@garage.in"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to Enterprise Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ISOLATED DEMO PERSONA SWITCHER */}
          {isDemoEnabled && (
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  Development & Demo Sandbox Only
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                  DEMO MODE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                Development personas for local evaluation. These tokens are <strong>strictly disabled in production</strong> and cannot alter production state.
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DEMO_PERSONAS.map((persona) => {
                  const Icon = persona.icon;
                  const isSelected = activeProfile?.role === persona.role;
                  const isSwitchingThis = switching === persona.role;

                  return (
                    <button
                      key={persona.role}
                      type="button"
                      onClick={() => handleDemoSwitch(persona)}
                      disabled={switching !== null}
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10 shadow-sm"
                          : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${persona.badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            {persona.label}
                          </span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-xs font-semibold text-zinc-200">{persona.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{persona.email}</div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="text-zinc-500 font-mono text-[10px]">Route: {persona.targetRoute}</span>
                        <span className="text-amber-400 font-medium flex items-center gap-0.5">
                          {isSwitchingThis ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>Switch <ArrowRight className="w-2.5 h-2.5" /></>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
