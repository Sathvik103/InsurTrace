"""
Optical character recognition for scanned PDFs and photos of documents.

Uses the Tesseract engine through pytesseract. Tesseract is installed in the
Docker image; on machines without it, `ocr_available()` is False and callers
fall back to asking the user to type the values.
"""

import io
import shutil
from typing import Any, Dict, List

MAX_OCR_PAGES = 3  # policy schedules put the key figures on the first pages
OCR_DPI = 220


def ocr_available() -> bool:
    if shutil.which("tesseract") is None:
        return False
    try:
        import pytesseract  # noqa: F401

        return True
    except ImportError:
        return False


def _ocr_image(image) -> str:
    import pytesseract

    # Greyscale improves accuracy on phone photos with uneven light.
    return pytesseract.image_to_string(image.convert("L"), lang="eng", config="--psm 6")


def ocr_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Renders the first pages of a PDF and reads them. Returns page dicts like the text extractor."""
    import pdfplumber

    pages = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for idx, page in enumerate(pdf.pages[:MAX_OCR_PAGES]):
            image = page.to_image(resolution=OCR_DPI).original
            pages.append({"page_number": idx + 1, "raw_text": _ocr_image(image), "tables_found": 0, "extracted_tables": []})
    return pages


def ocr_photo(file_bytes: bytes) -> List[Dict[str, Any]]:
    from PIL import Image, ImageOps

    image = ImageOps.exif_transpose(Image.open(io.BytesIO(file_bytes)))  # respect phone rotation
    return [{"page_number": 1, "raw_text": _ocr_image(image), "tables_found": 0, "extracted_tables": []}]
