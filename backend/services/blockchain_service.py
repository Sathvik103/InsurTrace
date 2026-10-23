"""
Ledger service: commits and verifies record fingerprints through the configured
Fabric adapter. Every result is tagged with network_mode REAL_FABRIC, MOCK or
UNAVAILABLE. MOCK is only possible outside production with ALLOW_MOCK_BLOCKCHAIN=true.
"""

import asyncio
import datetime
import logging
import uuid
from typing import Any, Dict, Optional

from config import get_settings
from services.fabric_adapter import get_fabric_adapter
from services.fabric_client import LedgerArgumentError

logger = logging.getLogger(__name__)


def _mock_allowed() -> bool:
    s = get_settings()
    return s.allow_mock_blockchain and not s.is_production


async def commit_event_to_ledger(vehicle_id: str, event_type: str, entity_id: str, local_hash: str,
                                 timestamp: Optional[str] = None) -> Dict[str, Any]:
    adapter = get_fabric_adapter()
    try:
        result = await asyncio.to_thread(
            adapter.record_event, vehicle_id, event_type, entity_id, local_hash, timestamp
        )
    except LedgerArgumentError as e:
        return {"success": False, "network_mode": "UNAVAILABLE", "error": str(e)}

    if result.get("success"):
        return {
            "success": True,
            "network_mode": "REAL_FABRIC",
            "transaction_id": result.get("transaction_id"),
            "timestamp": result.get("timestamp", timestamp),
            "source": adapter.mode,
        }

    if result.get("network_mode") == "UNAVAILABLE" and _mock_allowed():
        return {
            "success": True,
            "network_mode": "MOCK",
            "transaction_id": f"mock_tx_{uuid.uuid4().hex[:16]}",
            "timestamp": timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "warning": "MOCK transaction: not submitted to a distributed ledger.",
        }

    logger.warning("Ledger commit not completed (%s): %s", result.get("network_mode"), result.get("error"))
    return {
        "success": False,
        "network_mode": result.get("network_mode", "UNAVAILABLE"),
        "error": result.get("error", "Ledger commit failed."),
        "source": adapter.mode,
    }


async def verify_event_from_ledger(vehicle_id: str, timestamp: str, entity_id: str, current_hash: str) -> Dict[str, Any]:
    adapter = get_fabric_adapter()
    try:
        res = await asyncio.to_thread(adapter.verify_event, vehicle_id, timestamp or "", entity_id)
    except LedgerArgumentError as e:
        return {"status": "UNAVAILABLE", "network_mode": "UNAVAILABLE", "error": str(e)}

    if res.get("success"):
        ledger_hash = res.get("localDataHash")
        return {
            "status": "VERIFIED" if ledger_hash == current_hash else "INTEGRITY_MISMATCH",
            "network_mode": "REAL_FABRIC",
            "expected_hash": ledger_hash,
            "actual_hash": current_hash,
            "ledger_record": res.get("record"),
            "source": adapter.mode,
        }

    if res.get("network_mode") == "REAL_FABRIC":
        return {"status": "NOT_FOUND", "network_mode": "REAL_FABRIC",
                "error": res.get("error", "Event not found on Fabric ledger"), "source": adapter.mode}

    if _mock_allowed():
        return {"status": "MOCK_VERIFIED", "network_mode": "MOCK", "expected_hash": current_hash,
                "actual_hash": current_hash, "warning": "MOCK verification: Fabric network is offline."}

    return {"status": "UNAVAILABLE", "network_mode": "UNAVAILABLE",
            "error": res.get("error", "Hyperledger Fabric ledger is currently unreachable."), "source": adapter.mode}
