"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Building, Wrench, FileSearch, Lock, CheckCircle, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
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

const DEMO_ROLES = [
  {
    role: "POLICYHOLDER",
    label: "Policyholder",
    name: "Rahul Sharma",
    email: "user@example.com",
    token: "dev-policyholder",
    targetRoute: "/decision",
    desc: "Vehicle owner evaluating claims, deductible, NCB protection & blockchain provenance.",
    icon: User,
    color: "border-blue-500/30 text-blue-400 bg-blue-500/10"
  },
  {
    role: "INSURER",
    label: "Insurer",
    name: "Priya Patel",
    email: "claims@digit.com",
    token: "dev-insurer",
    targetRoute: "/dashboards/insurer",
    desc: "Underwriting & claims officer auditing loss ratios, fraud indicators & payouts.",
    icon: Building,
    color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
  },
  {
    role: "SURVEYOR",
    label: "Independent Surveyor",
    name: "Amit Verma",
    email: "surveyor@irda-lic.in",
    token: "dev-surveyor",
    targetRoute: "/dashboards/surveyor",
    desc: "IRDAI-licensed independent assessor verifying physical damage and repair parts.",
    icon: FileSearch,
    color: "border-amber-500/30 text-amber-400 bg-amber-500/10"
  },
  {
    role: "GARAGE",
    label: "Authorized Garage",
    name: "Rajesh Auto Care",
    email: "garage@repair.com",
    token: "dev-garage",
    targetRoute: "/dashboards/garage",
    desc: "Workshop service center uploading itemized repair estimates and parts invoices.",
    icon: Wrench,
    color: "border-purple-500/30 text-purple-400 bg-purple-500/10"
  },
  {
    role: "ADMIN",
    label: "System Admin & Auditor",
    name: "System Administrator",
    email: "admin@insuretrace.in",
    token: "dev-admin",
    targetRoute: "/verification",
    desc: "Platform regulator monitoring Hyperledger Fabric network & consensus integrity.",
    icon: Shield,
    color: "border-rose-500/30 text-rose-400 bg-rose-500/10"
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

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch("http://localhost:8000/api/v1/profiles/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data);
      }
    } catch (err) {
      console.warn("Could not fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const handleRoleSelect = async (roleConfig: typeof DEMO_ROLES[0]) => {
    setSwitching(roleConfig.role);
    setAuthError(null);
    setAuthToken(roleConfig.token);
    try {
      const res = await fetch("http://localhost:8000/api/v1/profiles/me", {
        headers: { Authorization: `Bearer ${roleConfig.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data);
        setTimeout(() => {
          router.push(roleConfig.targetRoute);
        }, 300);
      }
    } catch (err: any) {
      setAuthError("Failed to switch role with backend: " + err.message);
    } finally {
      setSwitching(null);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data?.session?.access_token) {
        setAuthToken(data.session.access_token);
        await fetchCurrentProfile();
        router.push("/decision");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">InsureTrace India</h2>
        <p className="mt-2 text-sm text-zinc-400">
          AI & Hyperledger Fabric Powered Motor Insurance Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        {/* Active Session Banner */}
        {activeProfile && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Identity</div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <span>{activeProfile.full_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                    {activeProfile.role}
                  </span>
                </div>
                {activeProfile.organization && (
                  <div className="text-xs text-zinc-500">{activeProfile.organization.name}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                const target = DEMO_ROLES.find(r => r.role === activeProfile.role)?.targetRoute || "/decision";
                router.push(target);
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-all"
            >
              Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {authError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Role Selector Grid */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Select Authorized Role (First-Run & Enterprise Access)
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select a persona to authenticate into its respective multi-tenant workspace with backend-enforced RBAC.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO_ROLES.map((roleConfig) => {
              const Icon = roleConfig.icon;
              const isSelected = activeProfile?.role === roleConfig.role;
              const isSwitchingThis = switching === roleConfig.role;

              return (
                <button
                  key={roleConfig.role}
                  onClick={() => handleRoleSelect(roleConfig)}
                  disabled={switching !== null}
                  className={`p-4 rounded-xl text-left border transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${roleConfig.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {roleConfig.label}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-zinc-100">{roleConfig.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mb-2">{roleConfig.email}</div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {roleConfig.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200">
                    <span className="font-mono text-[11px] text-zinc-500">Route: {roleConfig.targetRoute}</span>
                    <span className="flex items-center gap-1 text-indigo-400 font-medium">
                      {isSwitchingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <>Switch <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Supabase Direct Email/Password Login Option */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-300 flex items-center gap-2 select-none">
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in with Production Supabase Credentials</span>
              </summary>
              <form onSubmit={handleSupabaseLogin} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Sign In to Production"}
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
