"""Pytest configuration and fixtures for backend tests."""

import pytest
import sys
from pathlib import Path
from typing import Generator

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from config import settings
from database import Base, get_db
from main import app
from tests.jwt_test_keys import TEST_PUBLIC_KEY_PEM


@pytest.fixture(scope="session", autouse=True)
def configure_test_jwt_verification():
    """Verify route tokens with the in-process RSA key instead of Clerk JWKS."""
    previous_environment = settings.environment
    previous_key = settings.clerk_test_jwt_public_key
    object.__setattr__(settings, "environment", "test")
    object.__setattr__(settings, "clerk_test_jwt_public_key", TEST_PUBLIC_KEY_PEM)
    yield
    object.__setattr__(settings, "environment", previous_environment)
    object.__setattr__(settings, "clerk_test_jwt_public_key", previous_key)


@pytest.fixture(scope="function")
def db_engine():
    """Create an in-memory SQLite database engine for testing."""
    from sqlalchemy import event

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign key constraints in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a database session for testing."""
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestSessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """Create a FastAPI test client with overridden database dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# Sample data fixtures for testing
@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    from models.user import User

    user = User(
        clerk_user_id="test_clerk_user_123", email="test@example.com", name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_household(db_session, sample_user):
    """Create a sample household for testing."""
    from models.household import Household
    from models.household_member import HouseholdMember

    household = Household(name="Test Household", created_by=sample_user.id)
    db_session.add(household)
    db_session.commit()
    db_session.refresh(household)

    # Add user as household member (admin role)
    member = HouseholdMember(
        household_id=household.id, user_id=sample_user.id, role="admin"
    )
    db_session.add(member)
    db_session.commit()

    return household


@pytest.fixture
def sample_grocery_list(db_session, sample_household, sample_user):
    """Create a sample grocery list for testing."""
    from models.grocery_list import GroceryList

    grocery_list = GroceryList(
        household_id=sample_household.id,
        name="Weekly Groceries",
        created_by=sample_user.id,
    )
    db_session.add(grocery_list)
    db_session.commit()
    db_session.refresh(grocery_list)
    return grocery_list


@pytest.fixture
def sample_grocery_items(db_session, sample_grocery_list):
    """Create sample grocery items for testing."""
    from models.grocery_item import GroceryItem

    items = [
        GroceryItem(
            list_id=sample_grocery_list.id,
            name="Apples",
            quantity="2 lbs",
            category="Produce",
            notes="Organic if possible",
            checked=False,
        ),
        GroceryItem(
            list_id=sample_grocery_list.id,
            name="Milk",
            quantity="1 gallon",
            category="Dairy",
            checked=True,
        ),
        GroceryItem(
            list_id=sample_grocery_list.id,
            name="Bananas",
            quantity="1 bunch",
            category="Produce",
            checked=False,
        ),
    ]

    for item in items:
        db_session.add(item)
    db_session.commit()

    for item in items:
        db_session.refresh(item)

    return items


@pytest.fixture
def sample_meals(db_session, sample_household):
    """Create sample meals for testing."""
    from models.meal import Meal
    from datetime import date

    week_start = date(2024, 1, 1)  # Monday

    meals = [
        Meal(
            household_id=sample_household.id,
            meal_type="breakfast",
            day_of_week=0,  # Monday
            week_start_date=week_start,
            name="Pancakes",
            ingredients="flour, eggs, milk, butter",
            notes="Kids' favorite",
        ),
        Meal(
            household_id=sample_household.id,
            meal_type="dinner",
            day_of_week=0,  # Monday
            week_start_date=week_start,
            name="Spaghetti Bolognese",
            ingredients="pasta, ground beef, tomato sauce, onions, garlic",
            notes="Family dinner",
        ),
        Meal(
            household_id=sample_household.id,
            meal_type="lunch",
            day_of_week=2,  # Wednesday
            week_start_date=week_start,
            name="Chicken Salad",
            ingredients="chicken breast, lettuce, tomatoes, dressing",
        ),
    ]

    for meal in meals:
        db_session.add(meal)
    db_session.commit()

    for meal in meals:
        db_session.refresh(meal)

    return meals
