/**
 * One-time hand-off of reviewed document fields from the Documents page to
 * the claim check, so nothing has to be typed twice. Stored in sessionStorage
 * (this tab only) and cleared as soon as the claim check reads it.
 */

import type { PartCategory } from '@/lib/claimCheck';

export interface HandoffItem {
  label: string;
  category: PartCategory;
  cost: number;
}

export interface ExtractHandoff {
  policy?: {
    idv?: number;
    ncb?: number;
    deductible?: number;
    policyNumber?: string;
    registrationNumber?: string;
  };
  items?: HandoffItem[];
  total?: number;
}

const KEY = 'verisure_extract_handoff';

export function saveHandoff(h: ExtractHandoff) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h));
  } catch {}
}

export function takeHandoff(): ExtractHandoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as ExtractHandoff;
  } catch {
    return null;
  }
}
