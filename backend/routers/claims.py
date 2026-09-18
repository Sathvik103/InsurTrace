from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import datetime
import hashlib
import json
from dependencies import get_current_profile, supabase

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
    claim_dict = claim.dict()
    # 1. Resolve vehicle_id from policy if not provided
    v_id = claim_dict.get("vehicle_id")
    if not v_id:
        pol = supabase.table("policies").select("vehicle_id").eq("id", claim.policy_id).execute()
        if pol.data and pol.data[0].get("vehicle_id"):
            v_id = pol.data[0]["vehicle_id"]
    if not v_id:
        v_id = "V-REAL-101"
    claim_dict["vehicle_id"] = v_id

    # 2. Database Transaction
    res = supabase.table("claims").insert(claim_dict).execute()
    c_data = res.data[0]
    
    # 3. Canonical Hashing & Synchronized Timestamp
    local_hash = get_canonical_hash(c_data)
    event_timestamp = c_data.get("created_at")

    # 4. Create initial PENDING ledger reference
    ledger_res = supabase.table("ledger_references").insert({
        "event_type": "CLAIM_CREATED",
        "entity_id": c_data["id"],
        "entity_table": "claims",
        "local_data_hash": local_hash,
        "sync_status": "PENDING",
        "org_id": profile["organization_id"],
        "created_at": event_timestamp
    }).execute()
    
    ledger_id = ledger_res.data[0]["id"]
    
    # 5. Attempt Blockchain Commit with synchronized timestamp
    from services.blockchain_service import commit_event_to_ledger
    ledger_result = await commit_event_to_ledger(
        vehicle_id=v_id, 
        event_type="CLAIM_CREATED", 
        entity_id=c_data["id"], 
        local_hash=local_hash,
        timestamp=event_timestamp
    )
    
    # 6. Update DB based on blockchain success/failure
    if ledger_result.get("success"):
        supabase.table("ledger_references").update({
            "sync_status": "COMMITTED",
            "blockchain_tx_id": ledger_result.get("transaction_id"),
            "created_at": ledger_result.get("timestamp", event_timestamp)
        }).eq("id", ledger_id).execute()
    else:
        supabase.table("ledger_references").update({
            "sync_status": "FAILED",
        }).eq("id", ledger_id).execute()
    
    return {
        **c_data,
        "vehicle_id": v_id,
        "sync_status": "COMMITTED" if ledger_result.get("success") else "FAILED",
        "blockchain_tx_id": ledger_result.get("transaction_id"),
        "network_mode": ledger_result.get("network_mode", "UNKNOWN"),
        "canonical_hash": local_hash
    }

from services.ml_engine.pipeline import run_claim_intelligence
@router.post("/{claim_id}/analyze-intelligence")
async def analyze_claim_intelligence(claim_id: str, profile: dict = Depends(get_current_profile)):
    if profile["role"] not in ["INSURER", "SURVEYOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    c_res = supabase.table("claims").select("*, policies(vehicle_id)").eq("id", claim_id).execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim_data = c_res.data[0]
    vehicle_id = claim_data["policies"][0]["vehicle_id"]
    
    v_res = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute()
    vehicle_data = v_res.data[0] if v_res.data else {}
    
    intelligence_result = run_claim_intelligence(claim_id, claim_data, vehicle_data, historical_claims=0)
    
    # Store result in ml_predictions table
    supabase.table("ml_predictions").insert({
        "claim_id": claim_id,
        "model_version": intelligence_result["fraud_analysis"]["model_version"],
        "prediction_type": "FRAUD_AND_SEVERITY",
        "score": intelligence_result["fraud_analysis"]["risk_score"],
        "risk_level": intelligence_result["fraud_analysis"]["risk_level"],
        "explanation_json": intelligence_result
    }).execute()
    
    return intelligence_result

@router.get("/{claim_id}")
async def get_claim_details(claim_id: str, profile: dict = Depends(get_current_profile)):
    """
    Returns the comprehensive Claim Dossier:
    - Claim data
    - Associated policy details
    - Associated vehicle details
    - Ledger reference & Fabric verification status
    - Uploaded documents
    - ML Intelligence data availability disclosure
    """
    c_res = supabase.table("claims").select("*").eq("id", claim_id).execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Claim record not found.")
    claim_data = c_res.data[0]

    # Policy
    policy_data = {}
    if claim_data.get("policy_id"):
        p_res = supabase.table("policies").select("*").eq("id", claim_data["policy_id"]).execute()
        if p_res.data:
            policy_data = p_res.data[0]

    # Vehicle
    vehicle_data = {}
    vehicle_id = policy_data.get("vehicle_id") or claim_data.get("vehicle_id")
    if vehicle_id:
        v_res = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute()
        if v_res.data:
            vehicle_data = v_res.data[0]

    # Ledger reference
    ledger_ref = {}
    l_res = supabase.table("ledger_references").select("*").eq("entity_id", claim_id).execute()
    if l_res.data:
        ledger_ref = l_res.data[0]

    # Documents
    doc_res = supabase.table("documents").select("id, document_type, file_path, file_hash, extraction_status, created_at").eq("entity_id", claim_id).execute()
    documents = doc_res.data or []

    # Canonical hash
    current_hash = get_canonical_hash(claim_data)

    return {
        "claim": claim_data,
        "policy": policy_data,
        "vehicle": vehicle_data,
        "ledger": {
            "sync_status": ledger_ref.get("sync_status", "NOT_COMMITTED"),
            "blockchain_tx_id": ledger_ref.get("blockchain_tx_id"),
            "canonical_hash": current_hash,
            "created_at": ledger_ref.get("created_at")
        },
        "documents": documents,
        "ml_intelligence_disclosure": {
            "status": "DATA_LIMITED",
            "reason": "Regulatory consumer privacy restrictions (IRDAI/IIB) legally limit public access to row-level claim histories.",
            "available_features": ["Deterministic Depreciation Engine", "Rules-Based Document Extraction", "COCO-Damage CV Stub"]
        }
    }
