'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface SystemComponentStatus {
  name: string;
  status: string;
  badge_variant?: string;
  details?: string;
  mode?: string;
}

export interface SystemStatus {
  environment: string;
  data_mode: 'SUPABASE' | 'DEMO_SANDBOX';
  components: Record<string, SystemComponentStatus>;
}

type State = { status: SystemStatus | null; error: unknown; loading: boolean };

// One request per minute per tab, shared by every component that asks.
let inflight: Promise<SystemStatus> | null = null;
const CACHE_KEY = 'cc_system_status';
const TTL_MS = 60_000;

function cached(): SystemStatus | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, status } = JSON.parse(raw);
    return Date.now() - at < TTL_MS ? (status as SystemStatus) : null;
  } catch {
    return null;
  }
}

function load(): Promise<SystemStatus> {
  const hit = cached();
  if (hit) return Promise.resolve(hit);
  return apiFetch<SystemStatus>('/api/v1/system/status', { anonymous: true, timeoutMs: 60000 }).then((status) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), status }));
    } catch {}
    return status;
  });
}

export function useSystemStatus(): State {
  const [state, setState] = useState<State>({ status: null, error: null, loading: true });

  useEffect(() => {
    let alive = true;
    inflight ??= load();
    inflight
      .then((status) => alive && setState({ status, error: null, loading: false }))
      .catch((error) => {
        inflight = null;
        if (alive) setState({ status: null, error, loading: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
