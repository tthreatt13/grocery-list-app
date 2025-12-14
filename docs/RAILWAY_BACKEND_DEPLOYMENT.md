# Railway Backend Deployment Documentation

## Overview

This document details the complete deployment of the Grocery List App FastAPI backend to Railway, including PostgreSQL database setup, environment configuration, and production deployment process.

## Project Information

- **Deployment Date**: November 16, 2025
- **Backend Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (Railway Managed)
- **Deployment Platform**: Railway
- **Production URL**: `https://grocery-list-app-production-c0f1.up.railway.app`

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Railway        │    │   PostgreSQL    │
│   (Next.js)     │◄──►│   Backend API    │◄──►│   Database      │
│   (Vercel)      │    │   FastAPI        │    │   (Managed)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Deployment Process

### 1. Railway Project Setup

**Project Details:**

- Project Name: `renewed-ambition`
- Service Name: `grocery-list-app`
- Region: US West (California, USA)
- GitHub Repository: `tthreatt/grocery-list-app`

**Database Configuration:**

- PostgreSQL managed database with automatic volume creation
- Volume: `postgres-volume` for data persistence
- Automatic connection via `DATABASE_URL` environment variable

### 2. Backend Configuration Files

#### Dockerfile (`backend/Dockerfile`)

```dockerfile
# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway will set PORT environment variable)
EXPOSE 8000

# Command to run the application
# Railway will provide PORT environment variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

#### Railway Configuration (`railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile",
    "buildContext": "backend"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Production Configuration Updates (`backend/config.py`)

```python
class Settings(BaseSettings):
    # ... existing settings ...

    # Production CORS origins
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://grocery-list-app.vercel.app",  # Production frontend
        "https://*.vercel.app",  # Vercel preview deployments
    ]

    # Server Configuration (for Railway deployment)
    host: str = "0.0.0.0"
    port: int = 8000
```

### 3. Environment Variables Configuration

**Railway Environment Variables:**

- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (auto-connected to PostgreSQL)
- `ENVIRONMENT`: `production`
- `CLERK_SECRET_KEY`: `sk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_CLERK_SECRET_KEY`

**Required Updates:**

- Replace `CLERK_SECRET_KEY` with actual Clerk secret key from dashboard
- Add any additional environment-specific variables as needed

### 4. GitHub Integration

**Automatic Deployment Setup:**

- Connected to `main` branch for production deployments
- Root directory set to `backend` for monorepo structure
- Automatic deployments triggered on push to main branch
- Railway GitHub App installed with repository access

**Deployment Trigger Process:**

1. Code pushed to `main` branch
2. Railway detects changes
3. Builds Docker image from `backend/Dockerfile`
4. Deploys to production environment
5. Health check validates deployment success

## Deployment Results

### Successful Deployment Metrics

- **Build Time**: 01:07 (1 minute 7 seconds)
- **Deploy Time**: 00:09 (9 seconds)
- **Total Deployment Time**: ~1 minute 16 seconds
- **Status**: ✅ Active and Healthy

### API Endpoints Verification

**Health Check Endpoint:**

```bash
curl https://grocery-list-app-production-c0f1.up.railway.app/health
# Response: {"status":"healthy","service":"grocery-app-api"}
```

**Root Endpoint:**

```bash
curl https://grocery-list-app-production-c0f1.up.railway.app/
# Response: {"message":"Welcome to Grocery App API","version":"1.0.0","docs":"/docs"}
```

**API Documentation:**

- Available at: `https://grocery-list-app-production-c0f1.up.railway.app/docs`
- Swagger UI loads successfully with all endpoints documented

## Frontend Integration

### API Client Configuration Update

Updated `lib/api/client.ts` to use Railway backend:

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://grocery-list-app-production-c0f1.up.railway.app'
```

**Environment Variable Options:**

- Development: Uses `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Production: Falls back to Railway URL if not set
- Vercel Deployment: Set `NEXT_PUBLIC_API_URL` in Vercel dashboard

## Database Management

### PostgreSQL Setup

- **Type**: Railway Managed PostgreSQL
- **Version**: Latest stable
- **Storage**: Persistent volume (`postgres-volume`)
- **Connection**: Automatic via Railway's `DATABASE_URL`

### Migration Process

**Automatic Migrations**: Migrations run automatically on every deployment via `backend/start.sh`, which executes `alembic upgrade head` before starting the FastAPI server. No manual migration steps are required.

**Manual Migration (if needed)**: If you need to manually run migrations or verify migration status:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link [project-id]

# Check current migration version
railway run alembic current

# Run migrations manually (usually not needed)
railway run alembic upgrade head

# View migration history
railway run alembic history
```

**Verification**: See [PRODUCTION_DATABASE_VERIFICATION.md](./PRODUCTION_DATABASE_VERIFICATION.md) for detailed instructions on verifying that all required tables and columns exist in production.

### Database Schema

All existing Alembic migrations are included:

- `90f091a98d1c_initial_schema.py` - Initial database schema
- `b1f2c3d4e5f6_add_meal_type_to_grocery_items.py` - Adds meal_type column to grocery_items
- `4801cb88f9d6_fix_meal_type_capitalization.py` - Fixes meal type capitalization
- `c7d8e9f0a1b2_change_low_stock_threshold_to_float.py` - Changes low_stock_threshold to float
- `d1e2f3a4b5c6_add_household_user_preferences.py` - Creates household_user_preferences table

## Monitoring and Observability

### Health Monitoring

- **Health Endpoint**: `/health`
- **Expected Response**: `{"status":"healthy","service":"grocery-app-api"}`
- **Railway Health Checks**: Configured with 100s timeout

### Logging

- **Railway Logs**: Available in Railway dashboard
- **Application Logs**: Structured logging with timestamps
- **Request Logging**: All HTTP requests logged with timing

### Metrics

- **Railway Metrics**: CPU, Memory, Network usage
- **Custom Metrics**: Available via `/metrics` endpoint (if implemented)

## Security Configuration

### CORS Policy

```python
allowed_origins = [
    "http://localhost:3000",      # Local development
    "http://localhost:3001",      # Alternative local port
    "https://grocery-list-app.vercel.app",  # Production frontend
    "https://*.vercel.app",       # Vercel preview deployments
]
```

### Authentication

- **Clerk Integration**: JWT token validation
- **API Key**: Clerk secret key for backend verification
- **Middleware**: Authentication middleware on protected routes

## Troubleshooting

### Common Issues

**1. Build Failures**

- Ensure `backend/Dockerfile` exists in repository
- Verify `requirements.txt` has all dependencies
- Check Railway build logs for specific errors

**2. Database Connection Issues**

- Verify `DATABASE_URL` environment variable is set
- Check PostgreSQL service status in Railway dashboard
- Ensure database migrations have been run

**3. CORS Errors**

- Update `allowed_origins` in `config.py`
- Verify frontend URL is included in CORS policy
- Check browser network tab for specific CORS errors

**4. Authentication Issues**

- Verify `CLERK_SECRET_KEY` is set correctly
- Check Clerk dashboard for API key validity
- Ensure JWT tokens are being sent in requests

### Debugging Commands

```bash
# Check service status
railway status

# View logs
railway logs

# Connect to database
railway connect postgres

# Run commands in Railway environment
railway run [command]

# Shell into running container
railway shell
```

## Performance Optimization

### Current Configuration

- **CPU**: 2 vCPU (plan limit)
- **Memory**: 1 GB (plan limit)
- **Replicas**: 1 instance
- **Region**: US West (California)

### Scaling Considerations

- **Horizontal Scaling**: Increase replica count (Pro plan required)
- **Vertical Scaling**: Upgrade Railway plan for more resources
- **Database Scaling**: PostgreSQL automatically managed by Railway
- **CDN**: Consider adding CDN for static assets

## Cost Management

### Railway Pricing

- **Starter Plan**: Current usage
- **Resource Limits**: 2 vCPU, 1 GB RAM
- **Database**: Included PostgreSQL
- **Bandwidth**: Generous limits for MVP usage

### Optimization Tips

- Monitor resource usage in Railway dashboard
- Optimize Docker image size for faster builds
- Use Railway's sleep mode for development environments
- Consider upgrading plan only when needed for production traffic

## Next Steps

### Immediate Actions Required

1. **Update Clerk Secret Key**: Replace placeholder with actual key
2. **Verify Database Migrations**: Migrations run automatically, but verify they completed successfully (see [PRODUCTION_DATABASE_VERIFICATION.md](./PRODUCTION_DATABASE_VERIFICATION.md))
3. **Deploy Frontend**: Deploy to Vercel with Railway backend URL
4. **End-to-End Testing**: Test all application features

### Future Enhancements

1. **Custom Domain**: Configure custom domain for API
2. **SSL Certificate**: Automatic HTTPS (included with Railway)
3. **Monitoring**: Add application performance monitoring
4. **Backup Strategy**: Configure database backups
5. **CI/CD Pipeline**: Enhance with testing and staging environments

## Conclusion

The Railway backend deployment has been successfully completed with:

- ✅ Production-ready FastAPI backend
- ✅ Managed PostgreSQL database
- ✅ Automatic GitHub deployments
- ✅ Health monitoring and logging
- ✅ CORS configuration for frontend integration
- ✅ Environment variable management

The backend is now live at `https://grocery-list-app-production-c0f1.up.railway.app` and ready for production use.

## References

- [Railway Documentation](https://docs.railway.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Clerk Authentication](https://clerk.com/docs)

---

_Document created: November 16, 2025_
_Last updated: November 16, 2025_
_Status: ✅ Deployment Complete_
