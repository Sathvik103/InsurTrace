"""
Fabric Adapter Boundary

Decouples ClearClaim business logic from how the Hyperledger Fabric network is
reached. Selected by FABRIC_MODE:

- local_wsl : peer CLI against the local test network (WSL2/Docker or native Linux)
- gateway   : authenticated HTTPS calls to the ClearClaim Fabric gateway service
- disabled  : no ledger connectivity configured (reported honestly, never faked)
- auto      : gateway if GATEWAY_URL is set, else local peer CLI if a container
              runtime exists on this host, else disabled
"""

import abc
import logging
import time
from typing import Any, Dict, Optional

import httpx

from config import get_settings
from services.fabric_client import FabricClient, validate_ledger_args

logger = logging.getLogger(__name__)


class FabricAdapter(abc.ABC):
    mode: str = "disabled"

    @abc.abstractmethod
    def is_network_active(self) -> bool: ...

    @abc.abstractmethod
    def get_peer_health(self) -> Dict[str, Any]: ...

    @abc.abstractmethod
    def record_event(self, vehicle_id: str, event_type: str, entity_id: str, local_hash: str,
                     timestamp: Optional[str] = None) -> Dict[str, Any]: ...

    @abc.abstractmethod
    def get_vehicle_history(self, vehicle_id: str) -> Dict[str, Any]: ...

    @abc.abstractmethod
    def verify_event(self, vehicle_id: str, timestamp: str, entity_id: str) -> Dict[str, Any]: ...


def _health(mode: str, status: str, detail: str, **extra: Any) -> Dict[str, Any]:
    s = get_settings()
    return {
        "mode": mode,
        "network_status": status,
        "detail": detail,
        "consortium_type": "PRIVATE_DEV_CONSORTIUM",
        "channel": s.fabric_channel,
        "chaincode": s.fabric_chaincode,
        **extra,
    }


class DisabledFabricAdapter(FabricAdapter):
    mode = "disabled"

    def __init__(self, reason: str = "No ledger connection is configured for this deployment."):
        self.reason = reason

    def _fail(self) -> Dict[str, Any]:
        return {"success": False, "network_mode": "UNAVAILABLE", "error": self.reason}

    def is_network_active(self) -> bool:
        return False

    def get_peer_health(self) -> Dict[str, Any]:
        return _health(self.mode, "NOT_CONFIGURED", self.reason)

    def record_event(self, *args, **kwargs):
        return self._fail()

    def get_vehicle_history(self, vehicle_id: str):
        return self._fail()

    def verify_event(self, vehicle_id: str, timestamp: str, entity_id: str):
        return self._fail()


class LocalWSLFabricAdapter(FabricAdapter):
    """Peer CLI against the local two-org test network."""

    mode = "local_wsl"

    def __init__(self, client: Optional[FabricClient] = None):
        self.client = client or FabricClient()

    def is_network_active(self) -> bool:
        return self.client.is_network_active()

    def get_peer_health(self) -> Dict[str, Any]:
        status = self.client.container_status()
        lines = status.splitlines()

        def up(prefix: str) -> bool:
            return any(line.startswith(prefix) and "Up" in line for line in lines)

        p1, p2, orderer = up("peer0.org1"), up("peer0.org2"), up("orderer")
        overall = "CONNECTED" if (p1 and p2 and orderer) else ("DEGRADED" if (p1 or p2) else "UNAVAILABLE")
        detail = {
            "CONNECTED": "Local two-organisation test network (Raft orderer) is running on this host.",
            "DEGRADED": "Some local Fabric containers are not running.",
            "UNAVAILABLE": "Local Fabric containers are not running on this host.",
        }[overall]
        return _health(
            self.mode, overall, detail,
            peer0_org1={"name": "peer0.org1.example.com", "organization": "Org1MSP",
                        "status": "HEALTHY" if p1 else "UNREACHABLE", "port": 7051},
            peer0_org2={"name": "peer0.org2.example.com", "organization": "Org2MSP",
                        "status": "HEALTHY" if p2 else "UNREACHABLE", "port": 9051},
            orderer={"name": "orderer.example.com", "consensus": "Raft",
                     "status": "HEALTHY" if orderer else "UNREACHABLE", "port": 7050},
        )

    def record_event(self, vehicle_id, event_type, entity_id, local_hash, timestamp=None):
        return self.client.record_event(vehicle_id, event_type, entity_id, local_hash, timestamp=timestamp)

    def get_vehicle_history(self, vehicle_id):
        return self.client.get_vehicle_history(vehicle_id)

    def verify_event(self, vehicle_id, timestamp, entity_id):
        return self.client.verify_event(vehicle_id, timestamp, entity_id)


class GatewayFabricAdapter(FabricAdapter):
    """Authenticated HTTP client for backend/blockchain/gateway (server.js)."""

    mode = "gateway"
    HEALTH_CACHE_SECONDS = 15.0

    def __init__(self, base_url: str, api_key: Optional[str], timeout: float):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._health_cache: Optional[tuple[float, Dict[str, Any]]] = None

    def _request(self, method: str, path: str, timeout: Optional[float] = None, **kwargs) -> Dict[str, Any]:
        headers = {"X-Gateway-Key": self.api_key} if self.api_key else {}
        try:
            resp = httpx.request(method, f"{self.base_url}{path}", headers=headers,
                                 timeout=timeout or self.timeout, **kwargs)
        except httpx.TimeoutException:
            return {"success": False, "network_mode": "UNAVAILABLE", "error": "Ledger gateway timed out."}
        except httpx.HTTPError as e:
            return {"success": False, "network_mode": "UNAVAILABLE", "error": f"Ledger gateway unreachable: {type(e).__name__}"}
        try:
            body = resp.json()
        except ValueError:
            body = {}
        if resp.status_code == 401:
            return {"success": False, "network_mode": "UNAVAILABLE", "error": "Ledger gateway rejected the API key."}
        if resp.status_code >= 400 or not body.get("success", resp.status_code < 300):
            mode = body.get("network_mode", "UNAVAILABLE" if resp.status_code >= 500 else "REAL_FABRIC")
            return {"success": False, "network_mode": mode,
                    "error": str(body.get("error") or f"Gateway returned HTTP {resp.status_code}")[:500]}
        return body

    def _cached_health(self) -> Dict[str, Any]:
        now = time.monotonic()
        if self._health_cache and now - self._health_cache[0] < self.HEALTH_CACHE_SECONDS:
            return self._health_cache[1]
        res = self._request("GET", "/api/health", timeout=get_settings().fabric_probe_timeout_seconds)
        self._health_cache = (now, res)
        return res

    def is_network_active(self) -> bool:
        res = self._cached_health()
        return res.get("network_mode") == "REAL_FABRIC" and res.get("status") == "UP"

    def get_peer_health(self) -> Dict[str, Any]:
        res = self._cached_health()
        if res.get("network_mode") == "REAL_FABRIC" and res.get("status") == "UP":
            return _health(self.mode, "CONNECTED", "Ledger gateway reachable and reports the peer network is up.")
        if res.get("status") == "DEGRADED":
            return _health(self.mode, "DEGRADED", "Ledger gateway reachable but the peer network is down.")
        return _health(self.mode, "UNAVAILABLE", res.get("error", "Ledger gateway unreachable."))

    def record_event(self, vehicle_id, event_type, entity_id, local_hash, timestamp=None):
        args = [vehicle_id, event_type, entity_id, local_hash] + ([timestamp] if timestamp else [])
        validate_ledger_args(*args)
        payload = {"vehicleId": vehicle_id, "eventType": event_type, "entityId": entity_id,
                   "localDataHash": local_hash}
        if timestamp:
            payload["timestamp"] = timestamp
        self._health_cache = None
        return self._request("POST", "/api/commit", json=payload)

    def get_vehicle_history(self, vehicle_id):
        validate_ledger_args(vehicle_id)
        return self._request("GET", f"/api/history/{vehicle_id}")

    def verify_event(self, vehicle_id, timestamp, entity_id):
        validate_ledger_args(vehicle_id, timestamp, entity_id)
        return self._request("GET", "/api/verify",
                             params={"vehicleId": vehicle_id, "timestamp": timestamp, "entityId": entity_id})


_adapter_instance: Optional[FabricAdapter] = None


def build_fabric_adapter() -> FabricAdapter:
    s = get_settings()
    mode = s.fabric_mode
    if mode == "auto":
        if s.gateway_url:
            mode = "gateway"
        elif FabricClient().runtime_available() and not s.is_production:
            mode = "local_wsl"
        else:
            mode = "disabled"

    if mode == "gateway":
        if not s.gateway_url:
            return DisabledFabricAdapter("FABRIC_MODE=gateway but GATEWAY_URL is not set.")
        return GatewayFabricAdapter(s.gateway_url, s.gateway_api_key, s.fabric_timeout_seconds)
    if mode == "local_wsl":
        return LocalWSLFabricAdapter()
    return DisabledFabricAdapter()


def get_fabric_adapter() -> FabricAdapter:
    global _adapter_instance
    if _adapter_instance is None:
        _adapter_instance = build_fabric_adapter()
    return _adapter_instance


def set_fabric_adapter(adapter: Optional[FabricAdapter]) -> None:
    """Test hook: override (or reset with None) the process-wide adapter."""
    global _adapter_instance
    _adapter_instance = adapter
