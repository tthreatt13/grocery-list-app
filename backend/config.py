"""Application configuration using pydantic-settings."""

import os
import json
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# #region agent log
try:
    import json
    import time
    import os as _os
    _log_paths = [
        "/Users/tonythreatt/git/grocery-list-app/.cursor/debug.log",
        _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), ".cursor", "debug.log"),
        ".cursor/debug.log",
    ]
    _log_data = {
        "location": "config.py:6",
        "message": "Settings class definition - checking env var availability",
        "data": {
            "ANTHROPIC_API_KEY_exists": "ANTHROPIC_API_KEY" in _os.environ,
            "ANTHROPIC_API_KEY_length": len(_os.environ.get("ANTHROPIC_API_KEY", "")) if "ANTHROPIC_API_KEY" in _os.environ else 0,
            "ANTHROPIC_API_KEY_prefix": _os.environ.get("ANTHROPIC_API_KEY", "")[:10] if "ANTHROPIC_API_KEY" in _os.environ and len(_os.environ.get("ANTHROPIC_API_KEY", "")) > 10 else "N/A",
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "A"
    }
    for _lp in _log_paths:
        try:
            _os.makedirs(_os.path.dirname(_lp), exist_ok=True)
            with open(_lp, "a") as f:
                f.write(json.dumps(_log_data) + "\n")
            break
        except: continue
except: pass
# #endregion


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

    # Anthropic AI
    # Read directly from ANTHROPIC_API_KEY environment variable
    # pydantic-settings may not automatically map snake_case to UPPER_CASE
    anthropic_api_key: str = ""
    
    @model_validator(mode="after")
    def ensure_anthropic_api_key(self):
        """Ensure ANTHROPIC_API_KEY is loaded from environment variable."""
        # Read directly from environment as fallback if field is empty
        # This handles the case where pydantic-settings doesn't map the name correctly
        if not self.anthropic_api_key and "ANTHROPIC_API_KEY" in os.environ:
            env_value = os.environ["ANTHROPIC_API_KEY"].strip()
            if env_value:
                object.__setattr__(self, "anthropic_api_key", env_value)
        return self

    # API Configuration
    api_prefix: str = "/api"
    # Default CORS origins (safe, explicit list).
    # Can be overridden via ALLOWED_ORIGINS env var (comma-separated).
    # Note: Vercel preview URLs are automatically allowed via pattern matching.
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://grocery-list-app-seven.vercel.app",
        "https://grocery-list-app.vercel.app",  # Production Vercel domain
    ]

    # Server Configuration (for Railway deployment)
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    def get_allowed_origins(self) -> list[str]:
        """
        Return the list of allowed CORS origins.

        If an ALLOWED_ORIGINS env var is set, it should be a comma-separated
        list of origins. Empty strings are filtered out. Otherwise the default
        allowed_origins list is used.
        """
        import os

        raw = os.getenv("ALLOWED_ORIGINS")
        if not raw:
            return self.allowed_origins

        # Split on commas, strip whitespace, and drop empty entries
        parsed = [origin.strip() for origin in raw.split(",")]
        return [origin for origin in parsed if origin]

    def is_origin_allowed(self, origin: str) -> bool:
        """
        Check if an origin is allowed for CORS requests.

        Supports:
        - Exact matches from allowed_origins or ALLOWED_ORIGINS env var
        - Vercel preview URLs (*.vercel.app pattern)

        Args:
            origin: The origin header value from the request

        Returns:
            True if the origin is allowed, False otherwise
        """
        origins = self.get_allowed_origins()

        # Check exact matches first
        if origin in origins:
            return True

        # Check Vercel preview URL pattern (*.vercel.app)
        if origin.endswith(".vercel.app"):
            return True

        return False

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )


# Create global settings instance
settings = Settings()

# #region agent log
try:
    import json
    import time
    import os as _os
    import logging
    _config_logger = logging.getLogger(__name__)
    _log_paths = [
        "/Users/tonythreatt/git/grocery-list-app/.cursor/debug.log",
        _os.path.join(_os.path.dirname(__file__), "..", ".cursor", "debug.log"),
        ".cursor/debug.log",
    ]
    _log_data = {
        "location": "config.py:97",
        "message": "Settings instance created - checking loaded values",
        "data": {
            "anthropic_api_key_loaded": bool(settings.anthropic_api_key),
            "anthropic_api_key_length": len(settings.anthropic_api_key),
            "anthropic_api_key_prefix": settings.anthropic_api_key[:10] if len(settings.anthropic_api_key) > 10 else settings.anthropic_api_key,
            "environment": settings.environment,
            "raw_env_var_exists": "ANTHROPIC_API_KEY" in _os.environ,
            "raw_env_var_length": len(_os.environ.get("ANTHROPIC_API_KEY", "")) if "ANTHROPIC_API_KEY" in _os.environ else 0,
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "A"
    }
    _config_logger.error(f"[DEBUG] Settings loaded - anthropic_api_key exists: {bool(settings.anthropic_api_key)}, length: {len(settings.anthropic_api_key)}, env var exists: {'ANTHROPIC_API_KEY' in _os.environ}, env var length: {len(_os.environ.get('ANTHROPIC_API_KEY', '')) if 'ANTHROPIC_API_KEY' in _os.environ else 0}")
    for _lp in _log_paths:
        try:
            _os.makedirs(_os.path.dirname(_lp), exist_ok=True)
            with open(_lp, "a") as f:
                f.write(json.dumps(_log_data) + "\n")
            break
        except: continue
except Exception as _e:
    import logging
    logging.getLogger(__name__).error(f"[DEBUG] Failed to log settings check: {_e}")
# #endregion
