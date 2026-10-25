import datetime
import hashlib
import json
import uuid
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from dependencies import get_current_profile, supabase
from services.access import accessible_vehicle_ids, claim_vehicle_id, require_claim_access, require_vehicle_access
from services.rate_limit import limiter, sensitive_limit

router = APIRouter(prefix="/claims", tags=["Claims"])

ClaimStatus = Literal["DRAFT", "SUBMITTED", "PENDING_SURVEY", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED"]
CLAIM_CREATOR_ROLES = {"POLICYHOLDER", "FLEET_OPERATOR", "ADMIN"}


class ClaimCreate(BaseModel):
    vehicle_id: Optional[str] = Field(default=None, max_length=100)
    # Accepts either the policy record ID or the printed policy number.
    policy_id: Optional[str] = Field(default=None, max_length=100)
    estimated_repair_cost: float = Field(ge=0, le=100_000_000)
    status: Literal["DRAFT", "SUBMITTED"] = "DRAFT"
    accident_date: Optional[datetime.date] = None
    accident_description: Optional[str] = Field(default=None, max_length=2000)
    # Snapshot of the deterministic financial analysis the user reviewed (optional).
    calculated_payout: Optional[float] = Field(default=None, ge=0)
    immediate_out_of_pocket: Optional[float] = Field(default=None, ge=0)
    future_ncb_impact: Optional[float] = None
    recommendation: Optional[Literal["CLAIM", "SELF-PAY", "BORDERLINE"]] = None
    calculation_rule_version: Optional[str] = Field(default=None, max_length=50)


def get_canonical_hash(data: dict) -> str:
    """
    Cryptographically stable SHA-256 of a record: sorted keys, no whitespace,
    mutable timestamps excluded, so the same record always hashes identically.
    """
    hash_data = {k: v for k, v in data.items() if k not in ["created_at", "updated_at"]}
    canonical_str = json.dumps(hash_data, separators=(",", ":"), sort_keys=True, default=str)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def _resolve_policy(policy_ref: Optional[str], vehicle_id: Optional[str]) -> Optional[dict]:
    if policy_ref:
        for column in ("id", "policy_number"):
            rows = supabase.table("policies").select("*").eq(column, policy_ref).execute().data
            if rows:
                return rows[0]
        return None
    if vehicle_id:
        rows = supabase.table("policies").select("*").eq("vehicle_id", vehicle_id).execute().data
        return rows[0] if rows else None
    return None


def _ledger_row(claim_id: str) -> Optional[dict]:
    rows = supabase.table("ledger_references").select("*").eq("entity_id", claim_id).execute().data
    return rows[0] if rows else None


async def _anchor(ledger_row: dict, vehicle_id: str) -> dict:
    """Attempts the Fabric commit for an existing ledger reference and persists the outcome."""
    from services.blockchain_service import commit_event_to_ledger

    result = await commit_event_to_ledger(
        vehicle_id=vehicle_id,
        event_type=ledger_row["event_type"],
        entity_id=ledger_row["entity_id"],
        local_hash=ledger_row["local_data_hash"],
        timestamp=ledger_row.get("created_at"),
    )
    if result.get("success"):
        update = {"sync_status": "COMMITTED", "blockchain_tx_id": result.get("transaction_id"),
                  "network_mode": result.get("network_mode"), "last_error": None}
    else:
        # PENDING: ledger not reachable (safe to retry later). FAILED: the ledger rejected it.
        status = "PENDING" if result.get("network_mode") == "UNAVAILABLE" else "FAILED"
        update = {"sync_status": status, "network_mode": result.get("network_mode"),
                  "last_error": str(result.get("error", ""))[:500]}
    update["last_attempt_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    supabase.table("ledger_references").update(update).eq("id", ledger_row["id"]).execute()
    return {**ledger_row, **update}


def _ledger_view(row: Optional[dict]) -> dict:
    if not row:
        return {"sync_status": "NOT_COMMITTED", "blockchain_tx_id": None, "network_mode": None}
    return {
        "sync_status": row.get("sync_status"),
        "blockchain_tx_id": row.get("blockchain_tx_id"),
        "network_mode": row.get("network_mode"),
        "canonical_hash": row.get("local_data_hash"),
        "last_error": row.get("last_error"),
        "last_attempt_at": row.get("last_attempt_at"),
        "anchored_at": row.get("created_at"),
    }


@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def list_claims(profile: dict = Depends(get_current_profile)):
    """Claims the caller may read, with ledger status. Constant number of queries."""
    allowed = accessible_vehicle_ids(profile)
    if allowed is None:
        rows = supabase.table("claims").select("*").limit(500).execute().data or []
    elif not allowed:
        return []
    else:
        rows = supabase.table("claims").select("*").in_("vehicle_id", list(allowed)).execute().data or []
    if not rows:
        return []
    ledger_rows = supabase.table("ledger_references").select("*").in_("entity_id", [c["id"] for c in rows]).execute().data or []
    ledger_by_claim = {r["entity_id"]: r for r in ledger_rows}
    claims = [{**c, "ledger": _ledger_view(ledger_by_claim.get(c["id"]))} for c in rows]
    claims.sort(key=lambda c: str(c.get("created_at", "")), reverse=True)
    return claims


@router.post("")
@router.post("/")
async def create_claim(claim: ClaimCreate, profile: dict = Depends(get_current_profile)):
    if profile.get("role") not in CLAIM_CREATOR_ROLES:
        raise HTTPException(status_code=403, detail="Your role cannot file claims.")

    policy = _resolve_policy(claim.policy_id, claim.vehicle_id)
    vehicle_id = (policy or {}).get("vehicle_id") or claim.vehicle_id
    if not vehicle_id:
        raise HTTPException(status_code=422, detail="Provide a vehicle_id or a policy linked to a vehicle.")
    if claim.vehicle_id and policy and policy.get("vehicle_id") and policy["vehicle_id"] != claim.vehicle_id:
        raise HTTPException(status_code=422, detail="The selected policy does not belong to this vehicle.")
    require_vehicle_access(profile, vehicle_id)

    accident_id = None
    if claim.accident_date or claim.accident_description:
        accident = supabase.table("accidents").insert({
            "vehicle_id": vehicle_id,
            "accident_date": (claim.accident_date or datetime.date.today()).isoformat(),
            "description": claim.accident_description,
        }).execute().data[0]
        accident_id = accident["id"]

    now = datetime.datetime.now(datetime.timezone.utc)
    record = {
        "claim_number": f"VS-{now:%Y%m%d}-{uuid.uuid4().hex[:6].upper()}",
        "policy_id": (policy or {}).get("id"),
        "vehicle_id": vehicle_id,
        "accident_id": accident_id,
        "status": claim.status,
        "estimated_repair_cost": claim.estimated_repair_cost,
        "repair_cost_source": "USER_INPUT",
        "calculated_payout": claim.calculated_payout,
        "immediate_out_of_pocket": claim.immediate_out_of_pocket,
        "future_ncb_impact": claim.future_ncb_impact,
        "recommendation": claim.recommendation,
        "calculation_rule_version": claim.calculation_rule_version,
        "payout_source": "COMPUTED_RULE" if claim.calculated_payout is not None else None,
        "created_by": profile["id"],
        "created_at": now.isoformat(),
    }
    c_data = supabase.table("claims").insert(record).execute().data[0]

    # The claim is now saved. Anchoring its fingerprint on the ledger is a
    # separate, retryable step whose outcome never undoes the save.
    ledger = supabase.table("ledger_references").insert({
        "event_type": "CLAIM_CREATED",
        "entity_id": c_data["id"],
        "entity_table": "claims",
        "local_data_hash": get_canonical_hash(c_data),
        "sync_status": "PENDING",
        "org_id": profile.get("organization_id"),
        "created_at": c_data.get("created_at"),
    }).execute().data[0]
    ledger = await _anchor(ledger, vehicle_id)

    return {
        **c_data,
        "saved": True,
        "ledger": _ledger_view(ledger),
        # Flat fields kept for existing clients.
        "sync_status": ledger["sync_status"],
        "blockchain_tx_id": ledger.get("blockchain_tx_id"),
        "network_mode": ledger.get("network_mode"),
        "canonical_hash": ledger["local_data_hash"],
    }


@router.post("/{claim_id}/ledger/retry")
@limiter.limit(sensitive_limit)
async def retry_ledger_commit(request: Request, claim_id: str, profile: dict = Depends(get_current_profile)):
    """
    Idempotent: a COMMITTED record is returned unchanged. Otherwise the original
    fingerprint is re-submitted, but only if the claim still matches it; a
    record changed since it was saved is never anchored under the old reference.
    """
    rows = supabase.table("claims").select("*").eq("id", claim_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Claim not found.")
    claim = rows[0]
    vehicle_id = require_claim_access(profile, claim)

    ledger = _ledger_row(claim_id)
    if not ledger:
        raise HTTPException(status_code=404, detail="This claim has no ledger reference.")
    if ledger.get("sync_status") == "COMMITTED":
        return {"claim_id": claim_id, "ledger": _ledger_view(ledger), "changed": False}
    if get_canonical_hash(claim) != ledger["local_data_hash"]:
        raise HTTPException(
            status_code=409,
            detail="The claim has changed since it was saved, so its original fingerprint cannot be anchored.",
        )
    ledger = await _anchor(ledger, vehicle_id)
    return {"claim_id": claim_id, "ledger": _ledger_view(ledger), "changed": True}


@router.get("/{claim_id}")
async def get_claim_details(claim_id: str, profile: dict = Depends(get_current_profile)):
    """Claim dossier: claim, policy, vehicle, ledger status, documents and ML availability."""
    rows = supabase.table("claims").select("*").eq("id", claim_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Claim not found.")
    claim_data = rows[0]
    vehicle_id = require_claim_access(profile, claim_data)

    policy_data = {}
    if claim_data.get("policy_id"):
        p_rows = supabase.table("policies").select("*").eq("id", claim_data["policy_id"]).execute().data
        policy_data = p_rows[0] if p_rows else {}

    v_rows = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute().data
    vehicle_data = v_rows[0] if v_rows else {}

    documents = supabase.table("documents").select("*").eq("entity_id", claim_id).execute().data or []

    ledger = _ledger_view(_ledger_row(claim_id))
    ledger["current_hash"] = get_canonical_hash(claim_data)

    return {
        "claim": claim_data,
        "policy": policy_data,
        "vehicle": vehicle_data,
        "ledger": ledger,
        "documents": documents,
        "ml_intelligence_disclosure": {
            "status": "DATA_LIMITED",
            "reason": "ClearClaim does not have access to a validated, licensed claims dataset, so fraud and severity models are not trained. No ML scores are produced.",
            "integrity_commitment": "Financial figures come from deterministic rules; no synthetic fraud probabilities are presented.",
            "available_features": ["Deterministic depreciation & payout rules", "Rules-based PDF extraction"],
        },
    }
