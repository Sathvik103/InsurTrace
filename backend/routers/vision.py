from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from main import get_current_profile, supabase
from services.vision_engine.detector import DamageDetector
import uuid

router = APIRouter(prefix="/vision", tags=["Computer Vision"])
detector = DamageDetector()

@router.post("/analyze-damage")
async def analyze_vehicle_damage(
    file: UploadFile = File(...),
    claim_id: str = Form(None),
    profile: dict = Depends(get_current_profile)
):
    """
    Analyzes an uploaded vehicle image for damage.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image format. Supported: JPG, PNG, WEBP")
        
    contents = await file.read()
    
    # Run Computer Vision Model
    result = detector.analyze_image(contents)
    
    # In a real pipeline, we'd upload the image to Supabase Storage here.
    storage_path = f"/{profile['organization_id']}/damage_images/{uuid.uuid4()}_{file.filename}"
    
    # Return the structured analysis
    return {
        "storage_path": storage_path,
        "analysis": result.dict(),
        "filename": file.filename
    }
