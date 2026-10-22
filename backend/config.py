"""Application configuration using pydantic-settings."""

import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Grocery App API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./grocery_app.db"

    # Clerk Authentication
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_api_url: str = "https://api.clerk.com/v1"
    # Optional override. When empty, the JWKS URL is derived from the publishable key.
    clerk_jwks_url: str = ""
    # PEM public key honored only when environment is "test".
    clerk_test_jwt_public_key: str = ""

    # Anthropic AI
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"

    @model_validator(mode="after")
    def ensure_anthropic_api_key(self):
        """Ensure ANTHROPIC_API_KEY is loaded from environment variable."""
        if "ANTHROPIC_API_KEY" in os.environ:
            env_value = os.environ["ANTHROPIC_API_KEY"].strip()
            if env_value:
                object.__setattr__(self, "anthropic_api_key", env_value)
        return self

    # API Configuration
    api_prefix: str = "/api"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://grocery-list-app-seven.vercel.app",
        "https://grocery-list-app.vercel.app",
    ]

    # Server Configuration (for Railway deployment)
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    def get_allowed_origins(self) -> list[str]:
        """Return the list of allowed CORS origins."""
        raw = os.getenv("ALLOWED_ORIGINS")
        if not raw:
            return self.allowed_origins

        parsed = [origin.strip() for origin in raw.split(",")]
        return [origin for origin in parsed if origin]

    def is_origin_allowed(self, origin: str) -> bool:
        """Check if an origin is allowed for CORS requests."""
        origins = self.get_allowed_origins()

        if origin in origins:
            return True

        if origin.endswith(".vercel.app"):
            return True

        return False

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )


settings = Settings()
