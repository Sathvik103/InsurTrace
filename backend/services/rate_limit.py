"""Shared request rate limiter (per client IP, in-process memory store)."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from config import get_settings

settings = get_settings()


def client_ip(request: Request) -> str:
    # Render and Vercel terminate TLS at a proxy; the first X-Forwarded-For hop is the client.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=client_ip,
    default_limits=[settings.rate_limit_default],
    enabled=settings.environment != "test",
)

sensitive_limit = settings.rate_limit_sensitive
