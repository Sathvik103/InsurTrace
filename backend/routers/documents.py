from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import datetime
import hashlib
import uuid
from dependencies import get_current_profile, supabase
from services.document_processing.extractor import DocumentExtractor

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/extract")
async def extract_document_sync(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    profile: dict = Depends(get_current_profile)
):
    """
    Synchronous extraction endpoint meant to power the Review UI before saving to DB.
    Takes a PDF and returns the extracted structured data + confidence.
    """
    contents = await file.read()
    
    extractor = DocumentExtractor()
    extraction_result = extractor.extract_text(contents, file.content_type)
    
    if extraction_result["status"] == "PASSWORD_PROTECTED":
        raise HTTPException(
            status_code=422, 
            detail="The uploaded PDF document is password-protected or encrypted. Please remove password protection before uploading."
        )

    if extraction_result["status"] not in ["SUCCESS", "SCANNED_PDF_NO_TEXT"]:
        raise HTTPException(status_code=400, detail=extraction_result.get("message", "Extraction failed"))
        
    parsed_fields = {}
    is_scanned = extraction_result.get("status") == "SCANNED_PDF_NO_TEXT"

    if document_type == "POLICY":
        parsed = extractor.parse_policy_document(extraction_result)
        parsed_fields = parsed.get("fields", {})
    elif document_type == "ESTIMATE":
        parsed = extractor.parse_estimate_document(extraction_result)
        parsed_fields = parsed.get("normalized_estimate", {})
        
    return {
        "status": "COMPLETED",
        "document_type": document_type,
        "filename": file.filename,
        "is_scanned": is_scanned,
        "total_pages": extraction_result.get("total_pages", 1),
        "extraction_method": extraction_result.get("extraction_method", "pdfplumber (Deterministic Rules-Based)"),
        "extracted_fields": parsed_fields,
        "raw_text": extraction_result.get("full_text", "")
    }

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    entity_id: str = Form(...),
    entity_table: str = Form(...),
    document_type: str = Form(...),
    profile: dict = Depends(get_current_profile)
):
    contents = await file.read()
    file_size = len(contents)
    file_hash = hashlib.sha256(contents).hexdigest()
    
    existing = supabase.table("documents").select("id").eq("file_hash", file_hash).execute()
    if existing.data:
        return {"status": "DUPLICATE", "document_id": existing.data[0]["id"]}
        
    storage_path = f"/{profile['organization_id']}/{entity_table}/{entity_id}/{uuid.uuid4()}_{file.filename}"
    
    extractor = DocumentExtractor()
    extraction_result = extractor.extract_text(contents, file.content_type)
    
    parsed_fields = {}
    extraction_status = "FAILED"
    
    if extraction_result["status"] == "SUCCESS":
        if document_type == "POLICY":
            parsed = extractor.parse_policy_document(extraction_result)
            parsed_fields = parsed.get("fields", {})
            extraction_status = "COMPLETED"
        else:
            extraction_status = "EXTRACTED_UNPARSED"
            
    doc_data = {
        "entity_id": entity_id,
        "entity_table": entity_table,
        "document_type": document_type,
        "file_path": storage_path,
        "mime_type": file.content_type,
        "file_size": file_size,
        "file_hash": file_hash,
        "uploaded_by_profile_id": profile["id"],
        "extraction_status": extraction_status
    }
    
    res = supabase.table("documents").insert(doc_data).execute()
    result_data = res.data[0]
    result_data["parsed_metadata"] = parsed_fields
    
    return result_data

@router.get("/{entity_table}/{entity_id}")
async def get_documents(entity_table: str, entity_id: str, profile: dict = Depends(get_current_profile)):
    res = supabase.table("documents").select("*").eq("entity_table", entity_table).eq("entity_id", entity_id).execute()
    return res.data
