import pytest
from services.data_ingestion.models import ProvenanceMetadata
from services.data_ingestion.repair_parser import RepairEstimateParser
from services.ml_engine.pipeline import extract_features
import datetime

def test_provenance_metadata():
    prov = ProvenanceMetadata(source_name="IRDAI", source_url="https://irdai.gov.in", is_real_world=True)
    assert prov.source_name == "IRDAI"
    assert prov.is_real_world is True
    assert prov.is_synthetic is False

def test_repair_estimate_parser():
    parser = RepairEstimateParser()
    raw = {
        "line_items": [
            {"part": "Front Bumper", "quantity": 1, "unit_price": 5000, "oem": True},
            {"part": "Windshield Glass", "quantity": 1, "unit_price": 12000, "oem": True},
            {"part": "Labour", "quantity": 1, "unit_price": 0, "labour_cost": 2000}
        ]
    }
    prov = ProvenanceMetadata(source_name="Manual Entry")
    parsed = parser.parse_estimate(raw, prov)
    
    assert parsed["status"] == "NORMALIZED"
    assert len(parsed["line_items"]) == 3
    assert parsed["financial_summary"]["total_parts"] == 17000
    assert parsed["financial_summary"]["total_labour"] == 2000

def test_ml_pipeline_feature_extraction():
    claim = {"estimated_repair_cost": 50000}
    vehicle = {"manufacture_year": 2022}
    
    features = extract_features(claim, vehicle, 2)
    assert features.vehicle_age == -4 # 2022 - 2026
    assert features.historical_claim_count == 2
    assert features.estimated_cost_ratio == 0.5
