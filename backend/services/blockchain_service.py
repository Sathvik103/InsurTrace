import os
import logging
from typing import Dict, Any
from services.fabric_client import FabricClient

logger = logging.getLogger(__name__)
fabric_client = FabricClient()

async def commit_event_to_ledger(vehicle_id: str, event_type: str, entity_id: str, local_hash: str) -> Dict[str, Any]:
    """
    Commits an event to the blockchain.
    Attempts REAL_FABRIC first. If network is down, reports UNAVAILABLE unless explicitly mocked.
    """
    # 1. Attempt Real Fabric Peer Transaction
    if fabric_client.is_network_active():
        result = fabric_client.record_event(vehicle_id, event_type, entity_id, local_hash)
        if result.get("success"):
            return {
                "success": True,
                "network_mode": "REAL_FABRIC",
                "transaction_id": result.get("transaction_id"),
                "timestamp": result.get("timestamp")
            }
        else:
            logger.error(f"Fabric transaction failed: {result.get('error')}")
            return {
                "success": False,
                "network_mode": "REAL_FABRIC",
                "error": result.get("error")
            }

    # 2. Check if Mock Mode is explicitly permitted
    allow_mock = os.environ.get("ALLOW_MOCK_BLOCKCHAIN", "false").lower() == "true"
    if allow_mock:
        import datetime, uuid
        return {
            "success": True,
            "network_mode": "MOCK",
            "transaction_id": f"mock_tx_{uuid.uuid4().hex[:16]}",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "warning": "MOCK transaction: Not submitted to a distributed ledger."
        }

    # 3. Otherwise return UNAVAILABLE - never pretend mock is real
    return {
        "success": False,
        "network_mode": "UNAVAILABLE",
        "error": "Hyperledger Fabric peer network is offline and mock mode is disabled."
    }

async def verify_event_from_ledger(vehicle_id: str, timestamp: str, entity_id: str, current_hash: str) -> Dict[str, Any]:
    """
    Queries the ledger state and verifies cryptographic integrity against current database hash.
    Explicitly tags network_mode as REAL_FABRIC, MOCK, or UNAVAILABLE.
    """
    # 1. Attempt Real Fabric Ledger Query
    if fabric_client.is_network_active():
        res = fabric_client.verify_event(vehicle_id, timestamp, entity_id)
        if not res.get("success"):
            return {
                "status": "NOT_FOUND",
                "network_mode": "REAL_FABRIC",
                "error": res.get("error", "Event not found on Fabric ledger")
            }
        
        ledger_hash = res.get("localDataHash")
        if ledger_hash == current_hash:
            return {
                "status": "VERIFIED",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": res.get("record")
            }
        else:
            return {
                "status": "INTEGRITY_MISMATCH",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": res.get("record")
            }

    # 2. Mock mode check
    allow_mock = os.environ.get("ALLOW_MOCK_BLOCKCHAIN", "false").lower() == "true"
    if allow_mock:
        return {
            "status": "MOCK_VERIFIED",
            "network_mode": "MOCK",
            "expected_hash": current_hash,
            "actual_hash": current_hash,
            "warning": "MOCK verification: Fabric network is offline."
        }

    # 3. Default to UNAVAILABLE
    return {
        "status": "UNAVAILABLE",
        "network_mode": "UNAVAILABLE",
        "error": "Hyperledger Fabric ledger is currently unreachable."
    }
