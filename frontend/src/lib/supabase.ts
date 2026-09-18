import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("insuretrace_token") || "dev-policyholder";
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("insuretrace_token", token);
}
