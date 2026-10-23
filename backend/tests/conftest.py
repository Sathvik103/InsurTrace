import os

import pytest

# Isolated, deterministic test configuration (in-memory demo sandbox, no ledger).
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key-for-unit-testing-purposes-only")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-min-32-chars-long-strictly-for-testing")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

FABRIC_TESTS = os.environ.get("FABRIC_TESTS") == "1"
# Live-ledger tests talk to the local test network; everything else runs with the ledger disabled.
os.environ.setdefault("FABRIC_MODE", "local_wsl" if FABRIC_TESTS else "disabled")


def pytest_collection_modifyitems(config, items):
    if FABRIC_TESTS:
        return
    skip = pytest.mark.skip(reason="Live Hyperledger Fabric test: set FABRIC_TESTS=1 with the local network running")
    for item in items:
        if "fabric" in item.keywords:
            item.add_marker(skip)


@pytest.fixture
def settings(monkeypatch):
    """Mutable view of the cached settings; changes are undone after each test."""
    from config import get_settings

    s = get_settings()
    original = s.model_dump()
    yield s
    for key, value in original.items():
        setattr(s, key, value)


@pytest.fixture
def fabric(monkeypatch):
    """Installs a controllable fake ledger adapter for the duration of a test."""
    from services import fabric_adapter

    class FakeAdapter(fabric_adapter.FabricAdapter):
        mode = "fake"

        def __init__(self):
            self.result = {"success": False, "network_mode": "UNAVAILABLE", "error": "offline"}
            self.calls = []

        def is_network_active(self):
            return self.result.get("success", False)

        def get_peer_health(self):
            return {"mode": "fake", "network_status": "CONNECTED" if self.result.get("success") else "UNAVAILABLE"}

        def record_event(self, vehicle_id, event_type, entity_id, local_hash, timestamp=None):
            self.calls.append((vehicle_id, event_type, entity_id, local_hash, timestamp))
            return dict(self.result, timestamp=timestamp)

        def get_vehicle_history(self, vehicle_id):
            return {"success": False, "network_mode": "UNAVAILABLE"}

        def verify_event(self, vehicle_id, timestamp, entity_id):
            return {"success": False, "network_mode": "UNAVAILABLE"}

    fake = FakeAdapter()
    fabric_adapter.set_fabric_adapter(fake)
    yield fake
    fabric_adapter.set_fabric_adapter(None)
