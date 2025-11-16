# Grocery List App

A modern, full-stack grocery list and meal planning application built for busy parents. Plan your weekly meals, manage your grocery lists, track pantry inventory, and coordinate with household members - all in one beautiful interface with real-time backend integration.

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🛒 Grocery Lists
- Create and manage multiple grocery lists
- Add items with quantities, categories, and notes
- Check off items as you shop with satisfying strike-through
- Filter items by category (Produce, Dairy, Meat, Bakery, etc.)
- Share lists with household members
- Track shopping progress with visual progress bars

### 🍳 Weekly Meal Planner
- Plan meals for the entire week (Breakfast, Lunch, Dinner)
- Visual calendar view with easy navigation between weeks
- Add meals with ingredients and notes
- Generate grocery lists automatically from your meal plan
- Mobile-optimized scrollable calendar
- Quick stats showing meals planned and ingredients needed

### 🏺 Pantry Inventory
- Keep track of all pantry items in one place
- Set expiration dates and get alerts for items expiring soon
- Low stock warnings with customizable thresholds
- Search and filter by category
- Visual grid layout with item details
- Track when items were added and last updated

### 👨‍👩‍👧‍👦 Household Management
- Invite family members to collaborate
- Assign roles (Admin, Member, Viewer)
- See who last edited shared lists
- View all shared grocery lists in one place
- Real-time collaboration with backend integration

## 🚀 Getting Started

### Prerequisites

**Frontend:**
- Node.js 18.0 or higher
- npm or yarn package manager

**Backend:**
- Python 3.9 or higher
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

# Set up the database
alembic upgrade head

# Start the backend server
uvicorn main:app --reload
```

3. **Set up the frontend:**
```bash
# In a new terminal, from the project root
npm install

# Set up environment variables (copy and modify as needed)
cp .env.example .env.local

# Start the frontend development server
npm run dev
```

4. **Access the application:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🏗️ Project Structure

```
grocery-list-app/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Home/Dashboard (✅ Backend integrated)
│   ├── grocery-lists/           # Grocery lists pages
│   ├── pantry/                  # Pantry inventory page
│   ├── meal-planner/            # Weekly meal planner page
│   ├── household/               # Household management page
│   └── sign-in/[[...sign-in]]/  # Clerk authentication
├── backend/                      # FastAPI backend
│   ├── main.py                  # FastAPI application entry point
│   ├── models/                  # SQLAlchemy database models
│   ├── routes/                  # API route handlers
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── middleware/              # Authentication & permissions
│   ├── alembic/                 # Database migrations
│   └── tests/                   # Backend test suite
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── grocery/                 # Grocery list components
│   ├── pantry/                  # Pantry components
│   ├── meal-planner/           # Meal planner components
│   ├── household/              # Household components
│   └── layout/                 # Layout components (Nav, etc.)
├── lib/                        # Frontend utilities and helpers
│   ├── api/                    # API client functions
│   ├── adapters/               # Data transformation layer
│   ├── types.ts               # TypeScript type definitions
│   ├── utils.ts               # Utility functions
│   └── mockData.ts            # Mock data for development
├── docs/                       # Project documentation
└── tests/                      # Frontend test suites
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

## 🛠️ Built With

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
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

## 🏛️ Architecture

### API Design
- **RESTful API** with FastAPI and automatic OpenAPI documentation
- **Type-safe** communication between frontend and backend
- **Adapter Pattern** for data transformation between API and UI layers
- **Authentication** via Clerk with JWT token validation
- **Database** migrations with Alembic for schema evolution

### Data Flow
```
Frontend (Next.js) → API Client → Backend (FastAPI) → Database (PostgreSQL)
                  ↖ Adapters ↗
```

### Key Design Patterns
- **Repository Pattern**: Clean data access layer
- **Adapter Pattern**: Transform API responses to frontend types
- **Middleware Pattern**: Authentication and permission handling
- **Test-Driven Development**: Write tests first, implement second

## 📋 Current Status

This is a **full-stack application** with backend integration in progress. Current implementation status:

### ✅ Completed Features
- **Backend API**: Complete FastAPI backend with PostgreSQL database
- **Authentication**: Clerk integration for user management
- **Dashboard**: Fully integrated with backend API (✅ All tests passing)
- **Database Models**: Complete schema for all entities
- **API Client**: Type-safe frontend API layer with error handling
- **Testing**: Comprehensive test suites for both frontend and backend

### 🚧 In Progress
- **Grocery Lists**: Partial backend integration
- **Meal Planner**: Partial backend integration  
- **Household Management**: Partial backend integration
- **Pantry**: Using mock data, backend ready

### 🎯 Next Steps
- [ ] Complete integration for remaining pages
- [ ] Real-time collaboration with WebSockets
- [ ] Push notifications for expiring items
- [ ] Recipe database integration
- [ ] Barcode scanning for pantry items
- [ ] Shopping list sharing via QR codes
- [ ] Mobile app (React Native)

## 🎯 Target Users

**Busy parents** who need to:
- Efficiently plan weekly meals for their family
- Manage grocery shopping without forgetting items
- Keep track of pantry inventory to reduce waste
- Coordinate meal planning and shopping with their partner

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
- **Frontend**: TypeScript, ESLint, Jest tests required
- **Backend**: Python type hints, Black formatting, Pytest tests required
- **TDD Approach**: Write tests first, then implement features
- **API Integration**: Use the adapter pattern for data transformation

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

**Note**: This is a full-stack application with backend integration. The dashboard is fully integrated with the backend API, and other pages are in various stages of integration. See the [Integration Status](docs/INTEGRATION_STATUS.md) for detailed progress.

