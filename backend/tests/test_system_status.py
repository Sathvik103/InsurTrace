import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_system_status_endpoint():
    """Verifies that GET /api/v1/system/status returns authoritative component statuses."""
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()

    assert data["platform"] == "VeriSure"
    assert "components" in data

    comps = data["components"]
    assert "database" in comps
    assert "authentication" in comps
    assert "financial_engine" in comps
    assert "hyperledger_fabric" in comps
    assert "ml_intelligence" in comps
    assert "external_vahan" in comps
    assert "external_insurers" in comps
    assert "external_workshops" in comps

    # Ensure unintegrated external sources are marked NOT CONNECTED
    assert comps["external_vahan"]["status"] == "NOT CONNECTED"
    assert comps["external_insurers"]["status"] == "NOT CONNECTED"
    assert comps["external_workshops"]["status"] == "NOT CONNECTED"

    # Ensure ML is honestly marked DATA-LIMITED
    assert comps["ml_intelligence"]["status"] == "DATA-LIMITED"

    # Ensure financial engine is operational
    assert comps["financial_engine"]["status"] == "OPERATIONAL"
