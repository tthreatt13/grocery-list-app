#!/bin/bash
# Railway Setup Commands
# Run these after creating your Railway account

echo "🚂 Railway Setup Script"
echo "======================="

echo "Step 1: Login to Railway (will open browser)"
railway login

echo "Step 2: Create new project"
railway project create

echo "Step 3: Link to project"
railway link

echo "Step 4: Add PostgreSQL database"
echo "Go to Railway dashboard and click '+ New' > 'Database' > 'Add PostgreSQL'"
echo "Press Enter when done..."
read

echo "Step 5: Set environment variables"
echo "Go to Railway dashboard > Variables tab and add:"
echo "- ENVIRONMENT=production"
echo "- CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY"
echo "Press Enter when done..."
read

echo "Step 6: Deploy the application"
railway up

echo "Step 7: Run database migrations"
railway run alembic upgrade head

echo "Step 8: Test deployment"
echo "Your Railway URL will be shown in the dashboard"
echo "Test: curl https://YOUR_RAILWAY_URL/health"

echo "✅ Setup complete!"
