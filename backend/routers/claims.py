from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import datetime
import hashlib
import json
from main import get_current_profile, supabase

router = APIRouter(prefix="/claims", tags=["Claims"])

class ClaimBase(BaseModel):
    policy_id: str
    accident_id: Optional[str]
    estimated_repair_cost: Optional[float]
    status: str = "DRAFT"

@router.get("/", response_model=List[dict])
async def list_claims(profile: dict = Depends(get_current_profile)):
    # Depending on role, fetch claims
    if profile["role"] == "POLICYHOLDER":
        policies = supabase.table("policies").select("id").eq("policyholder_id", profile["id"]).execute()
        p_ids = [p["id"] for p in policies.data]
        if not p_ids:
            return []
        res = supabase.table("claims").select("*, policies(vehicle_id)").in_("policy_id", p_ids).execute()
    else:
        res = supabase.table("claims").select("*").limit(50).execute()
    return res.data

@router.post("/")
async def create_claim(claim: ClaimBase, profile: dict = Depends(get_current_profile)):
    res = supabase.table("claims").insert(claim.dict()).execute()
    c_data = res.data[0]
    
    local_hash = hashlib.sha256(json.dumps(c_data, sort_keys=True).encode()).hexdigest()
    
    # Commit to blockchain asynchronously or await
    from services.blockchain_service import commit_event_to_ledger
    ledger_result = await commit_event_to_ledger(
        vehicle_id=c_data.get("vehicle_id", "UNKNOWN"), 
        event_type="CLAIM_CREATED", 
        entity_id=c_data["id"], 
        local_hash=local_hash
    )
    
    supabase.table("ledger_references").insert({
        "event_type": "CLAIM_CREATED",
        "entity_id": c_data["id"],
        "entity_table": "claims",
        "local_data_hash": local_hash,
        "blockchain_tx_id": ledger_result.get("transaction_id", "fallback_tx"),
        "org_id": profile["organization_id"]
    }).execute()
    
    return c_data
