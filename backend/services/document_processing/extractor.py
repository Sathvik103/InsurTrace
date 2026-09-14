import pdfplumber
import io
import datetime
from typing import Dict, Any, List

class DocumentExtractor:
    """
    Open-Source Document Intelligence Pipeline.
    Uses pdfplumber / PyMuPDF to extract text and bounding boxes without relying on a paid API.
    Architecture supports replacing this with Document AI/Textract via adapters in the future.
    """
    def __init__(self):
        pass

    def extract_text(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Extracts raw text and basic structured blocks from a PDF.
        Returns a canonical document dictionary.
        """
        if mime_type != "application/pdf":
            return {
                "status": "UNSUPPORTED_FORMAT",
                "message": "Only PDF extraction is currently supported by the open-source pipeline."
            }

        extracted_pages = []
        full_text = ""
        
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for idx, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    tables = page.extract_tables()
                    
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
                "extraction_method": "pdfplumber (Open-Source)",
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "message": str(e)
            }

    def parse_policy_document(self, text_extraction_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given the raw text extraction, attempts to pattern-match standard Indian motor policy fields.
        This is a deterministic regex/rule-based engine (simulated logic for now).
        """
        if text_extraction_result.get("status") != "SUCCESS":
            return {"status": "FAILED_PRECONDITION"}
            
        text = text_extraction_result.get("full_text", "").upper()
        
        # In a real pipeline, we'd use SpaCy or complex regex here.
        # Stubs representing what we look for:
        extracted = {
            "policy_number": {"value": None, "confidence": 0.0, "method": "regex"},
            "registration_number": {"value": None, "confidence": 0.0, "method": "regex"},
            "idv_amount": {"value": None, "confidence": 0.0, "method": "regex"},
        }
        
        # Simple dummy logic to prove architecture
        import re
        reg_match = re.search(r'[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4}', text)
        if reg_match:
            extracted["registration_number"] = {
                "value": reg_match.group(0).replace(" ", "").replace("-", ""),
                "confidence": 0.85,
                "method": "regex"
            }
            
        return {
            "status": "PARSED",
            "fields": extracted
        }
