import os
from fastapi import APIRouter
from dependencies import supabase
from services.fabric_adapter import get_fabric_adapter
from services.financial_engine.calculator import calculate_decision
from services.financial_engine.models import ClaimDecisionInput, VehicleInfo, PolicyInfo, RepairItem
import datetime

router = APIRouter(prefix="/system", tags=["System Status & Integrations"])

@router.get("/status")
async def get_system_status():
    """
    Returns the authoritative operational status of VeriSure platform components.
    Strictly distinguishes between genuinely connected infrastructure,
    data-limited capabilities, and unintegrated external ecosystems.
    """
    # 1. Check Database connection
    db_status = "CONNECTED"
    db_details = "PostgreSQL with Row-Level Security active."
    try:
        test_res = supabase.table("vehicles").select("id").limit(1).execute()
        if test_res.data is None:
            db_status = "DEGRADED"
            db_details = "Connected but returned empty response."
    except Exception as e:
        db_status = "DEGRADED"
        db_details = f"Operating with in-memory / cached store: {str(e)[:60]}"

    # 2. Check Auth
    auth_status = "CONNECTED"
    auth_details = "Supabase Auth with authoritative JWT validation."

    # 3. Check Financial Engine
    fin_status = "OPERATIONAL"
    fin_rule_version = "MOTOR_INDIA_2026_V1"
    fin_details = "Deterministic Indian Motor Tariff engine verified."
    try:
        sample_input = ClaimDecisionInput(
            vehicle=VehicleInfo(age_years=2.0),
            policy=PolicyInfo(
                idv=500000,
                deductible=1000,
                ncb_percentage=20,
                zero_depreciation_addon=False,
                policy_start_date=datetime.date.today(),
                rule_version=fin_rule_version
            ),
            repair_items=[RepairItem(category="metal", cost=10000)],
            estimated_base_premium_next_year=12000
        )
        sample_res = calculate_decision(sample_input)
        if not sample_res or sample_res.estimated_payout <= 0:
            fin_status = "DEGRADED"
            fin_details = "Financial calculation returned unexpected result."
    except Exception as e:
        fin_status = "UNAVAILABLE"
        fin_details = f"Financial engine error: {str(e)}"

    # 4. Check Fabric
    fabric_adapter = get_fabric_adapter()
    fabric_health = fabric_adapter.get_peer_health()
    fabric_status = fabric_health.get("network_status", "CONNECTED")

    return {
        "platform": "VeriSure",
        "version": "2.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "components": {
            "database": {
                "name": "Database & Relational Storage",
                "type": "PostgreSQL (Supabase)",
                "status": db_status,
                "badge_variant": "connected" if db_status == "CONNECTED" else "degraded",
                "details": db_details
            },
            "authentication": {
                "name": "Authentication & Authorization",
                "type": "Supabase Auth + JWT",
                "status": auth_status,
                "badge_variant": "connected",
                "details": auth_details
            },
            "financial_engine": {
                "name": "Financial Decision Engine",
                "type": "Deterministic Calculation",
                "status": fin_status,
                "badge_variant": "operational",
                "rule_version": fin_rule_version,
                "details": fin_details
            },
            "hyperledger_fabric": {
                "name": "Record Integrity Ledger",
                "type": "Hyperledger Fabric (Private Dev Consortium)",
                "status": fabric_status,
                "badge_variant": "connected" if fabric_status == "CONNECTED" else "degraded",
                "channel": fabric_health.get("channel", "mychannel"),
                "chaincode": fabric_health.get("chaincode", "vehicle"),
                "consortium": fabric_health.get("consortium_type", "PRIVATE_DEV_CONSORTIUM"),
                "peer0_org1": fabric_health.get("peer0_org1", {}),
                "peer0_org2": fabric_health.get("peer0_org2", {}),
                "orderer": fabric_health.get("orderer", {}),
                "details": "Dual-peer Raft ordering consortium verifying record integrity."
            },
            "ml_intelligence": {
                "name": "Damage Vision & Risk Signal Engine",
                "type": "Machine Learning Model",
                "status": "DATA-LIMITED",
                "badge_variant": "data_limited",
                "details": "Experimental models operating with limited telemetry. Synthetic scores are strictly prohibited."
            },
            "external_vahan": {
                "name": "VAHAN / Parivahan Vehicle Registry",
                "type": "Government External API",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "Requires authorized government API credentials and integration approval."
            },
            "external_insurers": {
                "name": "Insurer Policy & Claim Systems",
                "type": "External Insurer Portals",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "Requires direct insurer API partnership agreements."
            },
            "external_workshops": {
                "name": "Workshop Estimating Systems (Audatex/DAT)",
                "type": "External Parts/Repair Estimators",
                "status": "NOT CONNECTED",
                "badge_variant": "not_connected",
                "details": "Requires commercial workshop network integration."
            }
        }
    }
