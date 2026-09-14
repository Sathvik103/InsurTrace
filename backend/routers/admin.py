from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from main import get_current_profile, supabase
from routers.claims import get_canonical_hash
from services.blockchain_service import verify_event_from_ledger

router = APIRouter(prefix="/admin", tags=["Admin/Verification"])

@router.post("/tamper-claim/{claim_id}")
async def tamper_claim(claim_id: str, profile: dict = Depends(get_current_profile)):
    # Explicitly development-only and protected by strict RBAC check
    if profile["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
        
    # maliciously tamper the claim
    supabase.table("claims").update({"estimated_repair_cost": 999999.99}).eq("id", claim_id).execute()
    return {"status": "TAMPERED", "message": "Claim cost has been maliciously altered in the database."}

@router.post("/restore-claim/{claim_id}")
async def restore_claim(claim_id: str, original_cost: float, profile: dict = Depends(get_current_profile)):
    if profile["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
        
    supabase.table("claims").update({"estimated_repair_cost": original_cost}).eq("id", claim_id).execute()
    return {"status": "RESTORED", "message": "Claim restored to original state."}

@router.get("/verify-claim/{claim_id}")
async def verify_claim(claim_id: str):
    # 1. Fetch current local state
    res = supabase.table("claims").select("*").eq("id", claim_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Claim not found")
    c_data = res.data[0]
    
    # 2. Compute canonical hash of current state
    current_hash = get_canonical_hash(c_data)
    
    # 3. Lookup ledger reference
    ledger_res = supabase.table("ledger_references").select("*").eq("entity_id", claim_id).execute()
    if not ledger_res.data:
        return {"status": "NO_LEDGER_RECORD", "message": "This claim has not been committed to the blockchain."}
    
    ref = ledger_res.data[0]
    if ref.get("sync_status") != "COMMITTED":
        return {"status": ref.get("sync_status"), "message": "Record is not fully committed to the ledger yet."}
    
    # 4. Verify against actual blockchain via gateway
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
            "hash": current_hash,
            "original_cost": c_data.get("estimated_repair_cost")
        }
    else:
        return {
            "status": "INTEGRITY_VERIFICATION_FAILED",
            "message": "Current database representation does not match the previously committed ledger record.",
            "database_hash": current_hash,
            "ledger_hash": verification_result.get("expected_hash"),
            "transaction_id": ref["blockchain_tx_id"],
            "reason": "Data tampering detected in local PostgreSQL database."
        }
