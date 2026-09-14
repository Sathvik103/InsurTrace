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

def get_canonical_hash(data: dict) -> str:
    """
    Generates a cryptographically stable hash for the data.
    Ensures keys are sorted and spaces are removed to guarantee
    the same JSON serialization across different languages/platforms.
    """
    # Remove mutable metadata that shouldn't affect the core record's hash
    hash_data = {k: v for k, v in data.items() if k not in ["created_at", "updated_at"]}
    canonical_str = json.dumps(hash_data, separators=(',', ':'), sort_keys=True)
    return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

@router.get("/", response_model=List[dict])
async def list_claims(profile: dict = Depends(get_current_profile)):
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
    # 1. Database Transaction
    res = supabase.table("claims").insert(claim.dict()).execute()
    c_data = res.data[0]
    
    # 2. Canonical Hashing
    local_hash = get_canonical_hash(c_data)
    
    # 3. Create initial PENDING ledger reference
    ledger_res = supabase.table("ledger_references").insert({
        "event_type": "CLAIM_CREATED",
        "entity_id": c_data["id"],
        "entity_table": "claims",
        "local_data_hash": local_hash,
        "sync_status": "PENDING",
        "org_id": profile["organization_id"]
    }).execute()
    
    ledger_id = ledger_res.data[0]["id"]
    
    # 4. Attempt Blockchain Commit
    from services.blockchain_service import commit_event_to_ledger
    ledger_result = await commit_event_to_ledger(
        vehicle_id=c_data.get("vehicle_id", "UNKNOWN"), 
        event_type="CLAIM_CREATED", 
        entity_id=c_data["id"], 
        local_hash=local_hash
    )
    
    # 5. Update DB based on blockchain success/failure
    if ledger_result.get("success"):
        supabase.table("ledger_references").update({
            "sync_status": "COMMITTED",
            "blockchain_tx_id": ledger_result.get("transaction_id")
        }).eq("id", ledger_id).execute()
    else:
        supabase.table("ledger_references").update({
            "sync_status": "FAILED",
        }).eq("id", ledger_id).execute()
    
    return c_data
