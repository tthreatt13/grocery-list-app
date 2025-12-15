#!/bin/bash

# Exit on any error
set -e

echo "=========================================="
echo "Starting application..."
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    echo "Please ensure DATABASE_URL is configured in Railway."
    exit 1
fi

echo "✓ DATABASE_URL is configured"

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
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
