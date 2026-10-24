import logging
import uuid

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import get_settings
from dependencies import get_current_profile, require_role, supabase
from services.rate_limit import limiter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("verisure")

settings = get_settings()
settings.validate_for_startup()

app = FastAPI(
    title="VeriSure API",
    description="Backend API for VeriSure - Insurance Intelligence & Verification",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limited(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please wait a moment and try again."})


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Request ID, security headers, and a JSON 500 that still passes through CORS."""
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
    try:
        response = await call_next(request)
    except Exception as exc:
        # Postgres "invalid input syntax" (e.g. a non-UUID id in the URL) means
        # the record cannot exist: answer 404 rather than a server error.
        if getattr(exc, "code", None) == "22P02" or "22P02" in str(exc)[:300]:
            response = JSONResponse(status_code=404, content={"detail": "Not found.", "request_id": request_id})
            response.headers["X-Request-ID"] = request_id
            return response
        logger.exception("Unhandled error on %s %s [request_id=%s]", request.method, request.url.path, request_id)
        response = JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred.", "request_id": request_id},
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = response.headers.get("Cache-Control", "no-store")
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.add_middleware(SlowAPIMiddleware)

# Added last so it is the outermost middleware: every response, including
# errors and rate-limit rejections, carries the CORS headers the browser needs
# to show the real error instead of a generic network failure.
cors_origins = settings.origins or ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


@app.get("/health")
@limiter.exempt
async def health_check():
    """Liveness: the API process is up. Used by the hosting platform."""
    return {"status": "healthy"}


@app.get("/ready")
@limiter.exempt
async def readiness():
    """Readiness: database reachable. The ledger is reported but never blocks readiness."""
    from services.fabric_adapter import get_fabric_adapter

    db_ok = True
    try:
        supabase.table("profiles").select("id").limit(1).execute()
    except Exception as e:
        logger.warning("Readiness database check failed: %s", e)
        db_ok = False
    ledger = get_fabric_adapter().get_peer_health()
    body = {
        "status": "ready" if db_ok else "degraded",
        "data_mode": settings.data_mode,
        "database": "ok" if db_ok else "unreachable",
        "ledger": {"mode": ledger.get("mode"), "status": ledger.get("network_status")},
    }
    return JSONResponse(status_code=200 if db_ok else 503, content=body)


@app.get("/secure-data", dependencies=[Depends(require_role(["INSURER", "ADMIN"]))])
async def secure_endpoint(profile: dict = Depends(get_current_profile)):
    return {
        "message": "Access granted.",
        "user_role": profile["role"],
        "organization_id": profile["organization_id"],
    }


from routers.financial import router as financial_router  # noqa: E402
from routers.vehicles import router as vehicles_router  # noqa: E402
from routers.claims import router as claims_router  # noqa: E402
from routers.admin import router as admin_router  # noqa: E402
from routers.documents import router as documents_router  # noqa: E402
from routers.vision import router as vision_router  # noqa: E402
from routers.consent import router as consent_router  # noqa: E402
from routers.profiles import router as profiles_router  # noqa: E402
from routers.system_status import router as system_status_router  # noqa: E402

for r in (financial_router, vehicles_router, claims_router, admin_router, documents_router,
          vision_router, consent_router, profiles_router, system_status_router):
    app.include_router(r, prefix="/api/v1")


if __name__ == "__main__":
    import os

    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), reload=not settings.is_production)
