"""Application configuration using pydantic-settings."""

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
    
    # API Configuration
    api_prefix: str = "/api"
    # Default CORS origins (safe, explicit list).
    # Can be overridden via ALLOWED_ORIGINS env var (comma-separated).
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://grocery-list-app-seven.vercel.app",
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
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Create global settings instance
settings = Settings()

