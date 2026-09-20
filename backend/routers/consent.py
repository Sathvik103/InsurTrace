from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import datetime
from dependencies import get_current_profile, supabase

router = APIRouter(prefix="/consents", tags=["Consent Management"])

class ConsentRequest(BaseModel):
    vehicle_id: str
    requesting_org_id: str
    valid_until: Optional[str] = None

@router.get("")
@router.get("/")
async def list_consents(profile: dict = Depends(get_current_profile)):
    if profile["role"] == "POLICYHOLDER":
        res = supabase.table("consents").select("*, organizations(name)").eq("owner_profile_id", profile["id"]).execute()
    else:
        res = supabase.table("consents").select("*, profiles(full_name)").eq("requesting_org_id", profile["organization_id"]).execute()
    return res.data

@router.post("")
@router.post("/")
async def grant_consent(req: ConsentRequest, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "POLICYHOLDER":
        raise HTTPException(status_code=403, detail="Only policyholders can grant consent.")
        
    # Default 30 days
    if not req.valid_until:
        req.valid_until = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)).isoformat()
        
    data = {
        "owner_profile_id": profile["id"],
        "vehicle_id": req.vehicle_id,
        "requesting_org_id": req.requesting_org_id,
        "valid_until": req.valid_until
    }
    
    res = supabase.table("consents").insert(data).execute()
    
    # Audit log
    supabase.table("audit_logs").insert({
        "action": "CONSENT_GRANTED",
        "entity_type": "vehicles",
        "entity_id": req.vehicle_id,
        "performed_by": profile["id"],
        "details": {"granted_to": req.requesting_org_id, "valid_until": req.valid_until}
    }).execute()
    
    return res.data[0]

@router.delete("/{consent_id}")
async def revoke_consent(consent_id: str, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "POLICYHOLDER":
        raise HTTPException(status_code=403, detail="Only policyholders can revoke consent.")
        
    # Delete consent
    res = supabase.table("consents").delete().eq("id", consent_id).eq("owner_profile_id", profile["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Consent not found or you don't own it.")
        
    supabase.table("audit_logs").insert({
        "action": "CONSENT_REVOKED",
        "entity_type": "consents",
        "entity_id": consent_id,
        "performed_by": profile["id"],
        "details": {}
    }).execute()
    
    return {"status": "REVOKED"}
