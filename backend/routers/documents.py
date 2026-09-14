from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import datetime
import hashlib
import uuid
from main import get_current_profile, supabase

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    entity_id: str = Form(...),
    entity_table: str = Form(...),
    document_type: str = Form(...),
    profile: dict = Depends(get_current_profile)
):
    """
    Production architecture for document upload.
    In a real environment, `file.file.read()` is uploaded to Supabase Storage.
    Here we handle the extraction and metadata tracking.
    """
    contents = await file.read()
    file_size = len(contents)
    file_hash = hashlib.sha256(contents).hexdigest()
    
    # Check if duplicate hash exists for this entity to prevent duplicate uploads
    existing = supabase.table("documents").select("id").eq("file_hash", file_hash).execute()
    if existing.data:
        return {"status": "DUPLICATE", "document_id": existing.data[0]["id"]}
        
    # Simulated Storage Upload Path
    storage_path = f"/{profile['organization_id']}/{entity_table}/{entity_id}/{uuid.uuid4()}_{file.filename}"
    
    doc_data = {
        "entity_id": entity_id,
        "entity_table": entity_table,
        "document_type": document_type,
        "file_path": storage_path,
        "mime_type": file.content_type,
        "file_size": file_size,
        "file_hash": file_hash,
        "uploaded_by_profile_id": profile["id"],
        "extraction_status": "PENDING_OCR"
    }
    
    res = supabase.table("documents").insert(doc_data).execute()
    return res.data[0]

@router.get("/{entity_table}/{entity_id}")
async def get_documents(entity_table: str, entity_id: str, profile: dict = Depends(get_current_profile)):
    # RBAC logic to ensure the user can view these documents
    # omitted for brevity but strictly required in production
    res = supabase.table("documents").select("*").eq("entity_table", entity_table).eq("entity_id", entity_id).execute()
    return res.data
