from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from main import get_current_profile, supabase
import hashlib
import json
from services.blockchain_service import verify_event_from_ledger

router = APIRouter(prefix="/admin", tags=["Admin/Verification"])

@router.post("/tamper-claim/{claim_id}")
async def tamper_claim(claim_id: str, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
        
    # intentionally modify the claim's estimated_repair_cost
    supabase.table("claims").update({"estimated_repair_cost": 999999.99}).eq("id", claim_id).execute()
    return {"status": "TAMPERED", "message": "Claim cost has been maliciously altered in the database."}

@router.get("/verify-claim/{claim_id}")
async def verify_claim(claim_id: str):
    # Get local DB claim
    res = supabase.table("claims").select("*").eq("id", claim_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Claim not found")
    c_data = res.data[0]
    
    # Calculate current local hash
    current_hash = hashlib.sha256(json.dumps(c_data, sort_keys=True).encode()).hexdigest()
    
    # Find ledger reference
    ledger_res = supabase.table("ledger_references").select("*").eq("entity_id", claim_id).execute()
    if not ledger_res.data:
        return {"status": "NO_LEDGER_RECORD", "message": "This claim has not been committed to the blockchain."}
    
    ref = ledger_res.data[0]
    
    # In a real system, we'd query Fabric using the transaction timestamp/id
    # We pass current_hash to our blockchain service to verify
    verification_result = await verify_event_from_ledger(
        vehicle_id=c_data.get("vehicle_id", "UNKNOWN"),
        timestamp=ref.get("created_at"),
        entity_id=claim_id,
        current_hash=current_hash
    )
    
    if verification_result.get("status") == "VERIFIED":
        return {
            "status": "VERIFIED",
            "message": "The local database representation matches the immutable ledger record.",
            "transaction_id": ref["blockchain_tx_id"],
            "hash": current_hash
        }
    else:
        # FAILED
        return {
            "status": "INTEGRITY_VERIFICATION_FAILED",
            "message": "Current database representation does not match the previously committed ledger record.",
            "database_hash": current_hash,
            "ledger_hash": verification_result.get("expected_hash"),
            "transaction_id": ref["blockchain_tx_id"],
            "reason": "Data tampering detected in local PostgreSQL database."
        }
