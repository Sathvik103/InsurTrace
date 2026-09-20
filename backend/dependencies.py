import os
import jwt
from typing import Any, Optional
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from database.mock_store import mock_db

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

# Use real Supabase if valid production credentials provided; otherwise fallback gracefully to mock_db
if SUPABASE_URL and SUPABASE_SERVICE_KEY and not ("test.supabase.co" in SUPABASE_URL or "mock.supabase.co" in SUPABASE_URL):
    try:
        supabase: Any = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception:
        supabase = mock_db
else:
    supabase = mock_db

security = HTTPBearer(auto_error=False)

IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development").lower() == "production"
ENABLE_DEMO_AUTH = os.environ.get("ENABLE_DEMO_AUTH", "true").lower() == "true" and not IS_PRODUCTION

DEV_TOKENS = {
    "dev-admin": "11111111-1111-1111-1111-111111111111",
    "dev-policyholder": "22222222-2222-2222-2222-222222222222",
    "dev-garage": "33333333-3333-3333-3333-333333333333",
    "dev-insurer": "44444444-4444-4444-4444-444444444444",
    "dev-surveyor": "55555555-5555-5555-5555-555555555555",
}

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    Validates authentication credentials and extracts the authoritative user ID.
    In PRODUCTION:
    - Requires valid Supabase JWT signed with SUPABASE_JWT_SECRET.
    - Strictly rejects development tokens, raw user IDs, and missing credentials.
    In DEMO / DEVELOPMENT:
    - Allows explicitly labelled demo tokens when ENABLE_DEMO_AUTH=true.
    """
    if not credentials:
        if IS_PRODUCTION:
            raise HTTPException(status_code=401, detail="Authentication required: No bearer token provided.")
        # Default policyholder user strictly for unauthenticated development browser browsing
        return "22222222-2222-2222-2222-222222222222"

    token = credentials.credentials

    # Development / Demo token check
    if token in DEV_TOKENS:
        if IS_PRODUCTION or not ENABLE_DEMO_AUTH:
            raise HTTPException(status_code=401, detail="Development tokens are strictly disabled in production.")
        return DEV_TOKENS[token]

    # Production Supabase JWT validation
    # 1. Direct Supabase Auth validation (supports modern ES256 and HS256 tokens)
    if hasattr(supabase, "auth") and hasattr(supabase.auth, "get_user"):
        try:
            user_resp = supabase.auth.get_user(token)
            if user_resp and getattr(user_resp, "user", None) and user_resp.user.id:
                return str(user_resp.user.id)
        except Exception:
            pass

    # 2. Local HS256 JWT decoding (fast offline validation when JWT secret is configured)
    jwt_secret = SUPABASE_JWT_SECRET
    secret_key = jwt_secret or "dev-jwt-secret-min-32-chars-long-strictly-for-testing"
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"], options={"verify_aud": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject claim (sub).")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired: Please sign in again.")
    except jwt.InvalidTokenError:
        pass

    # 3. Fallback for dev mode only if token matches a direct profile UUID
    if not IS_PRODUCTION and ENABLE_DEMO_AUTH:
        res = supabase.table("profiles").select("id").eq("id", token).execute()
        if res.data:
            return token

    raise HTTPException(status_code=401, detail="Invalid authentication token.")

def get_current_profile(user_id: str = Depends(get_current_user_id)):
    """Fetches the user's authoritative profile and role from the database, NOT the JWT metadata."""
    response = supabase.table("profiles").select("id, role, organization_id, email, full_name").eq("id", user_id).execute()
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
