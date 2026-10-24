"""
Milestone 1 coverage: claim persistence independent of ledger availability,
idempotent ledger retry, record-level access control, authentication hardening,
upload validation, the gateway adapter, and error/CORS behaviour.
"""

import uuid

import httpx
import jwt
import pytest
from fastapi.testclient import TestClient

from database.mock_store import mock_db
from main import app

client = TestClient(app, raise_server_exceptions=False)
PH = {"Authorization": "Bearer dev-policyholder"}
GARAGE = {"Authorization": "Bearer dev-garage"}
ADMIN = {"Authorization": "Bearer dev-admin"}
COMMITTED_TX = "a" * 64


def _new_policyholder() -> dict:
    """A second policyholder with no vehicles, authenticated by raw profile UUID (dev only)."""
    pid = str(uuid.uuid4())
    mock_db.tables["profiles"].append({
        "id": pid, "role": "POLICYHOLDER", "organization_id": None,
        "email": f"{pid[:8]}@example.test", "full_name": "Other Owner",
    })
    return {"Authorization": f"Bearer {pid}"}


def _create_claim(**overrides):
    body = {"vehicle_id": "V-REAL-101", "estimated_repair_cost": 42500, "status": "SUBMITTED", **overrides}
    return client.post("/api/v1/claims", json=body, headers=PH)


# --------------------------------------------------------------------------- ledger states
def test_claim_is_saved_when_ledger_unavailable(fabric):
    res = _create_claim()
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["saved"] is True
    assert body["claim_number"].startswith("VS-")
    assert body["ledger"]["sync_status"] == "PENDING"
    assert body["network_mode"] == "UNAVAILABLE"
    assert body["blockchain_tx_id"] is None
    assert client.get(f"/api/v1/claims/{body['id']}", headers=PH).status_code == 200


def test_ledger_rejection_is_failed_not_pending(fabric):
    fabric.result = {"success": False, "network_mode": "REAL_FABRIC", "error": "endorsement failure"}
    body = _create_claim().json()
    assert body["ledger"]["sync_status"] == "FAILED"
    assert "endorsement" in body["ledger"]["last_error"]


def test_committed_claim_returns_transaction(fabric):
    fabric.result = {"success": True, "network_mode": "REAL_FABRIC", "transaction_id": COMMITTED_TX}
    body = _create_claim().json()
    assert body["sync_status"] == "COMMITTED"
    assert body["blockchain_tx_id"] == COMMITTED_TX
    vehicle_id, event_type, entity_id, local_hash, _ = fabric.calls[0]
    assert (vehicle_id, event_type, entity_id) == ("V-REAL-101", "CLAIM_CREATED", body["id"])
    assert local_hash == body["canonical_hash"]


def test_retry_is_idempotent(fabric):
    claim_id = _create_claim().json()["id"]
    fabric.result = {"success": True, "network_mode": "REAL_FABRIC", "transaction_id": COMMITTED_TX}

    first = client.post(f"/api/v1/claims/{claim_id}/ledger/retry", headers=PH).json()
    assert first["changed"] is True and first["ledger"]["sync_status"] == "COMMITTED"

    second = client.post(f"/api/v1/claims/{claim_id}/ledger/retry", headers=PH).json()
    assert second["changed"] is False and second["ledger"]["blockchain_tx_id"] == COMMITTED_TX
    assert len(fabric.calls) == 2  # initial attempt + one successful retry, not three


def test_retry_refuses_modified_record(fabric):
    claim_id = _create_claim().json()["id"]
    client.post(f"/api/v1/admin/tamper-claim/{claim_id}", headers=ADMIN)
    res = client.post(f"/api/v1/claims/{claim_id}/ledger/retry", headers=PH)
    assert res.status_code == 409


def test_verify_reports_ledger_unavailable_not_tampering(fabric):
    fabric.result = {"success": True, "network_mode": "REAL_FABRIC", "transaction_id": COMMITTED_TX}
    claim_id = _create_claim().json()["id"]
    # verify_event on the fake adapter reports the ledger as unreachable
    body = client.get(f"/api/v1/admin/verify-claim/{claim_id}", headers=PH).json()
    assert body["status"] == "LEDGER_UNAVAILABLE"


def test_claim_validation():
    assert _create_claim(estimated_repair_cost=-5).status_code == 422
    assert _create_claim(vehicle_id="V-REAL-101", policy_id="POL-REAL-102").status_code == 422
    assert client.post("/api/v1/claims", json={"estimated_repair_cost": 100}, headers=PH).status_code == 422


def test_claim_accepts_policy_number(fabric):
    res = client.post("/api/v1/claims", headers=PH, json={
        "policy_id": "2311/2004/99812/00/000", "estimated_repair_cost": 1000,
    })
    assert res.status_code == 200 and res.json()["policy_id"] == "POL-REAL-101"


# --------------------------------------------------------------------------- isolation
def test_other_policyholder_cannot_read_or_file_for_vehicle(fabric):
    other = _new_policyholder()
    assert client.get("/api/v1/vehicles", headers=other).json() == []
    assert client.get("/api/v1/vehicles/V-REAL-101", headers=other).status_code == 404
    assert client.get("/api/v1/vehicles/V-REAL-101/timeline", headers=other).status_code == 404
    assert client.get("/api/v1/claims/CLM-999", headers=other).status_code == 404
    assert client.get("/api/v1/admin/verify-claim/CLM-999", headers=other).status_code == 404
    assert client.post("/api/v1/claims", headers=other, json={
        "vehicle_id": "V-REAL-101", "estimated_repair_cost": 10}).status_code in (403, 404)
    assert all(c["id"] != "CLM-999" for c in client.get("/api/v1/claims", headers=other).json())


def test_garage_sees_only_consented_vehicles():
    ids = {v["id"] for v in client.get("/api/v1/vehicles", headers=GARAGE).json()}
    assert ids == {"V-REAL-101"}  # CON-001 grants the garage access to this vehicle only
    assert client.get("/api/v1/vehicles/V-REAL-103", headers=GARAGE).status_code == 404


def test_profile_directory_is_admin_only():
    assert client.get("/api/v1/profiles/users", headers=PH).status_code == 403
    assert client.get("/api/v1/profiles/users", headers=ADMIN).status_code == 200


def test_consent_requires_vehicle_ownership():
    other = _new_policyholder()
    res = client.post("/api/v1/consents", headers=other, json={
        "vehicle_id": "V-REAL-101", "requesting_org_id": "00000000-0000-0000-0000-000000000003"})
    assert res.status_code == 404


# --------------------------------------------------------------------------- authentication
def test_forged_and_valid_jwt(settings):
    forged = jwt.encode({"sub": "22222222-2222-2222-2222-222222222222"}, "x" * 40, algorithm="HS256")
    assert client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401

    good = jwt.encode({"sub": "22222222-2222-2222-2222-222222222222", "aud": "authenticated"},
                      settings.supabase_jwt_secret, algorithm="HS256")
    res = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {good}"})
    assert res.status_code == 200 and res.json()["role"] == "POLICYHOLDER"


def test_no_jwt_secret_means_no_local_validation(settings):
    token = jwt.encode({"sub": "22222222-2222-2222-2222-222222222222"},
                       "dev-jwt-secret-min-32-chars-long-strictly-for-testing", algorithm="HS256")
    settings.supabase_jwt_secret = None
    assert client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_demo_auth_policy(settings):
    settings.environment = "production"
    settings.supabase_url = "https://test.supabase.co"  # demo sandbox: personas allowed, data is fictional
    assert settings.demo_auth_active is True
    settings.supabase_url = "https://real.supabase.co"
    assert settings.demo_auth_active is False


def test_production_config_fails_closed(settings):
    settings.environment = "production"
    settings.allowed_origins = "*"
    with pytest.raises(RuntimeError, match="ALLOWED_ORIGINS"):
        settings.validate_for_startup()
    settings.allowed_origins = "https://insur-trace.vercel.app"
    settings.allow_mock_blockchain = True
    with pytest.raises(RuntimeError, match="ALLOW_MOCK_BLOCKCHAIN"):
        settings.validate_for_startup()
    settings.allow_mock_blockchain = False
    settings.validate_for_startup()


# --------------------------------------------------------------------------- uploads
def test_upload_rejects_non_pdf_and_oversize(settings):
    files = {"file": ("x.pdf", b"MZ\x90\x00 not a pdf", "application/pdf")}
    res = client.post("/api/v1/documents/extract", headers=PH, files=files, data={"document_type": "POLICY"})
    assert res.status_code == 415

    settings.max_upload_bytes = 1024
    big = {"file": ("big.pdf", b"%PDF-" + b"0" * 2048, "application/pdf")}
    res = client.post("/api/v1/documents/extract", headers=PH, files=big, data={"document_type": "POLICY"})
    assert res.status_code == 413


def test_upload_rejects_unknown_entity_table():
    files = {"file": ("x.pdf", b"%PDF-1.4\n", "application/pdf")}
    res = client.post("/api/v1/documents/upload", headers=PH, files=files,
                      data={"entity_id": "V-REAL-101", "entity_table": "profiles", "document_type": "POLICY"})
    assert res.status_code == 422


# --------------------------------------------------------------------------- ledger adapters
def test_ledger_arguments_are_validated():
    from services.fabric_client import LedgerArgumentError, validate_ledger_args

    validate_ledger_args("V-REAL-101", "CLAIM_CREATED", str(uuid.uuid4()), "ab" * 32, "2026-09-18T18:20:00.123+00:00")
    for bad in ['V1"]}\' ; rm -rf /', "a b", "", "x" * 200, "$(whoami)"]:
        with pytest.raises(LedgerArgumentError):
            validate_ledger_args(bad)


def test_gateway_adapter(monkeypatch):
    from services.fabric_adapter import GatewayFabricAdapter

    seen = {}

    def fake_request(method, url, headers=None, timeout=None, **kwargs):
        seen.update(method=method, url=url, headers=headers)
        if url.endswith("/api/commit"):
            return httpx.Response(200, json={"success": True, "network_mode": "REAL_FABRIC", "transaction_id": COMMITTED_TX})
        return httpx.Response(401, json={"error": "bad key"})

    monkeypatch.setattr(httpx, "request", fake_request)
    gw = GatewayFabricAdapter("https://ledger.example.test/", "secret-key", timeout=3)
    res = gw.record_event("V-REAL-101", "CLAIM_CREATED", "CLM-1", "ab" * 32, "2026-01-01T00:00:00Z")
    assert res["success"] and res["transaction_id"] == COMMITTED_TX
    assert seen["headers"] == {"X-Gateway-Key": "secret-key"}
    assert seen["url"] == "https://ledger.example.test/api/commit"
    assert gw.get_peer_health()["network_status"] == "UNAVAILABLE"

    def unreachable(*a, **k):
        raise httpx.ConnectError("refused")

    monkeypatch.setattr(httpx, "request", unreachable)
    res = gw.record_event("V-REAL-101", "CLAIM_CREATED", "CLM-1", "ab" * 32)
    assert res == {"success": False, "network_mode": "UNAVAILABLE", "error": "Ledger gateway unreachable: ConnectError"}


def test_disabled_adapter_in_status():
    body = client.get("/api/v1/system/status").json()
    assert body["data_mode"] == "DEMO_SANDBOX"
    assert body["components"]["database"]["status"] == "DEMO_SANDBOX"
    assert body["components"]["hyperledger_fabric"]["status"] == "NOT_CONFIGURED"


# --------------------------------------------------------------------------- HTTP behaviour
def test_errors_carry_cors_and_request_id(monkeypatch):
    import routers.claims as claims_router

    def boom(*a, **k):
        raise RuntimeError("database exploded")

    monkeypatch.setattr(claims_router, "accessible_vehicle_ids", boom)
    res = client.get("/api/v1/claims", headers={**PH, "Origin": "http://localhost:3000"})
    assert res.status_code == 500
    assert res.json()["detail"] == "An unexpected server error occurred."
    assert "database exploded" not in res.text
    assert res.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert res.headers["x-request-id"]


def test_security_headers_and_readiness():
    res = client.get("/ready")
    assert res.status_code == 200 and res.json()["data_mode"] == "DEMO_SANDBOX"
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"


def test_invalid_id_from_database_is_404(monkeypatch):
    import routers.claims as claims_router

    class APIError(Exception):
        code = "22P02"

    def bad(*a, **k):
        raise APIError('invalid input syntax for type uuid: "CLM-x"')

    monkeypatch.setattr(claims_router, "accessible_vehicle_ids", bad)
    res = client.get("/api/v1/claims", headers=PH)
    assert res.status_code == 404


def test_asymmetric_supabase_tokens_verified_via_jwks(settings, monkeypatch):
    """New Supabase projects sign tokens with ES256 keys published at a JWKS URL."""
    import dependencies
    from cryptography.hazmat.primitives.asymmetric import ec

    key = ec.generate_private_key(ec.SECP256R1())
    other = ec.generate_private_key(ec.SECP256R1())

    class FakeJWKS:
        def get_signing_key_from_jwt(self, token):
            return type("K", (), {"key": key.public_key()})()

    settings.supabase_jwks_url = "https://example.test/auth/v1/.well-known/jwks.json"
    monkeypatch.setattr(dependencies, "_jwks_client", lambda: FakeJWKS())

    claims = {"sub": "22222222-2222-2222-2222-222222222222", "aud": "authenticated"}
    good = jwt.encode(claims, key, algorithm="ES256")
    res = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {good}"})
    assert res.status_code == 200 and res.json()["role"] == "POLICYHOLDER"

    forged = jwt.encode(claims, other, algorithm="ES256")
    assert client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


def test_secret_key_env_alias(monkeypatch):
    from config import Settings

    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_example")
    monkeypatch.setenv("SUPABASE_URL", "https://abc.supabase.co")
    s = Settings()
    assert s.supabase_service_key == "sb_secret_example"
    assert s.jwks_url == "https://abc.supabase.co/auth/v1/.well-known/jwks.json"
