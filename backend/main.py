"""Main FastAPI application entry point."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from config import settings
from routes import auth, users, grocery_lists, pantry, households, meals

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app instance
app = FastAPI(
    title="Grocery App API",
    description="Backend API for busy parents to manage grocery lists, pantry inventory, and meal planning",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # Use origins from config
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
    logger.info(f"← {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}ms")
    
    return response

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(grocery_lists.router)
app.include_router(pantry.router)
app.include_router(households.router, prefix="/api")
app.include_router(meals.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with welcome message."""
    return {
        "message": "Welcome to Grocery App API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "grocery-app-api"
    }

