from fastapi import APIRouter, Depends, HTTPException

from config import get_settings
from dependencies import get_current_profile, supabase
from routers.claims import get_canonical_hash
from services.access import require_claim_access
from services.blockchain_service import verify_event_from_ledger

router = APIRouter(prefix="/admin", tags=["Admin/Verification"])


def _require_tamper_demo(profile: dict) -> None:
    """The tamper/restore demonstration exists only for local development."""
    if get_settings().is_production:
        raise HTTPException(status_code=403, detail="Tamper simulation is strictly disabled in production.")
    if profile["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")


@router.post("/tamper-claim/{claim_id}")
async def tamper_claim(claim_id: str, profile: dict = Depends(get_current_profile)):
    _require_tamper_demo(profile)
    supabase.table("claims").update({"estimated_repair_cost": 999999.99}).eq("id", claim_id).execute()
    return {"status": "TAMPERED", "message": "Claim cost has been altered in the database to demonstrate tamper detection."}


@router.post("/restore-claim/{claim_id}")
async def restore_claim(claim_id: str, original_cost: float, profile: dict = Depends(get_current_profile)):
    _require_tamper_demo(profile)
    supabase.table("claims").update({"estimated_repair_cost": original_cost}).eq("id", claim_id).execute()
    return {"status": "RESTORED", "message": "Claim restored to original state."}


@router.get("/verify-claim/{claim_id}")
async def verify_claim(claim_id: str, profile: dict = Depends(get_current_profile)):
    """Recomputes the claim's fingerprint and compares it with the Fabric ledger record."""
    rows = supabase.table("claims").select("*").eq("id", claim_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Claim not found")
    c_data = rows[0]
    vehicle_id = require_claim_access(profile, c_data)
    current_hash = get_canonical_hash(c_data)

    ledger_rows = supabase.table("ledger_references").select("*").eq("entity_id", claim_id).execute().data
    if not ledger_rows:
        return {"status": "NO_LEDGER_RECORD", "message": "This claim has not been submitted to the ledger."}
    ref = ledger_rows[0]
    if ref.get("sync_status") != "COMMITTED":
        return {
            "status": ref.get("sync_status"),
            "message": "This record is saved but its fingerprint is not anchored on the ledger yet.",
            "hash": current_hash,
        }

    result = await verify_event_from_ledger(
        vehicle_id=vehicle_id, timestamp=ref.get("created_at"), entity_id=claim_id, current_hash=current_hash
    )
    network_mode = result.get("network_mode", "UNKNOWN")
    status = result.get("status")

    if status in ("VERIFIED", "MOCK_VERIFIED"):
        return {
            "status": status,
            "network_mode": network_mode,
            "message": "The current database record matches the fingerprint anchored on the ledger.",
            "transaction_id": ref["blockchain_tx_id"],
            "hash": current_hash,
            "database_hash": current_hash,
            "ledger_hash": result.get("expected_hash"),
            "original_cost": c_data.get("estimated_repair_cost"),
        }
    if status == "INTEGRITY_MISMATCH":
        return {
            "status": "INTEGRITY_VERIFICATION_FAILED",
            "network_mode": network_mode,
            "message": "The current database record does not match the fingerprint anchored on the ledger.",
            "database_hash": current_hash,
            "ledger_hash": result.get("expected_hash"),
            "transaction_id": ref["blockchain_tx_id"],
            "reason": "The record was modified after it was anchored.",
        }
    # Ledger unreachable or record not found: never reported as a tamper finding.
    return {
        "status": "LEDGER_UNAVAILABLE" if status == "UNAVAILABLE" else status,
        "network_mode": network_mode,
        "message": "The ledger could not be queried, so integrity cannot be confirmed right now.",
        "transaction_id": ref.get("blockchain_tx_id"),
        "hash": current_hash,
        "error": result.get("error"),
    }
