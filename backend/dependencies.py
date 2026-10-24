import logging
import time
from typing import Any, Optional

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

from config import get_settings
from database.mock_store import mock_db

logger = logging.getLogger(__name__)
settings = get_settings()

# Use real Supabase only with valid credentials; otherwise run on the in-memory
# demo sandbox. The active mode is reported honestly by /api/v1/system/status.
if settings.uses_real_supabase:
    try:
        supabase: Any = create_client(settings.supabase_url, settings.supabase_service_key)
    except Exception as e:  # pragma: no cover - depends on network/creds
        if settings.is_production:
            raise RuntimeError(f"Supabase client initialisation failed: {e}") from e
        logger.warning("Supabase client failed to initialise, using demo sandbox: %s", e)
        supabase = mock_db
else:
    supabase = mock_db

security = HTTPBearer(auto_error=False)

DEV_TOKENS = {
    "dev-admin": "11111111-1111-1111-1111-111111111111",
    "dev-policyholder": "22222222-2222-2222-2222-222222222222",
    "dev-garage": "33333333-3333-3333-3333-333333333333",
    "dev-insurer": "44444444-4444-4444-4444-444444444444",
    "dev-surveyor": "55555555-5555-5555-5555-555555555555",
    "dev-fleet": "66666666-6666-6666-6666-666666666666",
}

DEFAULT_DEV_USER = DEV_TOKENS["dev-policyholder"]

_jwks: Optional[jwt.PyJWKClient] = None


def _jwks_client() -> jwt.PyJWKClient:
    """Cached client for the project's public signing keys (refreshed by PyJWT as needed)."""
    global _jwks
    if _jwks is None:
        _jwks = jwt.PyJWKClient(settings.jwks_url, cache_keys=True, lifespan=3600, timeout=5)
    return _jwks


def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    Validates authentication credentials and extracts the authoritative user ID.

    - Supabase JWTs are always accepted when they validate.
    - Demo tokens (dev-*) are accepted only while demo auth is active, which is
      never the case in production against a real Supabase project.
    - Missing credentials are rejected unless running a non-production demo.
    """
    demo_ok = settings.demo_auth_active

    if not credentials:
        if demo_ok and not settings.is_production:
            # Local development convenience: browse as the demo policyholder.
            return DEFAULT_DEV_USER
        raise HTTPException(status_code=401, detail="Authentication required: No bearer token provided.")

    token = credentials.credentials

    if token in DEV_TOKENS:
        if not demo_ok:
            raise HTTPException(
                status_code=401,
                detail="Demo tokens are disabled on this deployment. Please sign in with your account.",
            )
        return DEV_TOKENS[token]

    # Verification is local wherever possible: no network round-trip per request.
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.InvalidTokenError:
        alg = ""

    # 1. Asymmetric (ES256/RS256) tokens: verified against the project's published
    #    keys, which are fetched once and cached.
    if alg in ("ES256", "RS256") and settings.jwks_url:
        try:
            signing_key = _jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(token, signing_key.key, algorithms=["ES256", "RS256"], audience="authenticated")
            if payload.get("sub"):
                return payload["sub"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid authentication token.")

    # 2. Legacy HS256 tokens with a configured secret (never a fallback secret).
    if alg == "HS256" and settings.supabase_jwt_secret:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": settings.uses_real_supabase},
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: missing subject claim (sub).")
            return user_id
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
        except jwt.InvalidTokenError:
            pass

    # 3. Last resort (legacy HS256 project without a configured secret): ask Supabase Auth.
    if alg == "HS256" and not settings.supabase_jwt_secret and settings.uses_real_supabase and hasattr(supabase, "auth"):
        try:
            user_resp = supabase.auth.get_user(token)
            if user_resp and getattr(user_resp, "user", None) and user_resp.user.id:
                return str(user_resp.user.id)
        except Exception:
            pass

    # 4. Development only: a raw demo profile UUID as token.
    if demo_ok and not settings.is_production:
        res = supabase.table("profiles").select("id").eq("id", token).execute()
        if res.data:
            return token

    raise HTTPException(status_code=401, detail="Invalid authentication token.")


_profile_cache: dict[str, tuple[float, dict]] = {}
PROFILE_TTL_SECONDS = 60.0


def get_current_profile(user_id: str = Depends(get_current_user_id)):
    """
    The user's authoritative profile and role from the database (never JWT metadata).
    Cached for a minute per process so most requests skip the lookup; a role
    change therefore takes effect within PROFILE_TTL_SECONDS.
    """
    now = time.monotonic()
    hit = _profile_cache.get(user_id)
    if hit and now - hit[0] < PROFILE_TTL_SECONDS:
        return dict(hit[1])
    response = supabase.table("profiles").select("id, role, organization_id, email, full_name").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=403, detail="User profile not found in database.")
    profile = response.data[0]
    if len(_profile_cache) > 5000:
        _profile_cache.clear()
    _profile_cache[user_id] = (now, profile)
    return dict(profile)


def clear_profile_cache() -> None:
    _profile_cache.clear()


def require_role(allowed_roles: list[str]):
    """Dependency factory for enforcing RBAC based on the database profile."""
    def role_checker(profile: dict = Depends(get_current_profile)):
        if profile.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")
        return profile
    return role_checker
