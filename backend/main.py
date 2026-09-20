import os
import jwt
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

from dependencies import (
    supabase,
    get_current_user_id,
    get_current_profile,
    require_role,
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    SUPABASE_JWT_SECRET
)

app = FastAPI(
    title="VeriSure API",
    description="Backend API for VeriSure - Insurance Intelligence & Verification"
)

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/secure-data", dependencies=[Depends(require_role(["INSURER", "ADMIN"]))])
async def secure_endpoint(profile: dict = Depends(get_current_profile)):
    # The endpoint now has access to the user's authorized profile and organization ID
    # ensuring strict tenant isolation when querying data.
    return {
        "message": "Access granted.",
        "user_role": profile["role"],
        "organization_id": profile["organization_id"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from routers.financial import router as financial_router
from routers.vehicles import router as vehicles_router
from routers.claims import router as claims_router

app.include_router(financial_router, prefix="/api/v1")
app.include_router(vehicles_router, prefix="/api/v1")
app.include_router(claims_router, prefix="/api/v1")

from routers.admin import router as admin_router
app.include_router(admin_router, prefix="/api/v1")

from routers.documents import router as documents_router
app.include_router(documents_router, prefix="/api/v1")

from routers.vision import router as vision_router
app.include_router(vision_router, prefix="/api/v1")

from routers.consent import router as consent_router
app.include_router(consent_router, prefix="/api/v1")

from routers.profiles import router as profiles_router
app.include_router(profiles_router, prefix="/api/v1")
