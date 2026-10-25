/**
 * Every key ClearClaim keeps in the browser, in one place.
 * localStorage survives restarts; sessionStorage lasts for one tab.
 */
export const KEYS = {
  token: 'cc_token', // local: session token (Supabase or demo)
  demoPersona: 'cc_demo_persona', // local: which demo account is signed in
  activeVehicle: 'cc_active_vehicle_id', // local
  customVehicles: 'cc_custom_vehicles', // local: cars saved on this device only
  fleetIncidents: 'cc_fleet_incidents', // local: fleet triage draft
  fleetOverrides: 'cc_fleet_overrides', // local: per-vehicle premium / IDV edits
  workshopDraft: 'cc_workshop_estimate', // local: workshop estimate draft
  extractHandoff: 'cc_extract_handoff', // session: reviewed PDF values on their way to the claim check
  assistantThread: 'cc_assistant_thread', // session
  systemStatus: 'cc_system_status', // session: cached status for 60 s
} as const;

// Keys used before the ClearClaim rename. Copied over once, then removed.
const LEGACY: [old: string, now: string, store: 'local' | 'session'][] = [
  ['verisure_token', KEYS.token, 'local'],
  ['insuretrace_token', KEYS.token, 'local'],
  ['verisure_demo_persona', KEYS.demoPersona, 'local'],
  ['verisure_active_vehicle_id', KEYS.activeVehicle, 'local'],
  ['verisure_custom_vehicles', KEYS.customVehicles, 'local'],
  ['verisure_extract_handoff', KEYS.extractHandoff, 'session'],
  ['verisure_assistant_thread', KEYS.assistantThread, 'session'],
];

let migrated = false;

/** Moves values from the old key names so nobody is signed out by the rename. Safe to call often. */
export function migrateLegacyStorage() {
  if (migrated || typeof window === 'undefined') return;
  migrated = true;
  try {
    for (const [old, now, kind] of LEGACY) {
      const store = kind === 'local' ? localStorage : sessionStorage;
      const v = store.getItem(old);
      if (v !== null && store.getItem(now) === null) store.setItem(now, v);
      store.removeItem(old);
    }
  } catch {
    // Storage can be blocked (private mode); nothing to migrate then.
  }
}
