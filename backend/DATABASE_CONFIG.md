# Database Configuration Guide

## Overview
This application is configured to use:
- **SQLite** for local development (default)
- **PostgreSQL** for development and production servers

## Local Development (SQLite)
The default configuration uses SQLite, which requires no additional setup:
- Database file: `grocery_app.db` (created automatically)
- Connection string: `sqlite:///./grocery_app.db`

## Development/Production Servers (PostgreSQL)
To use PostgreSQL, set the `DATABASE_URL` environment variable:

### Development Server
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/grocery_app_dev"
```

### Production Server
```bash
export DATABASE_URL="postgresql://username:password@prod-host:5432/grocery_app_prod"
```

## Environment Variables
Create a `.env` file in the backend directory with:

```env
# For local development (default)
DATABASE_URL=sqlite:///./grocery_app.db

# For PostgreSQL (uncomment and modify as needed)
# DATABASE_URL=postgresql://username:password@host:5432/database_name

# Other configuration
ENVIRONMENT=development
DEBUG=true
CLERK_SECRET_KEY=your_key_here
CLERK_PUBLISHABLE_KEY=your_key_here
```

## Database Migrations
Run migrations with Alembic:
```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Notes
- SQLite configuration includes `check_same_thread=False` for FastAPI compatibility
- PostgreSQL configuration includes connection pooling settings
- The database engine automatically detects the database type from the URL
