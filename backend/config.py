"""
Central runtime configuration.

All environment variables the backend reads are declared here so that a
deployment can be audited in one place. In production the settings fail
closed: the app refuses to start with unsafe or missing security config.
"""

from functools import lru_cache
from typing import List, Literal, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MOCK_SUPABASE_HOSTS = ("test.supabase.co", "mock.supabase.co")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"

    # Supabase (managed identity + Postgres + storage)
    supabase_url: Optional[str] = None
    supabase_service_key: Optional[str] = None
    supabase_jwt_secret: Optional[str] = None

    # Demo personas (dev-* bearer tokens). In production they are only honoured
    # when the backend runs on the in-memory demo sandbox, so they can never
    # touch real user records.
    enable_demo_auth: bool = True

    # Comma-separated list of browser origins allowed to call the API.
    allowed_origins: str = ""

    # Ledger connectivity
    fabric_mode: Literal["auto", "gateway", "local_wsl", "disabled"] = "auto"
    gateway_url: Optional[str] = None
    gateway_api_key: Optional[str] = None
    fabric_base_dir: Optional[str] = None
    fabric_channel: str = "mychannel"
    fabric_chaincode: str = "vehicle"
    fabric_timeout_seconds: float = 20.0
    # First WSL call may cold-boot the VM, which takes several seconds.
    fabric_probe_timeout_seconds: float = 12.0
    allow_mock_blockchain: bool = False

    # Abuse protection
    rate_limit_default: str = "120/minute"
    rate_limit_sensitive: str = "20/minute"
    max_upload_bytes: int = 10 * 1024 * 1024

    @field_validator("environment", mode="before")
    @classmethod
    def _normalise_env(cls, v):
        return (v or "development").strip().lower()

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def uses_real_supabase(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_service_key
            and not any(h in self.supabase_url for h in MOCK_SUPABASE_HOSTS)
        )

    @property
    def data_mode(self) -> str:
        """SUPABASE when connected to a real project, otherwise DEMO_SANDBOX."""
        return "SUPABASE" if self.uses_real_supabase else "DEMO_SANDBOX"

    @property
    def demo_auth_active(self) -> bool:
        if not self.enable_demo_auth:
            return False
        # Production + real user data: demo tokens are never accepted.
        return not (self.is_production and self.uses_real_supabase)

    @property
    def origins(self) -> List[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    def validate_for_startup(self) -> None:
        if not self.is_production:
            return
        problems = []
        if not self.origins or "*" in self.origins:
            problems.append("ALLOWED_ORIGINS must list explicit origins in production")
        if self.uses_real_supabase and not self.supabase_jwt_secret:
            problems.append("SUPABASE_JWT_SECRET is required when connected to Supabase")
        if self.allow_mock_blockchain:
            problems.append("ALLOW_MOCK_BLOCKCHAIN must be false in production")
        uses_gateway = self.fabric_mode == "gateway" or (self.fabric_mode == "auto" and self.gateway_url)
        if uses_gateway and not (self.gateway_url and self.gateway_api_key):
            problems.append("The ledger gateway requires both GATEWAY_URL and GATEWAY_API_KEY")
        if self.gateway_url and self.gateway_url.startswith("http://"):
            problems.append("GATEWAY_URL must use https:// in production")
        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()
