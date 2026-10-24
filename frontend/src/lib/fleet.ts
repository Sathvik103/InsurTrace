import type { Vehicle } from '@/context/VehicleContext';
import type { FleetVehicle } from '@/lib/triage';

/** Per-vehicle values a fleet manager can set locally when the record lacks them. */
export type Overrides = Record<string, { premium?: number; deductible?: number; idv?: number }>;

export const FLEET_INCIDENTS_KEY = 'cc_fleet_incidents';
export const FLEET_OVERRIDES_KEY = 'cc_fleet_overrides';

export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function toFleetVehicle(v: Vehicle, o: Overrides): FleetVehicle {
  return {
    id: v.id,
    label: `${v.make} ${v.model}`,
    registration: v.registration_number,
    ageYears: Math.max(0, new Date().getFullYear() - v.manufacture_year),
    idv: o[v.id]?.idv ?? v.idv ?? 0,
    ncb: v.ncb_percentage ?? 0,
    zeroDep: !!v.has_zero_dep,
    premium: o[v.id]?.premium ?? v.od_premium ?? 0,
    deductible: o[v.id]?.deductible ?? 1000,
    downtimePerDay: v.downtime_cost_per_day || 0,
  };
}
