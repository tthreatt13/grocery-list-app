# Grocery List App

A modern, full-stack grocery list and meal planning application built for busy parents. Plan your weekly meals, manage your grocery lists, track pantry inventory, coordinate with household members, and view weather forecasts to make informed meal planning decisions - all in one beautiful interface with real-time backend integration. The smart dashboard provides actionable insights, urgent item alerts, and personalized suggestions to streamline your grocery planning workflow.

![Next.js](https://img.shields.io/badge/Next.js-16+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🏠 Smart Dashboard

- **Context-aware welcome messages** that adapt based on time of day and day of week
- **Urgent Action Items** section highlighting items that need immediate attention:
  - Low stock pantry items with one-click "Add to List" functionality
  - Items expiring soon with expiration date tracking
  - Dismiss items you've already handled
- **Smart Suggestions** engine providing personalized recommendations:
  - Restock suggestions for low inventory items
  - Meal planning reminders based on your schedule
  - Routine shopping list suggestions
  - Accept suggestions with one click or dismiss them
- **Insights & Patterns Display** showing actionable statistics:
  - Shopping efficiency with completion rate tracking
  - Meal planning coverage for the week
  - Pantry health status with low stock and expiring item counts
  - Active lists summary
- **Quick Actions** grid for fast navigation to key features
- **Recent Lists** section showing your most recently updated grocery lists
- **Responsive design** optimized for mobile and desktop viewing

### 🛒 Grocery Lists

- Create and manage multiple grocery lists
- Add items with quantities, categories, and notes
- Check off items as you shop with satisfying strike-through
- Filter items by category (Produce, Dairy, Meat, Bakery, etc.)
- Share lists with household members
- Track shopping progress with visual progress bars

### 🍳 Weekly Meal Planner

- Plan meals for the entire week (Breakfast, Lunch, Dinner)
- **AI-Powered Meal Planning Assistant** with interactive chat interface:
  - Get intelligent meal suggestions based on your pantry inventory, preferences, existing meals, and weather
  - Chat with Claude AI to refine suggestions (e.g., "make Monday's dinner vegetarian" or "suggest something quick for Wednesday")
  - Context-aware suggestions that use pantry items to reduce waste
  - Apply AI-suggested meals directly to your meal plan with one click
  - Optionally generate grocery lists from AI-suggested meals
- Visual calendar view with easy navigation between weeks
- Add meals with ingredients and notes
- Meal categories: Normal, Quick Meal, or Eat Out
- Visual indicators for meal categories (⚡ for Quick Meal, 🍴 for Eat Out)
- Generate grocery lists automatically from your meal plan (excludes Eat Out meals)
- Delete confirmation modal to prevent accidental deletions
- Mobile-optimized scrollable calendar
- Quick stats showing meals planned and ingredients needed

### 🏺 Pantry Inventory

- Keep track of all pantry items in one place
- Set expiration dates and get alerts for items expiring soon
- Low stock warnings with customizable thresholds
- Generate grocery lists from low-stock items with one click
- Add low-stock items to existing grocery lists or create new lists
- Select which items to include when generating lists
- Search and filter by category
- Visual grid layout with item details
- Track when items were added and last updated

### 👨‍👩‍👧‍👦 Household Management

- Invite family members to collaborate
- Assign roles (Admin, Member, Viewer)
- See who last edited shared lists
- View all shared grocery lists in one place
- Real-time collaboration with backend integration
- Save zip code preferences for personalized weather forecasts

### 🌤️ Weather Integration

- View 7-day weather forecasts directly in the household page
- Save your zip code in household preferences for automatic weather updates
- See high/low temperatures and precipitation chances
- Make informed meal planning decisions based on upcoming weather
- Weather data cached for optimal performance

## 🚀 Getting Started

### Prerequisites

**Frontend:**

- Node.js 18.0 or higher
- npm or yarn package manager

**Backend:**

- Python 3.11 or higher
- PostgreSQL 15+ (or SQLite for development)
- Virtual environment (venv or conda)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/grocery-list-app.git
cd grocery-list-app
```

2. **Set up the backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
# Copy railway-env-template.txt and create .env file with your settings
# For local development, DATABASE_URL can use SQLite: sqlite:///./grocery_app.db
# ANTHROPIC_API_KEY is required for AI meal planning features (get from https://console.anthropic.com/)

# Set up the database
alembic upgrade head

# Start the backend server
uvicorn main:app --reload
# Or use the start script (runs migrations automatically):
./start.sh
# Or use the Python wrapper script:
python start_backend.py
```

3. **Set up the frontend:**

```bash
# In a new terminal, from the project root
npm install

# Set up environment variables
# Create .env.local with:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
# CLERK_SECRET_KEY=your_secret
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the frontend development server
npm run dev
```

4. **Access the application:**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Environment Variables

**Backend (.env):**

- `DATABASE_URL` - Database connection string (PostgreSQL or SQLite)
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key for AI meal planning (get from https://console.anthropic.com/)
- `ENVIRONMENT` - Environment name (development/production)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (optional)

**Frontend (.env.local):**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key (for server-side)
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to Railway production URL)

## 🏗️ Project Structure

```
grocery-list-app/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Home/Dashboard (✅ Backend integrated)
│   ├── layout.tsx               # Root layout with providers
│   ├── providers.tsx            # React context providers
│   ├── globals.css              # Global styles
│   ├── grocery-lists/           # Grocery lists pages
│   │   ├── page.tsx            # Lists overview page
│   │   └── [id]/               # Individual list detail pages
│   ├── pantry/                  # Pantry inventory page
│   │   └── page.tsx
│   ├── meal-planner/            # Weekly meal planner page
│   │   └── page.tsx
│   ├── household/               # Household management page
│   │   └── page.tsx
│   ├── sign-in/                 # Clerk authentication
│   └── sign-up/                 # Clerk registration
├── backend/                      # FastAPI backend
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration and settings
│   ├── database.py              # Database connection setup
│   ├── start.sh                 # Startup script (runs migrations)
│   ├── start_backend.py         # Python wrapper script for starting backend
│   ├── pre_deploy_check.sh      # Pre-deployment verification
│   ├── verify_schema.py         # Database schema verification
│   ├── Dockerfile               # Docker configuration for Railway
│   ├── models/                  # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── household.py
│   │   ├── grocery_list.py
│   │   ├── grocery_item.py
│   │   ├── pantry_item.py
│   │   ├── meal.py
│   │   └── household_member.py
│   ├── routes/                  # API route handlers
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── households.py
│   │   ├── grocery_lists.py
│   │   ├── pantry.py
│   │   ├── meals.py
│   │   ├── weather.py           # Weather API endpoints
│   │   └── dashboard.py         # Dashboard insights API endpoint
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── weather.py           # Weather response schemas
│   │   └── dashboard.py        # Dashboard insights schemas
│   ├── services/                # Business logic services
│   │   ├── weather.py           # Weather API integration service
│   │   └── meal_planning_ai.py  # AI meal planning service (Anthropic Claude integration)
│   ├── middleware/              # Authentication & permissions
│   │   ├── auth.py
│   │   └── permissions.py
│   ├── alembic/                 # Database migrations
│   │   ├── env.py
│   │   └── versions/            # Migration files
│   └── tests/                   # Backend test suite
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmDeleteModal.tsx
│   │   ├── Badge.tsx
│   │   ├── Checkbox.tsx
│   │   └── Select.tsx
│   ├── grocery/                 # Grocery list components
│   │   ├── GroceryListCard.tsx
│   │   ├── GroceryListItem.tsx
│   │   ├── AddItemForm.tsx
│   │   ├── EditItemForm.tsx
│   │   ├── SortMethodSelector.tsx
│   │   └── ReuseListModal.tsx
│   ├── pantry/                  # Pantry components
│   │   ├── PantryGrid.tsx
│   │   ├── PantryItemCard.tsx
│   │   ├── AddPantryItemForm.tsx
│   │   ├── EditPantryItemForm.tsx
│   │   └── GenerateGroceryListModal.tsx
│   ├── meal-planner/            # Meal planner components
│   │   ├── WeeklyCalendar.tsx
│   │   ├── MobileWeeklyCalendar.tsx
│   │   ├── MealCard.tsx
│   │   ├── AddMealModal.tsx
│   │   ├── MealDetailsModal.tsx
│   │   ├── AIMealPlanningAssistant.tsx  # AI-powered meal planning assistant
│   │   ├── MealSuggestionCard.tsx      # Meal suggestion display component
│   │   └── GenerateGroceryListFromMealsModal.tsx
│   ├── household/               # Household components
│   │   ├── MemberCard.tsx
│   │   ├── InviteMemberForm.tsx
│   │   ├── EditMemberForm.tsx
│   │   ├── PreferencesForm.tsx
│   │   ├── SharedListsView.tsx
│   │   └── WeatherForecast.tsx  # Weather forecast display
│   ├── dashboard/               # Dashboard components
│   │   ├── DashboardLayout.tsx  # Context-aware dashboard layout
│   │   ├── UrgentActionItems.tsx # Urgent items display
│   │   ├── SmartSuggestions.tsx # Smart suggestions engine
│   │   └── InsightsDisplay.tsx  # Insights and patterns display
│   └── layout/                  # Layout components
│       ├── Navbar.tsx
│       └── MobileNav.tsx
├── lib/                         # Frontend utilities and helpers
│   ├── api/                     # API client functions
│   │   ├── client.ts           # Base API client
│   │   ├── grocery.ts          # Grocery API calls
│   │   ├── pantry.ts           # Pantry API calls
│   │   ├── meals.ts            # Meals API calls
│   │   ├── household.ts        # Household API calls
│   │   ├── weather.ts          # Weather API calls
│   │   └── dashboard.ts        # Dashboard insights API calls
│   ├── adapters/                # Data transformation layer
│   │   └── groceryAdapters.ts
│   ├── utils/                   # Utility functions
│   │   ├── contextDetection.ts # Context detection (time of day, shopping days)
│   │   └── dismissedItems.ts   # Dismissed items management (sessionStorage)
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # General utility functions
│   └── mockData.ts              # Mock data for development
├── docs/                        # Project documentation
│   ├── DEPLOYMENT_CHECKLIST.md  # Deployment guide
│   ├── RAILWAY_BACKEND_DEPLOYMENT.md
│   ├── PRODUCTION_DATABASE_VERIFICATION.md
│   ├── INTEGRATION_STATUS.md
│   └── ...                      # Additional documentation
├── tasks/                       # Task documentation
├── railway.json                 # Railway deployment configuration
├── railway-setup-commands.sh    # Railway setup helper
├── middleware.ts                # Next.js middleware (Clerk)
└── package.json                 # Frontend dependencies
```

## 🎨 Design System

### Color Palette

- **Primary (Green)**: `#059669` - Actions, active states
- **Secondary (Blue)**: `#3B82F6` - Accents, information
- **Success (Green)**: `#10B981` - Success messages, Produce category
- **Warning (Yellow)**: `#F59E0B` - Warnings, low stock alerts
- **Danger (Red)**: `#EF4444` - Errors, Meat category

### Typography

- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, 2xl-3xl on mobile, 3xl-4xl on desktop
- **Body**: Regular, 14px-16px

### Touch Targets

- All interactive elements meet WCAG 2.1 minimum touch target size of 44×44px
- Optimized for mobile-first experience
- Large, easy-to-tap checkboxes and buttons

## 📱 Responsive Design

The app is fully responsive and optimized for:

- **Mobile**: 375px+ (iPhone SE and up)
- **Tablet**: 768px+ (iPad and similar)
- **Desktop**: 1024px+ (laptops and desktops)

### Mobile-First Features

- Bottom navigation bar for easy thumb access
- Full-width buttons on mobile
- Stacked layouts that expand on larger screens
- Scrollable calendar view for meal planner
- Touch-friendly 44×44px minimum touch targets

## 🧪 Testing

The project uses Jest and React Testing Library for unit and integration tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- **Frontend**: UI components, feature components, API adapters, utility functions
- **Backend**: Models, routes, middleware, database operations
- **Integration**: End-to-end API communication with type safety
- **TDD Approach**: Tests written first, then implementation follows

### Backend Testing

```bash
# Run backend tests
cd backend
source venv/bin/activate
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

### Code Quality

**Frontend:**

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint -- --fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Run tests
npm test

# Run tests in CI mode
npm run test:ci
```

**Backend:**

```bash
cd backend
source venv/bin/activate

# Run linting (flake8)
flake8 . --exclude=venv,alembic/versions,__pycache__,.pytest_cache --max-line-length=100

# Format code with Black
black --line-length 100 .

# Check formatting
black --check --line-length 100 .

# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=html
```

### Continuous Integration

The project uses GitHub Actions for automated testing and linting:

- **Frontend Testing**: Jest tests run on every push and pull request
- **Backend Testing**: Pytest tests (238+ tests) validate all API endpoints and models
- **Frontend Linting**: ESLint checks ensure TypeScript/React code quality
- **Backend Linting**: Flake8 validates Python code style and imports
- **Code Formatting**: Prettier (frontend) and Black (backend) ensure consistent formatting
- **Test Coverage**: Comprehensive test suites for both frontend and backend
- **CI Pipeline**: All checks must pass before code can be merged

**Pre-commit Checklist:**
Before committing and pushing, ensure:

- ✅ All frontend tests pass (`npm test`)
- ✅ All backend tests pass (`pytest`)
- ✅ Frontend linting passes (`npm run lint`)
- ✅ Backend linting passes (`flake8`)
- ✅ Code is properly formatted (`npm run format:check` and `black --check`)

All tests, linting, and formatting checks must pass before code can be merged.

## 🛠️ Built With

### Frontend

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and better DX
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React](https://react.dev/)** - UI library
- **[Clerk](https://clerk.com/)** - Authentication and user management
- **[Jest](https://jestjs.io/)** - Testing framework
- **[React Testing Library](https://testing-library.com/react)** - Component testing

### Backend

- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[SQLAlchemy](https://www.sqlalchemy.org/)** - SQL toolkit and ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Production database
- **[Alembic](https://alembic.sqlalchemy.org/)** - Database migration tool
- **[Pydantic](https://pydantic.dev/)** - Data validation using Python type hints
- **[Pytest](https://pytest.org/)** - Python testing framework
- **[Anthropic Claude](https://www.anthropic.com/)** - AI-powered meal planning assistant
- **[api.weather.gov](https://www.weather.gov/documentation/services-web-api)** - National Weather Service API for forecasts

## 🏛️ Architecture

### API Design

- **RESTful API** with FastAPI and automatic OpenAPI documentation
- **Type-safe** communication between frontend and backend
- **Adapter Pattern** for data transformation between API and UI layers
- **Authentication** via Clerk with JWT token validation
- **Database** migrations with Alembic for schema evolution
- **Automatic Migrations**: Database migrations run automatically on deployment

### Data Flow

```
Frontend (Next.js) → API Client → Backend (FastAPI) → Database (PostgreSQL)
                  ↖ Adapters ↗
```

### Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Railway         │    │   PostgreSQL    │
│   (Next.js)      │◄──►│   Backend API     │◄──►│   Database      │
│   (Vercel)       │    │   FastAPI         │    │   (Managed)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Design Patterns

- **Repository Pattern**: Clean data access layer
- **Adapter Pattern**: Transform API responses to frontend types
- **Middleware Pattern**: Authentication and permission handling
- **Test-Driven Development**: Write tests first, implement second
- **Migration-First**: Database schema changes via Alembic migrations

### Database Migrations

Migrations run automatically on every deployment:

1. **Pre-deployment**: Run `backend/pre_deploy_check.sh` to verify migrations
2. **Deployment**: `start.sh` automatically runs `alembic upgrade head`
3. **Verification**: Check Railway logs and run `railway run alembic current`

See [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for detailed procedures.

## 📋 Current Status

This is a **production-ready full-stack application** with complete backend integration. Current implementation status:

### ✅ Completed Features

- **Backend API**: Complete FastAPI backend with PostgreSQL database
- **Authentication**: Clerk integration for user management
- **Dashboard**: Fully redesigned with actionable insights and smart suggestions:
  - Context-aware dashboard layout (morning planning, shopping, routine review)
  - Urgent action items for low stock and expiring items
  - Smart suggestions engine with personalized recommendations
  - Insights display with shopping efficiency, meal planning coverage, and pantry health
  - Quick actions and recent lists sections
  - Session-based dismissed items management
- **Grocery Lists**: Complete backend integration with sorting, filtering, and archiving
- **Meal Planner**: Full backend integration with meal-to-grocery-list generation, meal categories (Normal/Quick Meal/Eat Out), delete confirmation modal, and **AI-powered meal planning assistant** with Claude integration
- **Pantry Inventory**: Complete backend integration with low-stock alerts and grocery list generation (create new lists or add to existing lists)
- **Household Management**: Full backend integration with member roles and preferences
- **Weather Integration**: 7-day weather forecasts with zip code preferences and caching
- **Database Models**: Complete schema for all entities with migrations
- **API Client**: Type-safe frontend API layer with error handling
- **Dashboard Insights API**: New backend endpoint (`/api/dashboard/insights`) aggregating urgent items, suggestions, and statistics
- **Context Detection**: Utilities for detecting time of day, day of week, and shopping patterns
- **Testing**: Comprehensive test suites for both frontend and backend
- **CI/CD**: GitHub Actions pipeline for automated testing and linting
- **Deployment**: Railway backend deployment with automatic migrations
- **Database Migrations**: Automatic migration system with pre-deployment checks

### 🚀 Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Railway with PostgreSQL
- **Database Migrations**: Run automatically on every deployment via `start.sh`
- **Health Monitoring**: Health check endpoints and logging

See [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for deployment procedures.

### 🎯 Future Enhancements

- [ ] Real-time collaboration with WebSockets
- [ ] Push notifications for expiring items
- [ ] Recipe database integration
- [ ] Barcode scanning for pantry items
- [ ] Shopping list sharing via QR codes
- [ ] Mobile app (React Native)
- [ ] Export/import functionality
- [ ] Meal plan templates
- [ ] Enhanced weather-based meal recommendations (basic weather awareness now available via AI assistant)
- [ ] Multiple location support for weather forecasts
- [ ] Advanced analytics and trend tracking
- [ ] Customizable dashboard widgets
- [ ] Machine learning-based shopping predictions

## 🎯 Target Users

**Busy parents** who need to:

- Efficiently plan weekly meals for their family
- Manage grocery shopping without forgetting items
- Keep track of pantry inventory to reduce waste
- Coordinate meal planning and shopping with their partner
- Make weather-informed meal planning decisions

## 🤝 Contributing

Contributions are welcome! This is an active full-stack project with both frontend and backend components.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Set up both frontend and backend development environments
4. Make your changes and write tests (we use TDD!)
5. Run the test suites: `npm test` (frontend) and `pytest` (backend)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality Standards

- **Frontend**: TypeScript, ESLint, Prettier, Jest tests required
- **Backend**: Python type hints, Pytest tests required
- **TDD Approach**: Write tests first, then implement features
- **API Integration**: Use the adapter pattern for data transformation
- **Migrations**: Always create Alembic migrations for schema changes
- **Pre-commit**: Run `pre_deploy_check.sh` before deploying database changes

### Development Workflow

1. **Write tests first** (TDD approach)
2. **Implement feature**
3. **Run all checks before committing**:
   - Frontend tests: `npm test`
   - Backend tests: `cd backend && source venv/bin/activate && pytest`
   - Frontend linting: `npm run lint`
   - Backend linting: `cd backend && source venv/bin/activate && flake8 . --exclude=venv,alembic/versions,__pycache__,.pytest_cache --max-line-length=100`
   - Frontend formatting: `npm run format:check`
   - Backend formatting: `cd backend && source venv/bin/activate && black --check --line-length 100 .`
4. **Fix any issues** found by linting or formatting
5. **Format code**: `npm run format` (frontend) and `black --line-length 100 .` (backend)
6. **For database changes**: Create migration, test locally, run pre-deploy check
7. **Commit and push**: Migrations run automatically on Railway deployment

**Quick Pre-commit Check:**

```bash
# Frontend
npm test && npm run lint && npm run format:check

# Backend
cd backend && source venv/bin/activate && \
  pytest && \
  flake8 . --exclude=venv,alembic/versions,__pycache__,.pytest_cache --max-line-length=100 && \
  black --check --line-length 100 .
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- Font from [Google Fonts](https://fonts.google.com/)
- Design inspiration from modern productivity apps
- Built with ❤️ for busy parents everywhere

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

## 📚 Additional Documentation

- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) - Guide for deploying database updates
- [Railway Backend Deployment](docs/RAILWAY_BACKEND_DEPLOYMENT.md) - Backend deployment guide
- [Production Database Verification](docs/PRODUCTION_DATABASE_VERIFICATION.md) - Database schema verification
- [Integration Status](docs/INTEGRATION_STATUS.md) - Current integration status
- [CORS Configuration](docs/CORS_CONFIGURATION.md) - CORS troubleshooting guide
- [Weather API Integration](docs/prd/prd-weather-api-integration.md) - Weather feature PRD and documentation
- [Weather API Testing](docs/WEATHER_API_TESTING.md) - Weather API testing guide
- [Increasing Jest Coverage](docs/INCREASING_JEST_COVERAGE.md) - Guide for improving test coverage
- [Sequence Diagram](docs/SEQUENCE_DIAGRAM.md) - Application flow and architecture diagrams

## 🔧 Development Tools

- **Pre-deployment Check**: `cd backend && ./pre_deploy_check.sh`
- **Schema Verification**: `railway run python backend/verify_schema.py`
- **Migration Status**: `railway run alembic current`
- **View Logs**: `railway logs`

---

**Note**: This is a production-ready full-stack application with complete backend integration. All features are fully integrated with the backend API. See the [Integration Status](docs/INTEGRATION_STATUS.md) for detailed progress.
