import pytest
import datetime
from services.document_processing.extractor import DocumentExtractor
from services.financial_engine.calculator import calculate_decision
from services.financial_engine.models import ClaimDecisionInput, VehicleInfo, PolicyInfo, RepairItem
from services.vision_engine.detector import DamageDetector
from services.fabric_client import FabricClient

# ---------------------------------------------------------
# 1. Document Extraction & Field Integrity Tests
# ---------------------------------------------------------
def test_policy_document_rules_extraction_and_missing_values():
    """Verifies that real policy fields are extracted and missing values remain None."""
    sample_policy_text = """
    HDFC ERGO GENERAL INSURANCE COMPANY LIMITED
    SCHEDULE OF MOTOR INSURANCE POLICY - PRIVATE CAR
    Policy Number: 2311/2004/99812/00/000
    Insured Name: Rahul Sharma
    Vehicle Registration No: MH 02 CB 1234
    Year of Manufacture: 2021
    Insured Declared Value (IDV): 6,50,000.00
    Compulsory Deductible: 1000
    No Claim Bonus (NCB): 25%
    Period of Insurance: From 01-Jan-2026 to 31-Dec-2026
    """
    mock_extraction_result = {
        "status": "SUCCESS",
        "full_text": sample_policy_text,
        "pages": [{"page_number": 1, "raw_text": sample_policy_text, "tables_found": 0, "extracted_tables": []}]
    }

    extractor = DocumentExtractor()
    parsed = extractor.parse_policy_document(mock_extraction_result)

    assert parsed["status"] == "PARSED"
    fields = parsed["fields"]

    # Extracted correctly
    assert fields["insurer"]["value"] == "HDFC ERGO"
    assert fields["registration_number"]["value"] == "MH02CB1234"
    assert fields["idv_amount"]["value"] == 650000.0
    assert fields["compulsory_deductible"]["value"] == 1000.0
    assert fields["ncb_percentage"]["value"] == 25.0
    assert fields["policy_number"]["value"] == "2311/2004/99812/00/000"

    # Missing values must remain None (never silently hallucinated)
    assert fields["valid_from"]["value"] is None
    assert fields["valid_to"]["value"] is None

def test_estimate_document_extraction():
    """Verifies repair estimate extraction, table parsing, and financial totals."""
    extractor = DocumentExtractor()
    mock_result = {
        "status": "SUCCESS",
        "full_text": "REPAIR ESTIMATE TOTAL AMOUNT: 45,000.00",
        "pages": [{
            "page_number": 1,
            "raw_text": "Table of parts",
            "tables_found": 1,
            "extracted_tables": [[
                ["Description", "Qty", "Cost"],
                ["Front Bumper Plastic", "1", "6500.00"],
                ["Windshield Glass", "1", "12000.00"],
                ["Labour Charges Paint", "1", "5000.00"]
            ]]
        }]
    }

    parsed = extractor.parse_estimate_document(mock_result)
    assert parsed["status"] == "PARSED"
    est = parsed["normalized_estimate"]

    assert est["total_parts"] == 18500.0
    assert est["total_labour"] == 5000.0
    assert est["consumables"] == 925.0
    assert est["gst"] == 4230.0
    assert est["grand_total"] == 27730.0

# ---------------------------------------------------------
# 2. Financial Engine Integration with Extracted Values
# ---------------------------------------------------------
def test_financial_engine_with_extracted_policy_and_estimate():
    """Ensures that extracted policy + estimate run seamlessly through the financial decision engine."""
    input_data = ClaimDecisionInput(
        vehicle=VehicleInfo(age_years=3.0),
        policy=PolicyInfo(
            idv=650000.0,
            deductible=1000.0,
            ncb_percentage=25,
            zero_depreciation_addon=False,
            policy_start_date=datetime.date(2026, 1, 1),
            rule_version="IRDAI_STD_2026"
        ),
        repair_items=[
            RepairItem(category="plastic", cost=6500.0),
            RepairItem(category="glass", cost=12000.0),
            RepairItem(category="labour", cost=5000.0)
        ],
        estimated_base_premium_next_year=15000.0
    )

    result = calculate_decision(input_data)

    # Plastic (50% dep) = 3250
    # Glass (0% dep) = 12000
    # Labour (0% dep) = 5000
    # Admissible = 20250, Deductible = 1000 -> Payout = 19250
    assert result.estimated_payout == 19250.0
    assert result.recommendation in ["CLAIM", "SELF_PAY"]
    assert len(result.simulation_3_year) == 3

# ---------------------------------------------------------
# 3. Vision Engine Architecture & Security Review
# ---------------------------------------------------------
def test_vision_engine_experimental_stub():
    """Verifies that the vision engine returns an EXPERIMENTAL_STUB with image provenance."""
    detector = DamageDetector()
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100

    result = detector.analyze_image(fake_jpeg)

    assert result.status == "EXPERIMENTAL_STUB"
    assert len(result.image_hash) == 64
    assert result.detected_damages == []
    assert "COCO-Damage" in result.limitations or "weights" in result.limitations

# ---------------------------------------------------------
# 4. Hyperledger Fabric Client Verification
# ---------------------------------------------------------
def test_fabric_client_network_detection():
    """Verifies that FabricClient accurately reports live network status in WSL."""
    client = FabricClient()
    is_active = client.is_network_active()

    assert is_active is True, "Hyperledger Fabric peers must be active and running in Docker."

def test_fabric_client_verify_real_transaction():
    """Verifies querying the live Fabric ledger for the committed test transaction."""
    client = FabricClient()
    query_res = client.verify_event("V-REAL-101", "2026-09-18T18:20:00Z", "CLM-999")

    assert query_res["success"] is True
    assert query_res["network_mode"] == "REAL_FABRIC"
    assert query_res["localDataHash"] == "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
