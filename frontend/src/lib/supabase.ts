import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("verisure_token") || localStorage.getItem("insuretrace_token");
  if (token) return token;
  // If in an active demo persona session
  const demoPersona = localStorage.getItem("verisure_demo_persona");
  if (demoPersona) {
    try {
      const parsed = JSON.parse(demoPersona);
      if (parsed?.token) return parsed.token;
    } catch {}
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("verisure_token", token);
  localStorage.setItem("insuretrace_token", token);
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("verisure_token");
  localStorage.removeItem("insuretrace_token");
  localStorage.removeItem("verisure_demo_persona");
}

