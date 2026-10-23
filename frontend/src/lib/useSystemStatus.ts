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

// One request per page load, shared by every component that asks.
let inflight: Promise<SystemStatus> | null = null;

export function useSystemStatus(): State {
  const [state, setState] = useState<State>({ status: null, error: null, loading: true });

  useEffect(() => {
    let alive = true;
    inflight ??= apiFetch<SystemStatus>('/api/v1/system/status', { anonymous: true, timeoutMs: 60000 });
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
