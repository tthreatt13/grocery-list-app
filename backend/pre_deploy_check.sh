#!/bin/bash

# Pre-deployment verification script
# Run this before deploying to ensure migrations are ready

set -e

echo "=========================================="
echo "Pre-Deployment Migration Check"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "alembic.ini" ]; then
    echo "ERROR: Must run from backend directory"
    echo "Usage: cd backend && ./pre_deploy_check.sh"
    exit 1
fi

# Check if DATABASE_URL is set (for local testing)
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL not set (using default SQLite)"
    echo "   Set DATABASE_URL to test against PostgreSQL"
    echo ""
fi

echo "1. Checking migration files..."
MIGRATION_COUNT=$(find alembic/versions -name "*.py" -type f | wc -l | tr -d ' ')
echo "   Found $MIGRATION_COUNT migration files"

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "   ⚠️  WARNING: No migration files found!"
fi

echo ""
echo "2. Checking migration chain..."
if alembic history | grep -q "head"; then
    echo "   ✓ Migration chain is valid"
else
    echo "   ⚠️  WARNING: Could not verify migration chain"
fi

echo ""
echo "3. Checking for uncommitted migration files..."
UNCOMMITTED=$(git status --porcelain alembic/versions/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "   ⚠️  WARNING: Uncommitted migration files detected!"
    echo "   Please commit all migration files before deploying"
    git status --porcelain alembic/versions/
    exit 1
else
    echo "   ✓ All migration files are committed"
fi

echo ""
echo "4. Checking current migration version..."
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "sqlite:///./grocery_app.db" ]; then
    CURRENT=$(alembic current 2>/dev/null | awk '{print $1}' || echo "none")
    echo "   Current version: $CURRENT"
    
    HEAD=$(alembic heads 2>/dev/null | awk '{print $1}' || echo "unknown")
    echo "   Head version: $HEAD"
    
    if [ "$CURRENT" != "$HEAD" ] && [ "$CURRENT" != "none" ]; then
        echo "   ⚠️  WARNING: Database is not at head revision"
        echo "   Pending migrations will be applied on deployment"
    fi
else
    echo "   ⚠️  Skipping (DATABASE_URL not set or using SQLite)"
fi

echo ""
echo "5. Verifying start.sh exists and is executable..."
if [ -f "start.sh" ]; then
    if [ -x "start.sh" ]; then
        echo "   ✓ start.sh exists and is executable"
    else
        echo "   ⚠️  WARNING: start.sh is not executable"
        echo "   Run: chmod +x start.sh"
    fi
else
    echo "   ❌ ERROR: start.sh not found!"
    exit 1
fi

echo ""
echo "6. Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
    if grep -q "chmod +x start.sh" Dockerfile; then
        echo "   ✓ Dockerfile makes start.sh executable"
    else
        echo "   ⚠️  WARNING: Dockerfile may not make start.sh executable"
    fi
    
    if grep -q "start.sh" Dockerfile || grep -q "CMD.*start.sh" Dockerfile; then
        echo "   ✓ Dockerfile references start.sh"
    else
        echo "   ⚠️  WARNING: Dockerfile may not use start.sh"
    fi
else
    echo "   ⚠️  WARNING: Dockerfile not found in backend directory"
fi

echo ""
echo "=========================================="
echo "Pre-Deployment Check Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Commit all changes (including migration files)"
echo "3. Push to main branch (or Railway-connected branch)"
echo "4. Monitor Railway deployment logs for migration messages"
echo "5. Verify migrations ran: railway run alembic current"
echo ""
