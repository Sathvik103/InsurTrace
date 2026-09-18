import os
import logging
import urllib.request
import json
from typing import Dict, Any, Optional
from services.fabric_client import FabricClient

logger = logging.getLogger(__name__)
fabric_client = FabricClient()

GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://localhost:3001")
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development").lower() == "production"

def query_node_gateway(endpoint: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Attempts to communicate with the Node.js Fabric REST Gateway."""
    url = f"{GATEWAY_URL}{endpoint}"
    try:
        req_data = json.dumps(payload).encode('utf-8') if payload else None
        req = urllib.request.Request(
            url, 
            data=req_data,
            headers={"Content-Type": "application/json"} if req_data else {},
            method=method
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status in [200, 201]:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        logger.debug(f"Node Fabric Gateway not reachable at {url}: {e}")
    return None

async def commit_event_to_ledger(vehicle_id: str, event_type: str, entity_id: str, local_hash: str, timestamp: Optional[str] = None) -> Dict[str, Any]:
    """
    Commits an event to the blockchain.
    1. Attempts Node REST Gateway.
    2. Falls back to direct FabricClient CLI on WSL/Linux.
    3. If production, strictly forbids mock. If dev and ALLOW_MOCK_BLOCKCHAIN=true, returns MOCK.
    """
    # 1. Attempt Node.js Fabric REST Gateway
    gateway_payload = {
        "vehicleId": vehicle_id,
        "eventType": event_type,
        "entityId": entity_id,
        "localDataHash": local_hash
    }
    if timestamp:
        gateway_payload["timestamp"] = timestamp

    gateway_res = query_node_gateway("/api/commit", method="POST", payload=gateway_payload)
    if gateway_res and gateway_res.get("success"):
        return {
            "success": True,
            "network_mode": "REAL_FABRIC",
            "transaction_id": gateway_res.get("transaction_id"),
            "timestamp": gateway_res.get("timestamp"),
            "source": "NODE_GATEWAY"
        }

    # 2. Attempt Direct Fabric Peer Transaction via FabricClient
    if fabric_client.is_network_active():
        result = fabric_client.record_event(vehicle_id, event_type, entity_id, local_hash, timestamp=timestamp)
        if result.get("success"):
            return {
                "success": True,
                "network_mode": "REAL_FABRIC",
                "transaction_id": result.get("transaction_id"),
                "timestamp": result.get("timestamp"),
                "source": "DIRECT_PEER"
            }
        else:
            logger.error(f"Fabric transaction failed: {result.get('error')}")
            return {
                "success": False,
                "network_mode": "REAL_FABRIC",
                "error": result.get("error")
            }

    # 3. Production check: Mock mode is strictly prohibited in production
    if IS_PRODUCTION:
        return {
            "success": False,
            "network_mode": "UNAVAILABLE",
            "error": "CRITICAL: Hyperledger Fabric peer network is unreachable in PRODUCTION environment. Mocking strictly forbidden."
        }

    # 4. Check if Mock Mode is explicitly permitted in development/testing
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

    # 5. Otherwise return UNAVAILABLE
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
    # 1. Attempt Node.js Fabric REST Gateway
    import urllib.parse
    query_params = urllib.parse.urlencode({
        "vehicleId": vehicle_id,
        "timestamp": timestamp or "",
        "entityId": entity_id
    })
    gateway_res = query_node_gateway(f"/api/verify?{query_params}", method="GET")
    if gateway_res and gateway_res.get("success"):
        ledger_hash = gateway_res.get("localDataHash")
        if ledger_hash == current_hash:
            return {
                "status": "VERIFIED",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": gateway_res.get("record"),
                "source": "NODE_GATEWAY"
            }
        else:
            return {
                "status": "INTEGRITY_MISMATCH",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": gateway_res.get("record"),
                "source": "NODE_GATEWAY"
            }

    # 2. Attempt Direct Fabric Ledger Query via FabricClient
    if fabric_client.is_network_active():
        res = fabric_client.verify_event(vehicle_id, timestamp, entity_id)
        if not res.get("success"):
            return {
                "status": "NOT_FOUND",
                "network_mode": "REAL_FABRIC",
                "error": res.get("error", "Event not found on Fabric ledger"),
                "source": "DIRECT_PEER"
            }
        
        ledger_hash = res.get("localDataHash")
        if ledger_hash == current_hash:
            return {
                "status": "VERIFIED",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": res.get("record"),
                "source": "DIRECT_PEER"
            }
        else:
            return {
                "status": "INTEGRITY_MISMATCH",
                "network_mode": "REAL_FABRIC",
                "expected_hash": ledger_hash,
                "actual_hash": current_hash,
                "ledger_record": res.get("record"),
                "source": "DIRECT_PEER"
            }

    # 3. Production check
    if IS_PRODUCTION:
        return {
            "status": "UNAVAILABLE",
            "network_mode": "UNAVAILABLE",
            "error": "CRITICAL: Hyperledger Fabric peer network is unreachable in PRODUCTION environment."
        }

    # 4. Mock mode check for development
    allow_mock = os.environ.get("ALLOW_MOCK_BLOCKCHAIN", "false").lower() == "true"
    if allow_mock:
        return {
            "status": "MOCK_VERIFIED",
            "network_mode": "MOCK",
            "expected_hash": current_hash,
            "actual_hash": current_hash,
            "warning": "MOCK verification: Fabric network is offline."
        }

    # 5. Default to UNAVAILABLE
    return {
        "status": "UNAVAILABLE",
        "network_mode": "UNAVAILABLE",
        "error": "Hyperledger Fabric ledger is currently unreachable."
    }
