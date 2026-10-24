import asyncio
import datetime
import time

from fastapi import APIRouter, Response

from config import get_settings
from dependencies import supabase
from services.fabric_adapter import get_fabric_adapter
from services.financial_engine.calculator import calculate_decision
from services.financial_engine.models import ClaimDecisionInput, PolicyInfo, RepairItem, VehicleInfo

router = APIRouter(prefix="/system", tags=["System Status & Integrations"])

FIN_RULE_VERSION = "MOTOR_INDIA_2026_V1"

BADGE = {
    "CONNECTED": "connected",
    "OPERATIONAL": "operational",
    "DEMO_SANDBOX": "data_limited",
    "DEGRADED": "degraded",
    "UNAVAILABLE": "degraded",
    "NOT_CONFIGURED": "not_connected",
}


def _database_status(settings) -> dict:
    if settings.data_mode == "DEMO_SANDBOX":
        return {
            "status": "DEMO_SANDBOX",
            "details": "Running on the in-memory demo sandbox. Records are fictional and reset when the server restarts.",
        }
    try:
        supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "CONNECTED", "details": "Supabase PostgreSQL reachable."}
    except Exception as e:
        return {"status": "UNAVAILABLE", "details": f"Supabase PostgreSQL unreachable ({type(e).__name__})."}


def _financial_status() -> dict:
    try:
        sample = ClaimDecisionInput(
            vehicle=VehicleInfo(age_years=2.0),
            policy=PolicyInfo(idv=500000, deductible=1000, ncb_percentage=20, zero_depreciation_addon=False,
                              policy_start_date=datetime.date.today(), rule_version=FIN_RULE_VERSION),
            repair_items=[RepairItem(category="metal", cost=10000)],
            estimated_base_premium_next_year=12000,
        )
        res = calculate_decision(sample)
        if res and res.estimated_payout > 0:
            return {"status": "OPERATIONAL", "details": "Deterministic rule engine passed its self-check."}
        return {"status": "DEGRADED", "details": "Rule engine self-check returned an unexpected result."}
    except Exception as e:
        return {"status": "UNAVAILABLE", "details": f"Rule engine self-check failed ({type(e).__name__})."}


# The engine is pure and deterministic: one self-check at startup is enough.
_FIN_STATUS = _financial_status()
_cache: dict = {"at": 0.0, "body": None}
STATUS_TTL_SECONDS = 30.0


@router.get("/status")
async def get_system_status(response: Response):
    """Cached for STATUS_TTL_SECONDS so page loads don't each probe every component."""
    now = time.monotonic()
    if _cache["body"] is not None and now - _cache["at"] < STATUS_TTL_SECONDS:
        response.headers["Cache-Control"] = "public, max-age=30"
        return _cache["body"]
    body = await _build_status()
    _cache.update(at=now, body=body)
    response.headers["Cache-Control"] = "public, max-age=30"
    return body


async def _build_status():
    """
    Operational status of ClearClaim components. Distinguishes genuinely connected
    infrastructure from demo, data-limited and not-integrated capabilities.
    """
    settings = get_settings()
    db = _database_status(settings)
    fin = _FIN_STATUS
    fabric = await asyncio.to_thread(get_fabric_adapter().get_peer_health)
    fabric_status = fabric.get("network_status", "UNAVAILABLE")

    if settings.data_mode == "SUPABASE":
        auth = {"status": "CONNECTED", "details": "Supabase Auth sessions validated server-side."}
    else:
        auth = {"status": "DEMO_SANDBOX", "details": "Demo personas only. Real accounts require a connected Supabase project."}

    def comp(name, type_, state, **extra):
        return {"name": name, "type": type_, "status": state["status"],
                "badge_variant": BADGE.get(state["status"], "degraded"), "details": state["details"], **extra}

    return {
        "platform": "ClearClaim",
        "version": "2.1.0",
        "environment": settings.environment,
        "data_mode": settings.data_mode,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "components": {
            "database": comp("Database & Relational Storage", "PostgreSQL (Supabase)", db),
            "authentication": comp("Authentication & Authorization", "Supabase Auth + JWT", auth),
            "financial_engine": comp("Financial Decision Engine", "Deterministic Calculation", fin,
                                     rule_version=FIN_RULE_VERSION),
            "hyperledger_fabric": {
                "name": "Record Integrity Ledger",
                "type": "Hyperledger Fabric (private development network)",
                "status": fabric_status,
                "badge_variant": BADGE.get(fabric_status, "degraded"),
                "mode": fabric.get("mode"),
                "channel": fabric.get("channel"),
                "chaincode": fabric.get("chaincode"),
                "consortium": fabric.get("consortium_type"),
                "peer0_org1": fabric.get("peer0_org1", {}),
                "peer0_org2": fabric.get("peer0_org2", {}),
                "orderer": fabric.get("orderer", {}),
                "details": fabric.get("detail"),
            },
            "ml_intelligence": {
                "name": "Damage Vision & Risk Signal Engine",
                "type": "Machine Learning Model",
                "status": "DATA-LIMITED",
                "badge_variant": "data_limited",
                "details": "Models are not trained on validated data. No fraud or severity scores are produced.",
            },
            "external_vahan": {
                "name": "VAHAN / Parivahan Vehicle Registry",
                "type": "Government External API",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "Requires authorised government API access. Vehicle details are entered by users.",
            },
            "external_insurers": {
                "name": "Insurer Policy & Claim Systems",
                "type": "External Insurer Portals",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "No insurer integrations exist. Claims are not sent to any insurer.",
            },
            "external_workshops": {
                "name": "Workshop Estimating Systems (Audatex/DAT)",
                "type": "External Parts/Repair Estimators",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "Requires commercial workshop network integration.",
            },
        },
    }
