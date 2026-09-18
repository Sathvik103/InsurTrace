import os
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

if not SUPABASE_JWT_SECRET or not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("CRITICAL: Supabase environment variables are missing. Secure startup aborted.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validates the Supabase JWT and extracts the user ID."""
    token = credentials.credentials
    try:
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
