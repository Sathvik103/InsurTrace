"""Document reading: photos, OCR fallback, new policy fields and line-based estimates.

The OCR engine itself is faked here so the suite runs anywhere; the real
Tesseract path is exercised inside the Docker image.
"""

from fastapi.testclient import TestClient

from main import app
from services.document_processing import extractor as ex

client = TestClient(app, raise_server_exceptions=False)
PH = {"Authorization": "Bearer dev-policyholder"}

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
POLICY_TEXT = (
    "POLICY SCHEDULE\nPolicy No: 3001/AB/123456/00\nIDV: 6,40,000\nCompulsory deductible 1000\n"
    "No Claim Bonus 35 %\nOwn Damage premium (before NCB): 15,200.00\nAdd-ons: Zero Depreciation cover\n"
)


def _upload(content: bytes, name: str, doc_type: str = "POLICY"):
    return client.post("/api/v1/documents/extract", headers=PH, files={"file": (name, content)}, data={"document_type": doc_type})


def test_unknown_file_type_is_rejected():
    assert _upload(b"GIF89a" + b"\x00" * 20, "x.gif").status_code == 415


def test_photo_without_ocr_engine_explains_instead_of_failing(monkeypatch):
    monkeypatch.setattr(ex, "ocr_available", lambda: False)
    r = _upload(PNG, "policy.png")
    assert r.status_code == 422
    assert "PDF" in r.json()["detail"]


def test_photo_is_read_with_ocr_and_values_are_marked(monkeypatch):
    monkeypatch.setattr(ex, "ocr_available", lambda: True)
    monkeypatch.setattr(ex, "ocr_photo", lambda _b: [{"page_number": 1, "raw_text": POLICY_TEXT, "tables_found": 0, "extracted_tables": []}])
    r = _upload(PNG, "policy.png")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ocr_used"] is True and body["source_kind"] == "image"
    f = body["extracted_fields"]
    assert f["idv_amount"]["value"] == 640000
    assert f["od_premium"]["value"] == 15200
    assert f["has_zero_dep"]["value"] is True
    assert f["idv_amount"]["method"].startswith("ocr_")
    assert f["idv_amount"]["confidence"] < 0.85  # OCR values are less certain than text-layer values


def test_policy_fields_from_text_layer():
    e = ex.DocumentExtractor()
    fields = e.parse_policy_document({"status": "SUCCESS", "full_text": POLICY_TEXT, "pages": [{"page_number": 1, "raw_text": POLICY_TEXT}]})["fields"]
    assert fields["ncb_percentage"]["value"] == 35
    assert fields["compulsory_deductible"]["value"] == 1000
    assert fields["od_premium"]["method"] == "regex_currency"


def test_zero_dep_is_unknown_when_not_mentioned():
    e = ex.DocumentExtractor()
    text = "IDV: 5,00,000\nNo Claim Bonus 20 %\n"
    fields = e.parse_policy_document({"status": "SUCCESS", "full_text": text, "pages": [{"page_number": 1, "raw_text": text}]})["fields"]
    assert fields["has_zero_dep"]["value"] is None  # absence is not a "no"


def test_estimate_lines_without_tables():
    e = ex.DocumentExtractor()
    text = "Front Bumper (replace)   14,800.00\nWindshield glass 11200\nLabour and paint charges  7,400\nGST 18% 5,652\nGrand Total  39,052\n"
    est = e.parse_estimate_document({"status": "SUCCESS", "full_text": text, "pages": [{"page_number": 1, "raw_text": text, "extracted_tables": []}]})["normalized_estimate"]
    items = {i["part_name"]: (i["category"], i["estimated_cost"]) for i in est["line_items"]}
    assert items == {
        "Front Bumper (replace)": ("plastic", 14800.0),
        "Windshield glass": ("glass", 11200.0),
        "Labour and paint charges": ("labour", 7400.0),
    }
    assert est["document_total"] == 39052.0
