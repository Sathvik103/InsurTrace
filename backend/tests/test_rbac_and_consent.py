import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
import os

# Test profile payloads
ADMIN_PROFILE = {
    "id": "11111111-1111-1111-1111-111111111111",
    "role": "ADMIN",
    "organization_id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@insuretrace.in"
}

POLICYHOLDER_PROFILE = {
    "id": "22222222-2222-2222-2222-222222222222",
    "role": "POLICYHOLDER",
    "organization_id": "00000000-0000-0000-0000-000000000002",
    "email": "user@example.com"
}

GARAGE_PROFILE = {
    "id": "33333333-3333-3333-3333-333333333333",
    "role": "GARAGE",
    "organization_id": "00000000-0000-0000-0000-000000000003",
    "email": "garage@repair.com"
}

def test_admin_tamper_endpoint_blocks_non_admin():
    """Verifies that non-ADMIN profiles cannot invoke the tamper endpoint."""
    from routers.admin import tamper_claim
    import asyncio

    # Policyholder attempt -> Must raise 403
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(tamper_claim(claim_id="CLM-001", profile=POLICYHOLDER_PROFILE))
    assert exc_info.value.status_code == 403
    assert "Admin only" in exc_info.value.detail

    # Garage attempt -> Must raise 403
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(tamper_claim(claim_id="CLM-001", profile=GARAGE_PROFILE))
    assert exc_info.value.status_code == 403
    assert "Admin only" in exc_info.value.detail

def test_consent_grant_blocks_unauthorized_roles():
    """Verifies that only policyholders can grant or revoke data consents."""
    from routers.consent import grant_consent, revoke_consent, ConsentRequest
    import asyncio

    req = ConsentRequest(
        vehicle_id="V-101",
        requesting_org_id="00000000-0000-0000-0000-000000000003"
    )

    # Garage cannot grant consent for a vehicle -> Must raise 403
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(grant_consent(req=req, profile=GARAGE_PROFILE))
    assert exc_info.value.status_code == 403
    assert "Only policyholders" in exc_info.value.detail

    # Garage cannot revoke consent -> Must raise 403
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(revoke_consent(consent_id="c-001", profile=GARAGE_PROFILE))
    assert exc_info.value.status_code == 403
    assert "Only policyholders" in exc_info.value.detail


def test_production_auth_rejects_dev_tokens(settings):
    """With ENVIRONMENT=production and a real Supabase project, demo tokens and anonymous calls are rejected."""
    import dependencies
    from fastapi.security import HTTPAuthorizationCredentials

    settings.environment = "production"
    settings.supabase_url = "https://real-project.supabase.co"
    assert settings.demo_auth_active is False

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="dev-policyholder")
    with pytest.raises(HTTPException) as exc_info:
        dependencies.get_current_user_id(credentials=creds)
    assert exc_info.value.status_code == 401
    assert "Demo tokens are disabled" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info2:
        dependencies.get_current_user_id(credentials=None)
    assert exc_info2.value.status_code == 401
    assert "Authentication required" in exc_info2.value.detail


def test_production_blocks_tamper_simulation(settings):
    """Verifies that tamper endpoint is strictly disabled in production."""
    from routers.admin import tamper_claim, restore_claim
    import asyncio

    settings.environment = "production"
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(tamper_claim("CLM-999", profile=ADMIN_PROFILE))
    assert exc_info.value.status_code == 403
    assert "strictly disabled in production" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info2:
        asyncio.run(restore_claim("CLM-999", 45000.0, profile=ADMIN_PROFILE))
    assert exc_info2.value.status_code == 403
    assert "strictly disabled in production" in exc_info2.value.detail
