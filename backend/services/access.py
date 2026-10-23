"""
Record-level authorization helpers.

The backend talks to the database with the service key, which bypasses RLS,
so every route must check access explicitly. These helpers express the rules:

- ADMIN: all records.
- POLICYHOLDER: vehicles they own (ownership_history) and their policies/claims.
- INSURER: vehicles whose policy their organisation issued, or with active consent.
- SURVEYOR / GARAGE / FLEET_OPERATOR: vehicles with an active consent to their organisation.
"""

import datetime
from typing import List, Optional, Set

from fastapi import HTTPException

from dependencies import supabase


def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _active_consent_vehicle_ids(org_id: Optional[str]) -> Set[str]:
    if not org_id:
        return set()
    rows = supabase.table("consents").select("vehicle_id, valid_until").eq("requesting_org_id", org_id).execute().data or []
    now = _now_iso()
    return {r["vehicle_id"] for r in rows if r.get("vehicle_id") and str(r.get("valid_until", "")) > now}


def accessible_vehicle_ids(profile: dict) -> Optional[Set[str]]:
    """Returns the set of vehicle IDs the profile may read, or None meaning 'all' (admin)."""
    role = profile.get("role")
    if role == "ADMIN":
        return None
    if role == "POLICYHOLDER":
        rows = supabase.table("ownership_history").select("vehicle_id").eq("owner_profile_id", profile["id"]).execute().data or []
        return {r["vehicle_id"] for r in rows}
    ids = _active_consent_vehicle_ids(profile.get("organization_id"))
    if role == "INSURER" and profile.get("organization_id"):
        pols = supabase.table("policies").select("vehicle_id").eq("organization_id", profile["organization_id"]).execute().data or []
        ids |= {p["vehicle_id"] for p in pols if p.get("vehicle_id")}
    return ids


def can_access_vehicle(profile: dict, vehicle_id: str) -> bool:
    ids = accessible_vehicle_ids(profile)
    return ids is None or vehicle_id in ids


def require_vehicle_access(profile: dict, vehicle_id: str) -> None:
    # 404 rather than 403 so that record existence is not disclosed.
    if not can_access_vehicle(profile, vehicle_id):
        raise HTTPException(status_code=404, detail="Vehicle not found.")


def claim_vehicle_id(claim: dict) -> Optional[str]:
    if claim.get("vehicle_id"):
        return claim["vehicle_id"]
    if claim.get("policy_id"):
        pol = supabase.table("policies").select("vehicle_id").eq("id", claim["policy_id"]).execute().data
        if pol:
            return pol[0].get("vehicle_id")
    return None


def require_claim_access(profile: dict, claim: dict) -> str:
    """Raises 404 unless the profile may read the claim. Returns the claim's vehicle ID."""
    vehicle_id = claim_vehicle_id(claim)
    if not vehicle_id or not can_access_vehicle(profile, vehicle_id):
        raise HTTPException(status_code=404, detail="Claim not found.")
    return vehicle_id


def filter_by_vehicle(rows: List[dict], profile: dict, key: str = "vehicle_id") -> List[dict]:
    ids = accessible_vehicle_ids(profile)
    if ids is None:
        return rows
    return [r for r in rows if r.get(key) in ids]
