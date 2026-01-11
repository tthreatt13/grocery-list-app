#!/bin/bash

# Exit on any error
set -e

echo "=========================================="
echo "Starting application..."
echo "=========================================="

# Ensure we're in the backend directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verify main.py exists
if [ ! -f "main.py" ]; then
    echo "ERROR: main.py not found in $(pwd)"
    echo "Please ensure you're running this script from the backend directory."
    exit 1
fi

# Check if DATABASE_URL is set (only required for production)
if [ -z "$DATABASE_URL" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo "WARNING: DATABASE_URL environment variable is not set!"
    echo "For local development, this is OK if using SQLite."
    echo "For production, please ensure DATABASE_URL is configured."
else
    echo "✓ DATABASE_URL is configured (or not required for local dev)"
fi

# Run database migrations
echo ""
echo "=========================================="
echo "Running database migrations..."
echo "=========================================="

# Check current migration version before upgrade
echo "Checking current migration version..."
alembic current || echo "No migrations applied yet (this is OK for fresh deployments)"

# Run migrations
echo ""
echo "Applying migrations..."
if alembic upgrade head; then
    echo ""
    echo "✓ Migrations completed successfully"
    
    # Show current version after upgrade
    echo ""
    echo "Current migration version:"
    alembic current
else
    echo ""
    echo "ERROR: Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi

# Start the FastAPI application
echo ""
echo "=========================================="
echo "Starting FastAPI server..."
echo "=========================================="
echo "Working directory: $(pwd)"
echo "Command: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"

exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
