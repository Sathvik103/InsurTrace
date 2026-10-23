import hashlib
import re
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from config import get_settings
from dependencies import get_current_profile, supabase
from services.access import require_claim_access, require_vehicle_access
from services.document_processing.extractor import DocumentExtractor
from services.rate_limit import limiter, sensitive_limit

router = APIRouter(prefix="/documents", tags=["Documents"])

PDF_MAGIC = b"%PDF-"
DocumentType = Literal["POLICY", "ESTIMATE", "INVOICE", "SURVEY_REPORT", "OTHER"]
EntityTable = Literal["vehicles", "claims"]


def sanitize_filename(filename: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename or "document.pdf")
    return clean[-100:]


async def read_pdf_upload(file: UploadFile) -> bytes:
    """Reads an upload with a hard size cap and verifies it really is a PDF."""
    limit = get_settings().max_upload_bytes
    contents = await file.read(limit + 1)
    if len(contents) > limit:
        raise HTTPException(status_code=413, detail=f"File exceeds the {limit // (1024 * 1024)} MB limit.")
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if not contents.startswith(PDF_MAGIC):
        raise HTTPException(status_code=415, detail="Only PDF documents are supported.")
    return contents


def _require_entity_access(profile: dict, entity_table: str, entity_id: str) -> None:
    if entity_table == "vehicles":
        require_vehicle_access(profile, entity_id)
        return
    rows = supabase.table("claims").select("*").eq("id", entity_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Claim not found.")
    require_claim_access(profile, rows[0])


@router.post("/extract")
@limiter.limit(sensitive_limit)
async def extract_document_sync(
    request: Request,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    profile: dict = Depends(get_current_profile),
):
    """
    Extracts text and structured fields from a PDF for the review screen.
    Nothing is stored; the user reviews and corrects the fields first.
    """
    contents = await read_pdf_upload(file)
    extractor = DocumentExtractor()
    extraction_result = extractor.extract_text(contents, "application/pdf")

    if extraction_result["status"] == "PASSWORD_PROTECTED":
        raise HTTPException(
            status_code=422,
            detail="This PDF is password-protected. Please remove the password and upload it again.",
        )
    if extraction_result["status"] not in ["SUCCESS", "SCANNED_PDF_NO_TEXT"]:
        raise HTTPException(status_code=422, detail=extraction_result.get("message", "We could not read this document."))

    parsed_fields = {}
    if document_type == "POLICY":
        parsed_fields = extractor.parse_policy_document(extraction_result).get("fields", {})
    elif document_type == "ESTIMATE":
        parsed_fields = extractor.parse_estimate_document(extraction_result).get("normalized_estimate", {})

    return {
        "status": "COMPLETED",
        "document_type": document_type,
        "filename": sanitize_filename(file.filename),
        "is_scanned": extraction_result.get("status") == "SCANNED_PDF_NO_TEXT",
        "total_pages": extraction_result.get("total_pages", 1),
        "extraction_method": extraction_result.get("extraction_method", "pdfplumber (deterministic rules)"),
        "extracted_fields": parsed_fields,
        "raw_text": extraction_result.get("full_text", ""),
    }


@router.post("/upload")
@limiter.limit(sensitive_limit)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    entity_id: str = Form(..., max_length=100),
    entity_table: EntityTable = Form(...),
    document_type: DocumentType = Form(...),
    profile: dict = Depends(get_current_profile),
):
    _require_entity_access(profile, entity_table, entity_id)
    contents = await read_pdf_upload(file)
    file_hash = hashlib.sha256(contents).hexdigest()

    existing = (
        supabase.table("documents").select("id").eq("file_hash", file_hash)
        .eq("entity_id", entity_id).execute().data
    )
    if existing:
        return {"status": "DUPLICATE", "document_id": existing[0]["id"]}

    safe_name = sanitize_filename(file.filename)
    storage_path = f"{profile.get('organization_id') or 'personal'}/{entity_table}/{entity_id}/{uuid.uuid4().hex[:12]}_{safe_name}"

    extractor = DocumentExtractor()
    extraction_result = extractor.extract_text(contents, "application/pdf")
    parsed_fields = {}
    extraction_status = "FAILED"
    if extraction_result["status"] == "SUCCESS":
        if document_type == "POLICY":
            parsed_fields = extractor.parse_policy_document(extraction_result).get("fields", {})
            extraction_status = "COMPLETED"
        else:
            extraction_status = "EXTRACTED_UNPARSED"

    doc_data = {
        "entity_id": entity_id,
        "entity_table": entity_table,
        "document_type": document_type,
        "file_path": storage_path,
        "original_filename": safe_name,
        "mime_type": "application/pdf",
        "file_size": len(contents),
        "file_hash": file_hash,
        "uploaded_by_profile_id": profile["id"],
        "extraction_status": extraction_status,
        # File bytes are not persisted yet; only metadata and the SHA-256 fingerprint.
        "storage_status": "METADATA_ONLY",
    }
    result = supabase.table("documents").insert(doc_data).execute().data[0]
    result["parsed_metadata"] = parsed_fields
    return result


@router.get("/{entity_table}/{entity_id}")
async def get_documents(entity_table: EntityTable, entity_id: str, profile: dict = Depends(get_current_profile)):
    _require_entity_access(profile, entity_table, entity_id)
    return (
        supabase.table("documents").select("*").eq("entity_table", entity_table)
        .eq("entity_id", entity_id).execute().data or []
    )
