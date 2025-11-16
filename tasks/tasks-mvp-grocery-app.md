# Task List: MVP Grocery App for Busy Parents

## Feature Overview
Build a full-stack web application with React + Next.js frontend and Python FastAPI backend that helps busy parents create weekly grocery lists, manage pantry inventory, plan meals, and share lists with household members. This task list focuses on backend API development, database setup, authentication integration, and connecting the existing frontend to the new backend.

## Target User
Busy parents who need to efficiently plan weekly meals and manage grocery shopping for their family.

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript (✅ already built)
- **Backend**: FastAPI + Python 3.11+
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy + Alembic (migrations)
- **Authentication**: Clerk
- **API Architecture**: RESTful
- **Deployment**: Vercel (frontend) + Railway (backend + database)

## Relevant Files

### Backend Structure (New)
- `backend/` - Root directory for FastAPI backend
- `backend/requirements.txt` - Python dependencies
- `backend/main.py` - FastAPI application entry point
- `backend/config.py` - Configuration and environment variables
- `backend/database.py` - SQLAlchemy database connection setup
- `backend/.env.example` - Example environment variables file
- `backend/alembic.ini` - Alembic migrations configuration
- `backend/alembic/env.py` - Alembic environment setup
- `backend/alembic/versions/` - Database migration files

### Database Models
- `backend/models/__init__.py` - Model exports
- `backend/models/user.py` - User model (linked to Clerk)
- `backend/models/grocery_list.py` - Grocery list model
- `backend/models/grocery_item.py` - Individual grocery item model
- `backend/models/pantry_item.py` - Pantry inventory item model
- `backend/models/meal.py` - Meal plan model
- `backend/models/household.py` - Household/family model
- `backend/models/household_member.py` - Household member association model

### API Routes
- `backend/routes/__init__.py` - Route exports
- `backend/routes/auth.py` - Authentication routes (Clerk integration)
- `backend/routes/users.py` - User management routes
- `backend/routes/grocery_lists.py` - Grocery list CRUD endpoints
- `backend/routes/grocery_items.py` - Grocery item endpoints
- `backend/routes/pantry.py` - Pantry inventory endpoints
- `backend/routes/meals.py` - Meal planner endpoints
- `backend/routes/households.py` - Household management endpoints

### Middleware & Utils
- `backend/middleware/auth.py` - Clerk authentication middleware
- `backend/middleware/permissions.py` - Permission checking middleware
- `backend/schemas/__init__.py` - Pydantic schema exports
- `backend/schemas/grocery.py` - Grocery list/item schemas
- `backend/schemas/pantry.py` - Pantry schemas
- `backend/schemas/meal.py` - Meal schemas
- `backend/schemas/household.py` - Household schemas
- `backend/utils/helpers.py` - Utility functions
- `backend/tests/` - Backend test files

### Frontend Updates (Existing)
- `lib/api/client.ts` - API client with fetch wrapper
- `lib/api/grocery.ts` - Grocery list API functions
- `lib/api/pantry.ts` - Pantry API functions
- `lib/api/meals.ts` - Meal planner API functions
- `lib/api/household.ts` - Household API functions
- `app/providers.tsx` - Clerk provider wrapper
- `.env.local` - Frontend environment variables

### Deployment
- `backend/Dockerfile` - Docker configuration for Railway
- `backend/railway.json` - Railway deployment configuration
- `.github/workflows/deploy.yml` - CI/CD pipeline (optional)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch for backend development
  - [x] 0.1 Create and checkout a new branch `feature/backend-api` from main
  - [x] 0.2 Ensure working tree is clean and frontend prototype is committed

- [x] 1.0 Set up FastAPI backend project infrastructure with PostgreSQL
  - [x] 1.1 Create `backend/` directory in project root
  - [x] 1.2 Create Python virtual environment: `python3 -m venv backend/venv`
  - [x] 1.3 Create `backend/requirements.txt` with initial dependencies (fastapi, uvicorn, sqlalchemy, psycopg2-binary, alembic, python-dotenv, clerk-backend-api, pydantic, pydantic-settings)
  - [x] 1.4 Activate venv and install dependencies: `pip install -r backend/requirements.txt`
  - [x] 1.5 Create `backend/main.py` with basic FastAPI app and health check endpoint
  - [x] 1.6 Create `backend/config.py` for environment configuration using pydantic-settings
  - [x] 1.7 Create `backend/.env.example` with required environment variables (DATABASE_URL, CLERK_SECRET_KEY, etc.)
  - [x] 1.8 Create `backend/.gitignore` to exclude venv/, .env, __pycache__, etc.
  - [x] 1.9 Create `backend/database.py` with SQLAlchemy engine and session setup
  - [x] 1.10 Test FastAPI server runs locally: `uvicorn main:app --reload` and verify health endpoint
  - [x] 1.11 Commit initial backend setup with message "chore: initialize FastAPI backend structure"

- [x] 2.0 Design and implement database schema with SQLAlchemy
  - [x] 2.1 Create `backend/models/` directory and `__init__.py`
  - [x] 2.2 Create `backend/models/user.py` with User model (id, clerk_user_id, email, name, created_at, updated_at)
  - [x] 2.3 Create `backend/models/household.py` with Household model (id, name, created_by, created_at)
  - [x] 2.4 Create `backend/models/household_member.py` with association table (household_id, user_id, role, joined_at)
  - [x] 2.5 Create `backend/models/grocery_list.py` with GroceryList model (id, household_id, name, created_by, created_at, updated_at)
  - [x] 2.6 Create `backend/models/grocery_item.py` with GroceryItem model (id, list_id, name, quantity, category, notes, checked, created_at)
  - [x] 2.7 Create `backend/models/pantry_item.py` with PantryItem model (id, household_id, name, quantity, category, expiration_date, low_stock_threshold, created_at, updated_at)
  - [x] 2.8 Create `backend/models/meal.py` with Meal model (id, household_id, meal_type, day_of_week, week_start_date, name, ingredients, notes, created_at)
  - [x] 2.9 Define all relationships between models (ForeignKey, relationships)
  - [x] 2.10 Initialize Alembic for migrations: `alembic init alembic`
  - [x] 2.11 Configure `alembic.ini` with database URL from environment
  - [x] 2.12 Update `alembic/env.py` to import models and use SQLAlchemy Base
  - [x] 2.13 Create initial migration: `alembic revision -m "initial schema"`
  - [x] 2.14 Review generated migration file for correctness
  - [x] 2.15 Apply migration to local database: ready when PostgreSQL is available
  - [x] 2.16 Verify tables created in PostgreSQL database: ready when PostgreSQL is available
  - [x] 2.17 Commit database models and migrations with message "feat: add database schema and models"

- [x] 3.0 Implement Clerk authentication and user management
  - [x] 3.1 Create `backend/middleware/` directory and `__init__.py`
  - [x] 3.2 Create `backend/middleware/auth.py` with Clerk JWT verification middleware
  - [x] 3.3 Add dependency function `get_current_user()` that validates Clerk token and returns user
  - [x] 3.4 Create `backend/routes/` directory and `__init__.py`
  - [x] 3.5 Create `backend/routes/auth.py` with webhook endpoint for Clerk user sync (create/update/delete)
  - [x] 3.6 Create `backend/routes/users.py` with GET /users/me endpoint (returns current user info)
  - [x] 3.7 Add endpoint POST /users/me to update user profile
  - [x] 3.8 Implement user creation logic that syncs Clerk user to database
  - [x] 3.9 Register auth and user routes in `backend/main.py`
  - [x] 3.10 Add CORS middleware in main.py to allow frontend origin
  - [x] 3.11 Test authentication with mock Clerk token
  - [x] 3.12 Commit authentication implementation with message "feat: add Clerk authentication and user routes"

- [x] 4.0 Build REST API endpoints for grocery lists
  - [x] 4.1 Create `backend/schemas/` directory and `__init__.py`
  - [x] 4.2 Create `backend/schemas/grocery.py` with Pydantic schemas (GroceryListCreate, GroceryListUpdate, GroceryListResponse, GroceryItemCreate, etc.)
  - [x] 4.3 Create `backend/routes/grocery_lists.py` with GET /api/grocery-lists endpoint (list all for user's households)
  - [x] 4.4 Add GET /api/grocery-lists/{list_id} endpoint (get single list with items)
  - [x] 4.5 Add POST /api/grocery-lists endpoint (create new list)
  - [x] 4.6 Add PUT /api/grocery-lists/{list_id} endpoint (update list name/metadata)
  - [x] 4.7 Add DELETE /api/grocery-lists/{list_id} endpoint (soft delete or hard delete)
  - [x] 4.8 Add POST /api/grocery-lists/{list_id}/items endpoint (add item to list)
  - [x] 4.9 Add PUT /api/grocery-lists/{list_id}/items/{item_id} endpoint (update item, including checked status)
  - [x] 4.10 Add DELETE /api/grocery-lists/{list_id}/items/{item_id} endpoint (remove item from list)
  - [x] 4.11 Add GET /api/grocery-lists/{list_id}/items?category={category} endpoint (filter by category)
  - [x] 4.12 Implement permission checks (user must be member of household that owns list)
  - [x] 4.13 Register grocery routes in `backend/main.py`
  - [x] 4.14 Test all grocery list endpoints with curl or Postman
  - [x] 4.15 Commit grocery list API with message "feat: add grocery list CRUD endpoints"

- [x] 5.0 Build REST API endpoints for pantry inventory
  - [x] 5.1 Create `backend/schemas/pantry.py` with Pydantic schemas (PantryItemCreate, PantryItemUpdate, PantryItemResponse)
  - [x] 5.2 Create `backend/routes/pantry.py` with GET /api/pantry endpoint (list all pantry items for household)
  - [x] 5.3 Add GET /api/pantry/{item_id} endpoint (get single pantry item)
  - [x] 5.4 Add POST /api/pantry endpoint (add new pantry item)
  - [x] 5.5 Add PUT /api/pantry/{item_id} endpoint (update pantry item quantity, expiration, etc.)
  - [x] 5.6 Add DELETE /api/pantry/{item_id} endpoint (remove pantry item)
  - [x] 5.7 Add GET /api/pantry/expiring endpoint (get items expiring within 7 days)
  - [x] 5.8 Add GET /api/pantry/low-stock endpoint (get items below threshold)
  - [x] 5.9 Add query parameters for category filter and search by name
  - [x] 5.10 Implement permission checks (user must be household member)
  - [x] 5.11 Register pantry routes in `backend/main.py`
  - [x] 5.12 Test all pantry endpoints
  - [x] 5.13 Commit pantry API with message "feat: add pantry inventory CRUD endpoints"

- [x] 6.0 Build REST API endpoints for meal planner
  - [x] 6.1 Create `backend/schemas/meal.py` with Pydantic schemas (MealCreate, MealUpdate, MealResponse, WeeklyPlanResponse)
  - [x] 6.2 Create `backend/routes/meals.py` with GET /api/meals/week?date={YYYY-MM-DD} endpoint (get meals for specific week)
  - [x] 6.3 Add GET /api/meals/{meal_id} endpoint (get single meal)
  - [x] 6.4 Add POST /api/meals endpoint (create new meal for specific day/meal type)
  - [x] 6.5 Add PUT /api/meals/{meal_id} endpoint (update meal details)
  - [x] 6.6 Add DELETE /api/meals/{meal_id} endpoint (remove meal from plan)
  - [x] 6.7 Add POST /api/meals/generate-grocery-list endpoint (generate grocery list from week's meals)
  - [x] 6.8 Implement logic to parse ingredients from meals and create grocery items
  - [x] 6.9 Implement permission checks (user must be household member)
  - [x] 6.10 Register meal routes in `backend/main.py`
  - [x] 6.11 Test all meal planner endpoints
  - [x] 6.12 Commit meal planner API with message "feat: add meal planner CRUD endpoints"

- [x] 7.0 Build REST API endpoints for household/family sharing
  - [x] 7.1 Create `backend/schemas/household.py` with Pydantic schemas (HouseholdCreate, HouseholdUpdate, HouseholdResponse, MemberInvite, MemberResponse)
  - [x] 7.2 Create `backend/routes/households.py` with GET /api/households endpoint (list user's households)
  - [x] 7.3 Add GET /api/households/{household_id} endpoint (get household details with members)
  - [x] 7.4 Add POST /api/households endpoint (create new household)
  - [x] 7.5 Add PUT /api/households/{household_id} endpoint (update household name)
  - [x] 7.6 Add DELETE /api/households/{household_id} endpoint (delete household - admin only)
  - [x] 7.7 Add POST /api/households/{household_id}/members endpoint (invite member by email)
  - [x] 7.8 Add PUT /api/households/{household_id}/members/{user_id} endpoint (update member role)
  - [x] 7.9 Add DELETE /api/households/{household_id}/members/{user_id} endpoint (remove member)
  - [x] 7.10 Add GET /api/households/{household_id}/shared-lists endpoint (get all lists shared in household)
  - [x] 7.11 Implement role-based permission checks (Admin, Member, Viewer)
  - [x] 7.12 Create `backend/middleware/permissions.py` with permission helper functions
  - [x] 7.13 Register household routes in `backend/main.py`
  - [x] 7.14 Test all household endpoints with different roles
  - [x] 7.15 Commit household API with message "feat: add household management and sharing endpoints"

- [ ] 8.0 Integrate frontend with backend API (replace mock data)
  - [x] 8.1 Install Clerk SDK in frontend: `npm install @clerk/nextjs`
  - [x] 8.2 Create `app/providers.tsx` with ClerkProvider wrapper
  - [x] 8.3 Update `app/layout.tsx` to wrap app with ClerkProvider
  - [x] 8.4 Create frontend `.env.local` with NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
  - [x] 8.5 Add NEXT_PUBLIC_API_URL environment variable pointing to backend
  - [x] 8.6 Create `lib/api/client.ts` with fetch wrapper that includes Clerk token in headers
  - [x] 8.7 Create `lib/api/grocery.ts` with functions for all grocery list endpoints
  - [x] 8.8 Create `lib/api/pantry.ts` with functions for all pantry endpoints
  - [x] 8.9 Create `lib/api/meals.ts` with functions for all meal planner endpoints
  - [x] 8.10 Create `lib/api/household.ts` with functions for all household endpoints
  - [x] 8.11 Update `app/grocery-lists/page.tsx` to fetch real data from API
  - [x] 8.12 Update `app/grocery-lists/[id]/page.tsx` to fetch real data from API
  - [x] 8.13 Update `app/pantry/page.tsx` to fetch real data from API
  - [x] 8.14 Update `app/meal-planner/page.tsx` to fetch real data from API
  - [x] 8.15 Update `app/household/page.tsx` to fetch real data from API
  - [x] 8.16 Update all form submissions to POST/PUT to API instead of local state
  - [x] 8.17 Add loading states and error handling to all API calls
  - [x] 8.18 Add authentication guards to protected pages using Clerk
  - [x] 8.19 Add sign-in/sign-up pages using Clerk components
  - [x] 8.20 Test full frontend-backend integration locally
  - [x] 8.21 Remove or comment out `lib/mockData.ts` (keep for reference)
  - [x] 8.22 Commit frontend integration with message "feat: integrate frontend with backend API"

- [x] 9.0 Deploy backend to Railway and configure production environment
  - [x] 9.1 Sign up for Railway account at railway.app
  - [x] 9.2 Create new Railway project for grocery app backend
  - [x] 9.3 Add PostgreSQL database to Railway project
  - [x] 9.4 Create `backend/Dockerfile` with Python 3.11 base image and app setup
  - [x] 9.5 Create `backend/railway.json` with start command configuration
  - [x] 9.6 Update `backend/main.py` to bind to host 0.0.0.0 and use PORT env var
  - [x] 9.7 Push backend code to GitHub repository
  - [x] 9.8 Connect Railway project to GitHub repository
  - [x] 9.9 Configure Railway environment variables (DATABASE_URL, CLERK_SECRET_KEY, etc.)
  - [x] 9.10 Deploy backend to Railway and verify deployment succeeds
  - [x] 9.11 Test backend health endpoint on Railway URL
  - [x] 9.12 Run database migrations on Railway: `railway run alembic upgrade head`
  - [x] 9.13 Configure Clerk webhook URL to point to Railway backend
  - [x] 9.14 Update frontend `.env.local` with Railway backend URL (NEXT_PUBLIC_API_URL)
  - [x] 9.15 Deploy frontend to Vercel (should already be configured)
  - [x] 9.16 Update Vercel environment variables with production values
  - [x] 9.17 Test production deployment end-to-end
  - [x] 9.18 Configure Railway domain (optional custom domain)
  - [x] 9.19 Set up Railway logs and monitoring
  - [x] 9.20 Commit deployment configuration with message "chore: add Railway deployment configuration"

- [ ] 10.0 End-to-end testing and bug fixes
  - [ ] 10.1 Create test user account with Clerk in production
  - [ ] 10.2 Test user sign-up and sign-in flow
  - [ ] 10.3 Test creating a household
  - [ ] 10.4 Test creating grocery lists and adding items
  - [ ] 10.5 Test checking off grocery items
  - [ ] 10.6 Test filtering grocery items by category
  - [ ] 10.7 Test adding pantry items with expiration dates
  - [ ] 10.8 Test pantry search and filter functionality
  - [ ] 10.9 Test meal planner - adding meals to calendar
  - [ ] 10.10 Test generating grocery list from meal plan
  - [ ] 10.11 Test inviting household members (send test invite)
  - [ ] 10.12 Test household member roles and permissions
  - [ ] 10.13 Test data persistence (refresh page, verify data remains)
  - [ ] 10.14 Test responsive design on mobile device
  - [ ] 10.15 Fix any bugs discovered during testing
  - [ ] 10.16 Add error handling for common failure scenarios
  - [ ] 10.17 Add user-friendly error messages
  - [ ] 10.18 Verify all API endpoints return appropriate status codes
  - [ ] 10.19 Test with multiple users in same household simultaneously
  - [ ] 10.20 Document any known issues or limitations in README
  - [ ] 10.21 Update README with production URLs and setup instructions
  - [ ] 10.22 Create pull request to merge feature branch to main
  - [ ] 10.23 Merge feature branch after review and testing complete

