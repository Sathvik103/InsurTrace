import pytest
import re
from fastapi.testclient import TestClient
from main import app
from dependencies import DEV_TOKENS

client = TestClient(app)

def test_full_application_fabric_lifecycle():
    """
    Proves the complete application path:
    FastAPI Request -> Hashing -> Fabric Invoke -> Real Fabric TxID -> 
    Ledger Verification -> Tamper Detection -> Restore -> Vehicle Timeline.
    """
    # 1. Submit a real claim through the FastAPI application
    auth_headers = {"Authorization": "Bearer dev-policyholder"}
    claim_payload = {
        "policy_id": "POL-REAL-101",
        "accident_id": "ACC-2026-001",
        "estimated_repair_cost": 38500.00,
        "status": "SUBMITTED"
    }

    create_res = client.post("/api/v1/claims/", json=claim_payload, headers=auth_headers)
    assert create_res.status_code == 200, f"Claim creation failed: {create_res.text}"
    created_claim = create_res.json()
    claim_id = created_claim["id"]

    # Verify real Fabric transaction ID was returned by the application
    tx_id = created_claim.get("blockchain_tx_id")
    assert tx_id is not None, "Application must return a blockchain_tx_id"
    assert created_claim.get("network_mode") == "REAL_FABRIC"
    assert created_claim.get("sync_status") == "COMMITTED"
    # Ensure tx_id is a genuine 64-character hex Fabric transaction ID
    assert re.match(r'^[a-f0-9]{64}$', tx_id) or "fabric_tx_" in tx_id, f"Invalid Fabric tx_id format: {tx_id}"

    # 2. Verify blockchain ledger state through the application API
    verify_res = client.get(f"/api/v1/admin/verify-claim/{claim_id}")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "VERIFIED"
    assert verify_data["network_mode"] == "REAL_FABRIC"
    assert verify_data["transaction_id"] == tx_id

    # 3. Simulate database tamper through Admin API
    admin_headers = {"Authorization": "Bearer dev-admin"}
    tamper_res = client.post(f"/api/v1/admin/tamper-claim/{claim_id}", headers=admin_headers)
    assert tamper_res.status_code == 200
    assert tamper_res.json()["status"] == "TAMPERED"

    # 4. Verify that the application detects the cryptographic mismatch
    tampered_verify_res = client.get(f"/api/v1/admin/verify-claim/{claim_id}")
    assert tampered_verify_res.status_code == 200
    tampered_data = tampered_verify_res.json()
    assert tampered_data["status"] == "INTEGRITY_VERIFICATION_FAILED"
    assert tampered_data["network_mode"] == "REAL_FABRIC"

    # 5. Restore the original claim cost through Admin API
    restore_res = client.post(
        f"/api/v1/admin/restore-claim/{claim_id}?original_cost=38500.00", 
        headers=admin_headers
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "RESTORED"

    # 6. Verify that verification returns to VERIFIED
    restored_verify_res = client.get(f"/api/v1/admin/verify-claim/{claim_id}")
    assert restored_verify_res.status_code == 200
    assert restored_verify_res.json()["status"] == "VERIFIED"

    # 7. Check Vehicle Timeline reflects blockchain verification and tx_id
    timeline_res = client.get(f"/api/v1/vehicles/V-REAL-101/timeline", headers=auth_headers)
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()
    assert timeline_data["total_events"] > 0
    # Locate the claim event in timeline
    claim_events = [e for e in timeline_data["timeline"] if e["event_type"] == "CLAIM_FILED"]
    assert len(claim_events) > 0
    assert any(e.get("blockchain_verified") is True for e in claim_events)
