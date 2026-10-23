import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from dependencies import get_current_profile, supabase
from services.access import require_vehicle_access

router = APIRouter(prefix="/consents", tags=["Consent Management"])

MAX_CONSENT_DAYS = 365


class ConsentRequest(BaseModel):
    vehicle_id: str = Field(max_length=100)
    requesting_org_id: str = Field(max_length=100)
    valid_until: Optional[datetime.datetime] = None


def _audit(action: str, entity_type: str, entity_id: str, profile: dict, details: dict) -> None:
    supabase.table("audit_logs").insert({
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "performed_by": profile["id"],
        "details": details,
    }).execute()


@router.get("")
@router.get("/")
async def list_consents(profile: dict = Depends(get_current_profile)):
    if profile["role"] == "POLICYHOLDER":
        res = supabase.table("consents").select("*, organizations(name)").eq("owner_profile_id", profile["id"]).execute()
    else:
        res = supabase.table("consents").select("*, profiles(full_name)").eq("requesting_org_id", profile["organization_id"]).execute()
    return res.data or []


@router.post("")
@router.post("/")
async def grant_consent(req: ConsentRequest, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "POLICYHOLDER":
        raise HTTPException(status_code=403, detail="Only policyholders can grant consent.")
    require_vehicle_access(profile, req.vehicle_id)
    org = supabase.table("organizations").select("id").eq("id", req.requesting_org_id).execute().data
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    now = datetime.datetime.now(datetime.timezone.utc)
    valid_until = req.valid_until or now + datetime.timedelta(days=30)
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=datetime.timezone.utc)
    if valid_until <= now or valid_until > now + datetime.timedelta(days=MAX_CONSENT_DAYS):
        raise HTTPException(status_code=422, detail=f"Consent must expire within {MAX_CONSENT_DAYS} days from now.")

    data = {
        "owner_profile_id": profile["id"],
        "vehicle_id": req.vehicle_id,
        "requesting_org_id": req.requesting_org_id,
        "valid_until": valid_until.isoformat(),
    }
    res = supabase.table("consents").insert(data).execute()
    _audit("CONSENT_GRANTED", "vehicles", req.vehicle_id, profile,
           {"granted_to": req.requesting_org_id, "valid_until": data["valid_until"]})
    return res.data[0]


@router.delete("/{consent_id}")
async def revoke_consent(consent_id: str, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "POLICYHOLDER":
        raise HTTPException(status_code=403, detail="Only policyholders can revoke consent.")

    res = supabase.table("consents").delete().eq("id", consent_id).eq("owner_profile_id", profile["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Consent not found or you don't own it.")

    _audit("CONSENT_REVOKED", "consents", consent_id, profile, {})
    return {"status": "REVOKED"}
