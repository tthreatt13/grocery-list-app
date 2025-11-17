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
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://grocery-list-app-seven.vercel.app",  # Production frontend
        "https://grocery-list-app-seven.vercel.app/",  # With trailing slash
        "*",  # Temporary: allow all origins for debugging
    ]
    
    # Server Configuration (for Railway deployment)
    host: str = "0.0.0.0"
    port: int = 8000
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Create global settings instance
settings = Settings()

