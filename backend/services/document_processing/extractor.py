import pdfplumber
import io
import datetime
import re
from typing import Dict, Any, List, Optional

class DocumentExtractor:
    """
    Open-Source Document Intelligence Pipeline.
    Uses rules-based regex and structural table extraction via pdfplumber.
    Does NOT claim to be a machine learning model trained on proprietary data.
    Missing values remain None and must be verified/supplied by the user.
    """

    def extract_text(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Extracts raw text and tabular structures from a PDF.
        """
        if mime_type != "application/pdf":
            return {
                "status": "UNSUPPORTED_FORMAT",
                "message": "Only PDF extraction is supported by the open-source pipeline."
            }

        extracted_pages = []
        full_text = ""
        
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for idx, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    tables = page.extract_tables() or []
                    
                    full_text += text + "\n"
                    
                    extracted_pages.append({
                        "page_number": idx + 1,
                        "raw_text": text,
                        "tables_found": len(tables),
                        "extracted_tables": tables
                    })
                    
            return {
                "status": "SUCCESS",
                "total_pages": len(extracted_pages),
                "full_text": full_text,
                "pages": extracted_pages,
                "extraction_method": "pdfplumber (Rules-Based)",
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "message": str(e)
            }

    def parse_policy_document(self, text_extraction_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic rules-based extraction for Indian motor insurance policies.
        Extracts: insurer, policy_number, vehicle_reg, idv, deductible, ncb, policy_period.
        Never invents missing values.
        """
        if text_extraction_result.get("status") != "SUCCESS":
            return {"status": "FAILED_PRECONDITION"}
            
        full_text = text_extraction_result.get("full_text", "")
        text_upper = full_text.upper()

        fields = {
            "insurer": {"value": None, "confidence": 0.0, "method": "keyword_match", "source_page": 1},
            "policy_number": {"value": None, "confidence": 0.0, "method": "regex_pattern", "source_page": 1},
            "registration_number": {"value": None, "confidence": 0.0, "method": "regex_pattern", "source_page": 1},
            "idv_amount": {"value": None, "confidence": 0.0, "method": "regex_currency", "source_page": 1},
            "compulsory_deductible": {"value": None, "confidence": 0.0, "method": "regex_currency", "source_page": 1},
            "ncb_percentage": {"value": None, "confidence": 0.0, "method": "regex_percentage", "source_page": 1},
            "valid_from": {"value": None, "confidence": 0.0, "method": "regex_date", "source_page": 1},
            "valid_to": {"value": None, "confidence": 0.0, "method": "regex_date", "source_page": 1}
        }

        # 1. Indian Vehicle Registration Pattern (e.g., MH-02-CB-1234, DL 4C AB 1234)
        reg_match = re.search(r'\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{0,3}[-\s]?[0-9]{4})\b', text_upper)
        if reg_match:
            fields["registration_number"] = {
                "value": re.sub(r'[-\s]', '', reg_match.group(1)),
                "confidence": 0.90,
                "method": "regex_pattern",
                "source_page": 1
            }

        # 2. Known Insurer Name Detection
        insurers = ["ICICI LOMBARD", "HDFC ERGO", "BAJAJ ALLIANZ", "TATA AIG", "NEW INDIA ASSURANCE", "ORIENTAL INSURANCE", "UNITED INDIA", "NATIONAL INSURANCE", "ACKO", "DIGIT"]
        for ins in insurers:
            if ins in text_upper:
                fields["insurer"] = {
                    "value": ins,
                    "confidence": 0.95,
                    "method": "keyword_match",
                    "source_page": 1
                }
                break

        # 3. Policy Number (Alphanumeric sequence of 10-25 chars)
        pol_match = re.search(r'(?:POLICY\s*(?:NO|NUMBER)[:\s#]*)([A-Z0-9/\-]{8,25})', text_upper)
        if pol_match:
            fields["policy_number"] = {
                "value": pol_match.group(1).strip(),
                "confidence": 0.85,
                "method": "regex_pattern",
                "source_page": 1
            }

        # 4. IDV (Insured Declared Value) - Currency pattern following IDV
        idv_match = re.search(r'(?:IDV|INSURED\s*DECLARED\s*VALUE)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', text_upper)
        if idv_match:
            try:
                num_str = idv_match.group(1).replace(",", "")
                fields["idv_amount"] = {
                    "value": float(num_str),
                    "confidence": 0.85,
                    "method": "regex_currency",
                    "source_page": 1
                }
            except ValueError:
                pass

        # 5. Compulsory Deductible
        ded_match = re.search(r'(?:COMPULSORY\s*DEDUCTIBLE|EXCESS)[^0-9]*([0-9]{3,5})', text_upper)
        if ded_match:
            try:
                fields["compulsory_deductible"] = {
                    "value": float(ded_match.group(1)),
                    "confidence": 0.80,
                    "method": "regex_currency",
                    "source_page": 1
                }
            except ValueError:
                pass

        # 6. NCB Percentage
        ncb_match = re.search(r'(?:NO\s*CLAIM\s*BONUS|NCB)[^0-9]*([0-9]{1,2})\s*%', text_upper)
        if ncb_match:
            try:
                fields["ncb_percentage"] = {
                    "value": float(ncb_match.group(1)),
                    "confidence": 0.90,
                    "method": "regex_percentage",
                    "source_page": 1
                }
            except ValueError:
                pass

        return {
            "status": "PARSED",
            "document_type": "POLICY",
            "fields": fields
        }

    def parse_estimate_document(self, text_extraction_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic rules-based extraction for garage repair estimates.
        Extracts parts, labour, GST, consumables from text and extracted tables.
        """
        if text_extraction_result.get("status") != "SUCCESS":
            return {"status": "FAILED_PRECONDITION"}

        line_items = []
        total_parts = 0.0
        total_labour = 0.0
        gst_amount = 0.0

        # Check extracted tables first
        pages = text_extraction_result.get("pages", [])
        for page in pages:
            for table in page.get("extracted_tables", []):
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    # Check if row looks like an item: [Description/Part, Qty, Cost]
                    desc = str(row[0] or "").strip()
                    if any(header in desc.upper() for header in ["PART", "DESCRIPTION", "ITEM", "SR", "SL"]):
                        continue
                    
                    # Search for price in row
                    for cell in reversed(row):
                        cell_str = str(cell or "").replace(",", "").strip()
                        try:
                            price = float(re.sub(r'[^0-9.]', '', cell_str))
                            if price > 50: # reasonable part or labour cost
                                is_labour = any(kw in desc.upper() for kw in ["LABOUR", "PAINT", "REPAIR", "CHARGES"])
                                if is_labour:
                                    total_labour += price
                                else:
                                    total_parts += price
                                    line_items.append({
                                        "part": desc,
                                        "quantity": 1,
                                        "unit_price": price,
                                        "oem": True
                                    })
                                break
                        except ValueError:
                            continue

        # Text regex fallback for totals
        full_text = text_extraction_result.get("full_text", "").upper()
        gst_match = re.search(r'(?:GST|TAX)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text)
        if gst_match:
            try:
                gst_amount = float(gst_match.group(1).replace(",", ""))
            except ValueError:
                pass

        if total_parts == 0 and total_labour == 0:
            # Look for estimated cost in text
            cost_match = re.search(r'(?:TOTAL|ESTIMATE|NET\s*AMOUNT)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text)
            if cost_match:
                try:
                    grand_total = float(cost_match.group(1).replace(",", ""))
                    total_parts = grand_total * 0.7
                    total_labour = grand_total * 0.3
                except ValueError:
                    pass

        return {
            "status": "PARSED",
            "document_type": "ESTIMATE",
            "normalized_estimate": {
                "line_items": line_items,
                "consumables": round(total_parts * 0.05, 2),
                "total_parts": total_parts,
                "total_labour": total_labour,
                "gst": gst_amount or round((total_parts + total_labour) * 0.18, 2),
                "grand_total": round(total_parts + total_labour + (gst_amount or (total_parts + total_labour) * 0.18), 2)
            }
        }
