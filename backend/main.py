import os
import jwt
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

# Fail securely during startup if critical configuration is missing. No fallbacks.
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

# Note: While Supabase standard auth uses HS256 with the JWT_SECRET, 
# production instances could use JWKS (RS256). For this implementation,
# we strictly rely on the configured secret and enforce HS256.
if not SUPABASE_JWT_SECRET or not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("CRITICAL: Supabase environment variables are missing. Secure startup aborted.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(
    title="InsureTrace India API",
    description="Backend API for InsureTrace India - Motor Insurance Intelligence Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validates the Supabase JWT and extracts the user ID."""
    token = credentials.credentials
    try:
        # Validate token using HS256 and the provided secret.
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_profile(user_id: str = Depends(get_current_user_id)):
    """Fetches the user's authoritative profile and role from the database, NOT the JWT metadata."""
    response = supabase.table("profiles").select("id, role, organization_id").eq("id", user_id).execute()
    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=403, detail="User profile not found in database.")
    return response.data[0]

def require_role(allowed_roles: list[str]):
    """Dependency factory for enforcing RBAC based on the database profile."""
    def role_checker(profile: dict = Depends(get_current_profile)):
        if profile.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")
        return profile
    return role_checker

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
