from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from dependencies import get_current_profile, supabase
from services.vision_engine.detector import DamageDetector, VisionAnalysisResult
import uuid
import re

router = APIRouter(prefix="/vision", tags=["Computer Vision"])
detector = DamageDetector()

# Security & Upload limits
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp"
}

def sanitize_filename(filename: str) -> str:
    """Strips dangerous characters and path traversal attempts."""
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    return clean[-100:]  # Limit length

@router.post("/analyze-damage")
async def analyze_vehicle_damage(
    file: UploadFile = File(...),
    claim_id: str = Form(None),
    profile: dict = Depends(get_current_profile)
):
    """
    Analyzes an uploaded vehicle damage photo.
    Enforces strict upload limits, magic header validation, and RBAC permissions.
    Explicitly operates in EXPERIMENTAL_STUB mode to maintain data honesty.
    """
    # 1. RBAC authorization check
    if profile.get("role") not in ["POLICYHOLDER", "SURVEYOR", "INSURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized to upload damage photos.")

    # 2. MIME type check
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported format: {file.content_type}. Allowed: JPEG, PNG, WEBP."
        )

    # 3. Read and enforce size limit
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413, 
            detail=f"File exceeds maximum allowed size of {MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB."
        )
    if len(contents) < 32:
        raise HTTPException(status_code=400, detail="Corrupted or empty file.")

    # 4. Deep magic-bytes validation (Untrusted-file security)
    is_valid_magic = any(contents.startswith(sig) for sig in MAGIC_SIGNATURES.keys())
    if not is_valid_magic:
        raise HTTPException(status_code=400, detail="File content does not match valid image signature.")

    # 5. Execute Vision Pipeline (Experimental Stub)
    analysis = detector.analyze_image(contents)

    # 6. Sanitize storage destination
    safe_name = sanitize_filename(file.filename or "damage_photo.jpg")
    storage_path = f"/{profile['organization_id']}/damage_images/{uuid.uuid4().hex[:12]}_{safe_name}"

    # If claim_id provided, record into audit_logs
    if claim_id:
        supabase.table("audit_logs").insert({
            "action": "DAMAGE_IMAGE_ANALYZED",
            "entity_type": "claims",
            "entity_id": claim_id,
            "performed_by": profile["id"],
            "details": {
                "image_hash": analysis.image_hash,
                "storage_path": storage_path,
                "model_status": analysis.status
            }
        }).execute()

    return {
        "status": "PROCESSED",
        "storage_path": storage_path,
        "analysis": analysis.dict(),
        "filename": safe_name
    }
