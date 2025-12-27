"""Main FastAPI application entry point."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import time

from config import settings
from routes import (
    auth,
    users,
    grocery_lists,
    pantry,
    households,
    meals,
    weather,
    dashboard,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create security scheme for Swagger UI
security = HTTPBearer()

# Create FastAPI app instance
app = FastAPI(
    title="Grocery App API",
    description=(
        "Backend API for busy parents to manage grocery lists, "
        "pantry inventory, and meal planning"
    ),
    version="1.0.0",
)

# Add security scheme to OpenAPI schema for Swagger UI
app.openapi_schema = None  # Clear cache to regenerate


def custom_openapi():
    """Custom OpenAPI schema with security definitions."""
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "Enter your JWT token. You can get a test token by running: "
                "python scripts/generate_test_token.py"
            ),
        }
    }

    # Add security to all endpoints that require authentication
    # This makes the Authorize button appear in Swagger UI
    for path, path_item in openapi_schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method in ["get", "post", "put", "delete", "patch"]:
                # Check if endpoint has dependencies that include get_current_user
                # For now, we'll add security to all endpoints
                # In production, you might want to be more selective
                if "security" not in operation:
                    operation["security"] = [{"Bearer": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Log configured CORS origins at startup
configured_origins = settings.get_allowed_origins()
logger.info(f"CORS configured origins: {configured_origins}")
logger.info("CORS also allows any *.vercel.app preview URLs via regex pattern")

app.add_middleware(
    CORSMiddleware,
    # Exact matches from config (including production Vercel domains)
    allow_origins=configured_origins,
    # Pattern match for Vercel preview URLs (e.g., grocery-list-app-git-*.vercel.app)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with method, path, and timing."""
    start_time = time.time()

    # Log request
    logger.info(f"→ {request.method} {request.url.path}")

    # Process request
    response = await call_next(request)

    # Log response
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"← {request.method} {request.url.path} - Status: {response.status_code} "
        f"- Time: {process_time:.2f}ms"
    )

    return response


# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(grocery_lists.router)
app.include_router(pantry.router)
app.include_router(households.router, prefix="/api")
app.include_router(meals.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(dashboard.router)


@app.get("/")
async def root():
    """Root endpoint with welcome message."""
    return {
        "message": "Welcome to Grocery App API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "grocery-app-api"}
