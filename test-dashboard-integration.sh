#!/bin/bash

# Test Dashboard Integration Script
# This script helps verify the backend-frontend integration for the dashboard

set -e

echo "==================================="
echo "Dashboard Integration Test"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "Test 1: Checking backend health..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Please start the backend:"
    echo "  cd backend && source venv/bin/activate && uvicorn main:app --reload"
    exit 1
fi

# Test 2: Check if backend accepts the new endpoint
echo ""
echo "Test 2: Testing /api/grocery-lists endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/grocery-lists)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint responds with 200 OK${NC}"
else
    echo -e "${RED}✗ Endpoint returned HTTP $HTTP_CODE${NC}"
    exit 1
fi

# Test 3: Check if include_items parameter works
echo ""
echo "Test 3: Testing /api/grocery-lists?include_items=true..."
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:8000/api/grocery-lists?include_items=true")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint with include_items=true responds with 200 OK${NC}"
    
    # Check if response contains items
    if echo "$BODY" | grep -q '"items"'; then
        echo -e "${GREEN}✓ Response includes items${NC}"
    else
        echo -e "${YELLOW}⚠ Response doesn't include items (might be empty database)${NC}"
    fi
else
    echo -e "${RED}✗ Endpoint returned HTTP $HTTP_CODE${NC}"
    exit 1
fi

# Test 4: Check frontend builds
echo ""
echo "Test 4: Checking frontend build..."
cd /Users/tonythreatt/git/grocery-list-app
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend builds successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    echo "  Run 'npm run build' to see errors"
    exit 1
fi

# Test 5: Run frontend tests
echo ""
echo "Test 5: Running frontend dashboard tests..."
if npm test -- app/__tests__/page.test.tsx --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✓ All dashboard tests pass${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "  Run 'npm test -- app/__tests__/page.test.tsx' to see details"
    exit 1
fi

echo ""
echo "==================================="
echo -e "${GREEN}All integration tests passed!${NC}"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Make sure NEXT_PUBLIC_API_URL is set in .env.local"
echo "2. Start the frontend: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Sign in and verify the dashboard displays real data"
echo ""

