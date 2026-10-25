import pdfplumber
import io
import datetime
import re
from typing import Dict, Any, List, Optional

from services.document_processing.ocr import ocr_available, ocr_pdf, ocr_photo

LABOUR_WORDS = ["LABOUR", "PAINT", "REPAIR", "CHARGES", "SERVICE", "ALIGNMENT"]
SKIP_LINE_WORDS = ["TOTAL", "GST", "TAX", "CGST", "SGST", "IGST", "SUBTOTAL", "SUB TOTAL", "DISCOUNT", "AMOUNT IN WORDS"]


def categorise(description: str) -> str:
    """Material of a repair line, which decides its depreciation."""
    d = description.upper()
    if any(k in d for k in LABOUR_WORDS):
        return "labour"
    if any(k in d for k in ["BUMPER", "PLASTIC", "FENDER LINER", "GRILL", "CLADDING", "HEADLAMP", "HEADLIGHT", "TAIL LAMP", "TAILLIGHT", "LAMP", "RUBBER", "MIRROR"]):
        return "plastic"
    if any(k in d for k in ["GLASS", "WINDSHIELD", "WINDSCREEN", "WINDOW"]):
        return "glass"
    if any(k in d for k in ["FIBRE", "FIBERGLASS"]):
        return "fiberglass"
    return "metal"


def _mark_ocr(fields: Dict[str, Any]) -> None:
    """Values read by OCR are less certain; say so in the method and confidence."""
    for f in fields.values():
        if f.get("value") is not None:
            f["method"] = f"ocr_{f['method']}"
            f["confidence"] = round(f["confidence"] * 0.8, 2)


class DocumentExtractor:
    """
    Open-Source Document Intelligence Pipeline.
    Uses rules-based regex and structural table extraction via pdfplumber.
    Does NOT claim to be a machine learning model trained on proprietary data.
    Handles encrypted/password-protected PDFs, scanned PDFs, multi-page documents, and missing fields.
    Missing values remain None and must be verified/supplied by the user.
    """

    def read_document(self, file_bytes: bytes, kind: str) -> Dict[str, Any]:
        """
        Text for a PDF or a photo. PDFs with a text layer are read directly;
        scanned PDFs and photos go through OCR when Tesseract is installed.
        """
        if kind == "pdf":
            result = self.extract_text(file_bytes, "application/pdf")
            if result.get("status") != "SCANNED_PDF_NO_TEXT" or not ocr_available():
                return result
            pages = ocr_pdf(file_bytes)
            total_pages = result.get("total_pages", len(pages))
        else:
            if not ocr_available():
                return {"status": "OCR_UNAVAILABLE", "message": "Photos can't be read on this server yet. Please upload a PDF or type the values."}
            pages = ocr_photo(file_bytes)
            total_pages = 1

        full_text = "\n".join(p["raw_text"] for p in pages)
        if len(re.sub(r"\s+", "", full_text)) < 20:
            return {"status": "SCANNED_PDF_NO_TEXT", "total_pages": total_pages, "full_text": full_text, "pages": pages,
                    "message": "We couldn't make out any text. Try a sharper, well-lit photo, or type the values."}
        return {
            "status": "SUCCESS",
            "ocr": True,
            "total_pages": total_pages,
            "full_text": full_text,
            "pages": pages,
            "extraction_method": "Tesseract OCR",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def extract_text(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Extracts raw text and tabular structures from a PDF.
        Detects encrypted PDFs and scanned images without text layer.
        """
        if mime_type != "application/pdf":
            return {
                "status": "UNSUPPORTED_FORMAT",
                "message": f"Unsupported format '{mime_type}'. Only standard PDF documents are supported."
            }

        extracted_pages = []
        full_text = ""
        
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                # Check if password protected
                if getattr(pdf, "doc", None) and getattr(pdf.doc, "is_encrypted", False):
                    return {
                        "status": "PASSWORD_PROTECTED",
                        "message": "This PDF document is password-protected or encrypted. Please remove the password before uploading."
                    }

                total_pages = len(pdf.pages)
                if total_pages == 0:
                    return {
                        "status": "EMPTY_DOCUMENT",
                        "message": "The uploaded PDF contains zero pages."
                    }

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

            # Check if this is a scanned document (virtually no extractable characters)
            cleaned_text = re.sub(r'\s+', '', full_text)
            if len(cleaned_text) < 20:
                return {
                    "status": "SCANNED_PDF_NO_TEXT",
                    "total_pages": total_pages,
                    "message": "This document appears to be a scanned image or rasterized PDF without an embedded text layer. Please upload a digital PDF or verify fields manually.",
                    "full_text": full_text,
                    "pages": extracted_pages
                }
                    
            return {
                "status": "SUCCESS",
                "total_pages": total_pages,
                "full_text": full_text,
                "pages": extracted_pages,
                "extraction_method": "pdfplumber (Deterministic Rules-Based)",
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        except Exception as e:
            err_str = str(e)
            if "password" in err_str.lower() or "encrypt" in err_str.lower():
                return {
                    "status": "PASSWORD_PROTECTED",
                    "message": "This PDF document is encrypted or password-protected. Please provide an unencrypted PDF."
                }
            return {
                "status": "ERROR",
                "message": f"PDF extraction error: {err_str}"
            }

    def parse_policy_document(self, text_extraction_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic rules-based extraction for Indian motor insurance policies.
        Extracts: insurer, policy_number, vehicle_reg, idv, deductible, ncb, policy_period.
        Never invents missing values; tracks page and provenance for each field.
        """
        if text_extraction_result.get("status") not in ["SUCCESS", "SCANNED_PDF_NO_TEXT"]:
            return {
                "status": "FAILED_PRECONDITION",
                "error": text_extraction_result.get("message", "Extraction failed")
            }
            
        full_text = text_extraction_result.get("full_text", "")
        text_upper = full_text.upper()
        pages = text_extraction_result.get("pages", [])

        fields = {
            "insurer": {"value": None, "confidence": 0.0, "method": "keyword_match", "source_page": None, "human_corrected": False},
            "policy_number": {"value": None, "confidence": 0.0, "method": "regex_pattern", "source_page": None, "human_corrected": False},
            "registration_number": {"value": None, "confidence": 0.0, "method": "regex_pattern", "source_page": None, "human_corrected": False},
            "idv_amount": {"value": None, "confidence": 0.0, "method": "regex_currency", "source_page": None, "human_corrected": False},
            "compulsory_deductible": {"value": None, "confidence": 0.0, "method": "regex_currency", "source_page": None, "human_corrected": False},
            "ncb_percentage": {"value": None, "confidence": 0.0, "method": "regex_percentage", "source_page": None, "human_corrected": False},
            "valid_from": {"value": None, "confidence": 0.0, "method": "regex_date", "source_page": None, "human_corrected": False},
            "valid_to": {"value": None, "confidence": 0.0, "method": "regex_date", "source_page": None, "human_corrected": False},
            "od_premium": {"value": None, "confidence": 0.0, "method": "regex_currency", "source_page": None, "human_corrected": False},
            "has_zero_dep": {"value": None, "confidence": 0.0, "method": "keyword_match", "source_page": None, "human_corrected": False},
        }

        def find_page_for_text(pattern: str) -> Optional[int]:
            for p in pages:
                if re.search(pattern, p.get("raw_text", "").upper()):
                    return p.get("page_number")
            return 1 if pages else None

        # 1. Indian Vehicle Registration Pattern (e.g. MH-02-CB-1234, DL 4C AB 1234)
        reg_match = re.search(r'\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{0,3}[-\s]?[0-9]{4})\b', text_upper)
        if reg_match:
            val = re.sub(r'[-\s]', '', reg_match.group(1))
            fields["registration_number"] = {
                "value": val,
                "confidence": 0.90,
                "method": "regex_pattern",
                "source_page": find_page_for_text(val),
                "human_corrected": False
            }

        # 2. Known Insurer Name Detection
        insurers = [
            "ICICI LOMBARD", "HDFC ERGO", "BAJAJ ALLIANZ", "TATA AIG", 
            "NEW INDIA ASSURANCE", "ORIENTAL INSURANCE", "UNITED INDIA", 
            "NATIONAL INSURANCE", "ACKO", "DIGIT", "SBI GENERAL", "RELIANCE GENERAL"
        ]
        for ins in insurers:
            if ins in text_upper:
                fields["insurer"] = {
                    "value": ins,
                    "confidence": 0.95,
                    "method": "keyword_match",
                    "source_page": find_page_for_text(ins),
                    "human_corrected": False
                }
                break

        # 3. Policy Number
        pol_match = re.search(r'(?:POLICY\s*(?:NO|NUMBER)[:\s#]*)([A-Z0-9/\-]{8,25})', text_upper)
        if pol_match:
            pol_num = pol_match.group(1).strip()
            fields["policy_number"] = {
                "value": pol_num,
                "confidence": 0.85,
                "method": "regex_pattern",
                "source_page": find_page_for_text(pol_num),
                "human_corrected": False
            }

        # 4. IDV (Insured Declared Value)
        idv_match = re.search(r'(?:IDV|INSURED\s*DECLARED\s*VALUE)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', text_upper)
        if idv_match:
            try:
                num_str = idv_match.group(1).replace(",", "")
                fields["idv_amount"] = {
                    "value": float(num_str),
                    "confidence": 0.85,
                    "method": "regex_currency",
                    "source_page": find_page_for_text("IDV"),
                    "human_corrected": False
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
                    "source_page": find_page_for_text("DEDUCTIBLE"),
                    "human_corrected": False
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
                    "source_page": find_page_for_text("NCB"),
                    "human_corrected": False
                }
            except ValueError:
                pass

        # 7. Own-damage premium (before NCB): the base for working out what the No-Claim Bonus is worth.
        prem_match = re.search(
            r'(?:(?:TOTAL|NET|BASIC)\s*)?(?:OWN\s*DAMAGE|OD)\s*PREMIUM[^0-9\n]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)', text_upper
        )
        if prem_match:
            try:
                fields["od_premium"] = {
                    "value": float(prem_match.group(1).replace(",", "")),
                    "confidence": 0.75,
                    "method": "regex_currency",
                    "source_page": find_page_for_text("PREMIUM"),
                    "human_corrected": False,
                }
            except ValueError:
                pass

        # 8. Zero-depreciation add-on. Only a positive mention counts; absence is left unknown, not "no".
        if re.search(r'ZERO\s*DEP|NIL\s*DEP|DEPRECIATION\s*(?:REIMBURSEMENT|COVER|WAIVER)|BUMPER\s*TO\s*BUMPER', text_upper):
            fields["has_zero_dep"] = {
                "value": True,
                "confidence": 0.7,
                "method": "keyword_match",
                "source_page": find_page_for_text("DEP"),
                "human_corrected": False,
            }

        # 9. Dates (From / To)
        date_pattern = r'\b([0-3]?[0-9][-/.](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|0[1-9]|1[0-2])[-/.](?:20\d{2}|\d{2}))\b'
        dates_found = re.findall(date_pattern, text_upper)
        if len(dates_found) >= 2:
            fields["valid_from"] = {
                "value": dates_found[0],
                "confidence": 0.75,
                "method": "regex_date",
                "source_page": 1,
                "human_corrected": False
            }
            fields["valid_to"] = {
                "value": dates_found[1],
                "confidence": 0.75,
                "method": "regex_date",
                "source_page": 1,
                "human_corrected": False
            }

        if text_extraction_result.get("ocr"):
            _mark_ocr(fields)

        return {
            "status": "PARSED",
            "document_type": "POLICY",
            "is_scanned_notice": text_extraction_result.get("status") == "SCANNED_PDF_NO_TEXT",
            "fields": fields
        }

    def parse_estimate_document(self, text_extraction_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic rules-based extraction for garage repair estimates.
        Extracts parts, labour, GST, consumables from text and extracted tables.
        Tracks itemized confidence and source pages.
        """
        if text_extraction_result.get("status") not in ["SUCCESS", "SCANNED_PDF_NO_TEXT"]:
            return {
                "status": "FAILED_PRECONDITION",
                "error": text_extraction_result.get("message", "Extraction failed")
            }

        line_items = []
        total_parts = 0.0
        total_labour = 0.0
        gst_amount = 0.0

        pages = text_extraction_result.get("pages", [])
        for page in pages:
            page_num = page.get("page_number", 1)
            for table in page.get("extracted_tables", []):
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    desc = str(row[0] or "").strip()
                    if any(header in desc.upper() for header in ["PART", "DESCRIPTION", "ITEM", "SR", "SL", "S.NO"]):
                        continue
                    
                    for cell in reversed(row):
                        cell_str = str(cell or "").replace(",", "").strip()
                        try:
                            price = float(re.sub(r'[^0-9.]', '', cell_str))
                            if 50 < price < 1000000:
                                category = categorise(desc)
                                if category == "labour":
                                    total_labour += price
                                else:
                                    total_parts += price
                                line_items.append({
                                    "part_name": desc,
                                    "category": category,
                                    "quantity": 1,
                                    "estimated_cost": price,
                                    "source_page": page_num,
                                    "confidence": 0.85,
                                })
                                break
                        except ValueError:
                            continue

        if not line_items:
            # No tables (typical for OCR): read "Description ..... 14,800.00" lines.
            line_re = re.compile(r'^\s*(?:\d+[.)]?\s+)?([A-Za-z][A-Za-z0-9 ()/&,.\-]{2,60}?)\s+(?:RS\.?|INR|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]{3,7}(?:\.[0-9]{1,2})?)\s*$', re.I)
            for page in pages:
                for raw in page.get("raw_text", "").splitlines():
                    m = line_re.match(raw)
                    if not m:
                        continue
                    desc = m.group(1).strip()
                    if any(w in desc.upper() for w in SKIP_LINE_WORDS):
                        continue
                    price = float(m.group(2).replace(",", ""))
                    if not 50 < price < 1000000:
                        continue
                    category = categorise(desc)
                    if category == "labour":
                        total_labour += price
                    else:
                        total_parts += price
                    line_items.append({
                        "part_name": desc,
                        "category": category,
                        "quantity": 1,
                        "estimated_cost": price,
                        "source_page": page.get("page_number", 1),
                        "confidence": 0.6 if text_extraction_result.get("ocr") else 0.7,
                    })

        full_text = text_extraction_result.get("full_text", "").upper()
        gst_amount = None
        gst_match = re.search(r'(?:GST|TAX)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text)
        if gst_match:
            try:
                gst_amount = float(gst_match.group(1).replace(",", ""))
            except ValueError:
                gst_amount = None

        # A total printed on the document, reported as-is. It is never split
        # into invented parts/labour amounts.
        document_total = None
        total_match = re.search(r'(?:GRAND\s*TOTAL|NET\s*AMOUNT|TOTAL\s*ESTIMATE|TOTAL)[^0-9]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text)
        if total_match:
            try:
                document_total = float(total_match.group(1).replace(",", ""))
            except ValueError:
                document_total = None

        itemised_total = round(total_parts + total_labour, 2)
        grand_total = round(itemised_total + (gst_amount or 0.0), 2) if line_items else document_total

        return {
            "status": "PARSED",
            "document_type": "ESTIMATE",
            "is_scanned_notice": text_extraction_result.get("status") == "SCANNED_PDF_NO_TEXT",
            "normalized_estimate": {
                "line_items": line_items,
                "total_parts": total_parts,
                "total_labour": total_labour,
                "gst": gst_amount,
                "document_total": document_total,
                "grand_total": grand_total
            }
        }
