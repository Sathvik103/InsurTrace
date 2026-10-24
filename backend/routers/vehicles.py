import datetime
import re
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from dependencies import get_current_profile, supabase
from services.access import accessible_vehicle_ids, require_vehicle_access

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

VEHICLE_CREATOR_ROLES = {"POLICYHOLDER", "FLEET_OPERATOR", "ADMIN"}


class VehicleBase(BaseModel):
    registration_number: str = Field(min_length=4, max_length=20)
    vin: Optional[str] = Field(default=None, max_length=40)
    make: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    manufacture_year: int = Field(ge=1980, le=datetime.date.today().year + 1)
    fuel_type: Optional[str] = Field(default=None, max_length=50)
    variant: Optional[str] = Field(default=None, max_length=100)
    usage_type: Optional[str] = "PERSONAL"
    permit_info: Optional[str] = Field(default=None, max_length=200)
    fitness_valid_until: Optional[str] = None
    downtime_cost_per_day: Optional[float] = Field(default=None, ge=0)
    is_demo: Optional[bool] = False
    # Owner-entered policy summary (shown as "Entered by owner"; not insurer data).
    idv: Optional[float] = Field(default=None, ge=0, le=100_000_000)
    ncb_percentage: Optional[int] = Field(default=None, ge=0, le=50)
    has_zero_dep: Optional[bool] = None
    policy_number: Optional[str] = Field(default=None, max_length=100)
    policy_expiry: Optional[str] = Field(default=None, max_length=20)
    # Own-damage renewal premium before NCB; prices the NCB loss of a claim.
    od_premium: Optional[float] = Field(default=None, ge=0, le=10_000_000)

    @field_validator("registration_number")
    @classmethod
    def _normalise_reg(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v).upper()
        if not re.fullmatch(r"[A-Z0-9]{4,15}", cleaned):
            raise ValueError("Registration number may only contain letters and digits.")
        return cleaned


class VehicleResponse(VehicleBase):
    id: str
    created_at: Optional[Any] = None


@router.get("", response_model=List[VehicleResponse])
@router.get("/", response_model=List[VehicleResponse])
async def list_vehicles(profile: dict = Depends(get_current_profile)):
    ids = accessible_vehicle_ids(profile)
    if ids is None:
        return supabase.table("vehicles").select("*").execute().data or []
    if not ids:
        return []
    return supabase.table("vehicles").select("*").in_("id", list(ids)).execute().data or []


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, profile: dict = Depends(get_current_profile)):
    require_vehicle_access(profile, vehicle_id)
    rows = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return rows[0]


@router.post("", response_model=VehicleResponse)
@router.post("/", response_model=VehicleResponse)
async def create_vehicle(vehicle: VehicleBase, profile: dict = Depends(get_current_profile)):
    if profile.get("role") not in VEHICLE_CREATOR_ROLES:
        raise HTTPException(status_code=403, detail="Your role cannot register vehicles.")
    existing = supabase.table("vehicles").select("id").eq("registration_number", vehicle.registration_number).execute().data
    if existing:
        raise HTTPException(status_code=409, detail="A vehicle with this registration number is already registered.")

    # Omit unset fields so the insert works on databases that haven't added the
    # newest optional columns yet (e.g. od_premium before migration 003).
    data = vehicle.model_dump(exclude_none=True)
    # Only administrators may create seeded demo records.
    data["is_demo"] = bool(vehicle.is_demo) and profile.get("role") == "ADMIN"
    v_data = supabase.table("vehicles").insert(data).execute().data[0]

    supabase.table("ownership_history").insert({
        "vehicle_id": v_data["id"],
        "owner_profile_id": profile["id"],
        "start_date": datetime.date.today().isoformat(),
    }).execute()
    return v_data


STATUS_WORDS = {
    "DRAFT": "saved check",
    "SUBMITTED": "submitted",
    "PENDING_SURVEY": "awaiting survey",
    "UNDER_REVIEW": "under review",
    "APPROVED": "approved by insurer",
    "REJECTED": "rejected by insurer",
    "SETTLED": "settled",
}


def _day(value: Any, default: str = "") -> str:
    s = str(value or default)
    return s.split("T")[0]


@router.get("/{vehicle_id}/timeline")
async def get_vehicle_timeline(vehicle_id: str, profile: dict = Depends(get_current_profile)):
    """
    Chronological history for the vehicle. Each event states where it came from;
    `blockchain_verified` is true only for records whose fingerprint is COMMITTED on Fabric.
    """
    require_vehicle_access(profile, vehicle_id)
    v_rows = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute().data
    if not v_rows:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    vehicle = v_rows[0]
    demo = bool(vehicle.get("is_demo"))
    events = []

    events.append({
        "date": _day(vehicle.get("created_at")),
        "event_type": "REGISTRATION",
        "title": "Vehicle added to ClearClaim",
        "description": f"{vehicle['make']} {vehicle['model']} ({vehicle['manufacture_year']}), registration {vehicle['registration_number']}",
        "provenance_type": "DEMO_RECORD" if demo else "USER_PROVIDED_RECORD",
        "actor": "Owner",
        "blockchain_verified": False,
    })

    owns = supabase.table("ownership_history").select("*, profiles(full_name)").eq("vehicle_id", vehicle_id).execute().data or []
    for o in owns:
        owner_name = o.get("profiles", {}).get("full_name", "Registered owner") if isinstance(o.get("profiles"), dict) else "Registered owner"
        events.append({
            "date": _day(o.get("start_date")),
            "event_type": "OWNERSHIP",
            "title": "Ownership recorded in ClearClaim",
            "description": f"Linked to {owner_name}",
            "provenance_type": "DEMO_RECORD" if demo else "DATABASE_RECORD",
            "actor": "ClearClaim account",
            "blockchain_verified": False,
        })

    pols = supabase.table("policies").select("*, organizations(name)").eq("vehicle_id", vehicle_id).execute().data or []
    for p in pols:
        org_name = p.get("organizations", {}).get("name", "Insurer") if isinstance(p.get("organizations"), dict) else "Insurer"
        idv = p.get("idv") or p.get("idv_amount") or 0
        events.append({
            "date": _day(p.get("start_date")),
            "event_type": "POLICY_ISSUED",
            "title": f"Policy on record ({p.get('policy_type', 'COMPREHENSIVE')})",
            "description": f"IDV ₹{float(idv):,.0f} · NCB {p.get('ncb_percentage', 0)}% · {org_name}",
            "provenance_type": "DEMO_RECORD" if demo else "USER_PROVIDED_RECORD",
            "actor": org_name,
            "blockchain_verified": False,
        })

    claims = supabase.table("claims").select("*").eq("vehicle_id", vehicle_id).execute().data or []
    known = {c["id"] for c in claims}
    p_ids = [p["id"] for p in pols]
    if p_ids:
        claims += [c for c in (supabase.table("claims").select("*").in_("policy_id", p_ids).execute().data or []) if c["id"] not in known]
    ledger_rows = (
        supabase.table("ledger_references").select("entity_id, blockchain_tx_id, sync_status")
        .in_("entity_id", [c["id"] for c in claims]).execute().data or []
    ) if claims else []
    ledger_by_claim = {r["entity_id"]: r for r in ledger_rows}
    for c in claims:
        ref = ledger_by_claim.get(c["id"], {})
        events.append({
            "date": _day(c.get("created_at")),
            "event_type": "CLAIM_FILED",
            "title": f"Claim recorded ({STATUS_WORDS.get(c.get('status', 'DRAFT'), str(c.get('status', '')).lower())})",
            "description": f"Claim {c.get('claim_number') or c['id'][:8]} · estimated repair ₹{float(c.get('estimated_repair_cost') or 0):,.0f}",
            "provenance_type": "DEMO_RECORD" if demo else "USER_PROVIDED_RECORD",
            "actor": "Policyholder",
            "claim_id": c["id"],
            "ledger_sync_status": ref.get("sync_status", "NOT_COMMITTED"),
            # Development-mock rows are never presented as anchored on a ledger.
            "blockchain_verified": ref.get("sync_status") == "COMMITTED" and ref.get("network_mode") != "MOCK",
            "ledger_network_mode": ref.get("network_mode"),
            "blockchain_tx_id": ref.get("blockchain_tx_id"),
        })

    cons = supabase.table("consents").select("*, organizations(name)").eq("vehicle_id", vehicle_id).execute().data or []
    for con in cons:
        target_org = con.get("organizations", {}).get("name", "Third party") if isinstance(con.get("organizations"), dict) else "Third party"
        events.append({
            "date": _day(con.get("created_at")),
            "event_type": "CONSENT_GRANTED",
            "title": "Data access granted",
            "description": f"Owner allowed {target_org} to view this vehicle's records until {str(con.get('valid_until', ''))[:10]}",
            "provenance_type": "DATABASE_RECORD",
            "actor": "Policyholder",
            "blockchain_verified": False,
        })

    events.sort(key=lambda x: x["date"], reverse=True)

    return {
        "vehicle": vehicle,
        "total_events": len(events),
        "timeline": events,
        "integrity_notice": "A ledger record proves that a record's contents have not changed since its fingerprint was anchored. It does not prove that the underlying event or damage occurred; that remains for insurers and surveyors to assess.",
    }
