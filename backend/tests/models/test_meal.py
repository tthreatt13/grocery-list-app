"""Tests for Meal model."""

import pytest
from datetime import datetime, date
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household
from models.meal import Meal


class TestMealModel:
    """Test cases for Meal model."""

    def test_create_meal_full(self, db_session):
        """Test creating a meal with all fields."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)  # Monday

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            day_of_week=1,  # Monday
            week_start_date=week_start,
            name="Spaghetti Bolognese",
            ingredients="pasta, ground beef, tomato sauce, onions, garlic",
            notes="Family favorite",
        )
        db_session.add(meal)
        db_session.commit()
        db_session.refresh(meal)

        assert meal.id is not None
        assert meal.household_id == household.id
        assert meal.meal_type == "dinner"
        assert meal.day_of_week == 1
        assert meal.week_start_date == week_start
        assert meal.name == "Spaghetti Bolognese"
        assert "pasta" in meal.ingredients
        assert meal.notes == "Family favorite"
        assert isinstance(meal.created_at, datetime)

    def test_create_meal_minimal(self, db_session):
        """Test creating a meal with only required fields."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            meal_type="lunch",
            day_of_week=3,  # Wednesday
            week_start_date=week_start,
            name="Sandwich",
        )
        db_session.add(meal)
        db_session.commit()
        db_session.refresh(meal)

        assert meal.id is not None
        assert meal.name == "Sandwich"
        assert meal.ingredients is None
        assert meal.notes is None

    def test_household_id_required(self, db_session):
        """Test that household_id is required."""
        week_start = date(2024, 1, 1)

        meal = Meal(
            meal_type="dinner",
            day_of_week=1,
            week_start_date=week_start,
            name="Test Meal",
        )
        db_session.add(meal)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_meal_type_required(self, db_session):
        """Test that meal_type is required."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            day_of_week=1,
            week_start_date=week_start,
            name="Test Meal",
        )
        db_session.add(meal)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_day_of_week_required(self, db_session):
        """Test that day_of_week is required."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            week_start_date=week_start,
            name="Test Meal",
        )
        db_session.add(meal)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_week_start_date_required(self, db_session):
        """Test that week_start_date is required."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            day_of_week=1,
            name="Test Meal",
        )
        db_session.add(meal)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_name_optional(self, db_session):
        """Test that name is optional and meals can be created without a name."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            day_of_week=1,
            week_start_date=week_start,
            meal_category="quick_meal",
        )
        db_session.add(meal)
        db_session.commit()
        db_session.refresh(meal)

        assert meal.id is not None
        assert meal.name is None
        assert meal.meal_category == "quick_meal"

    def test_household_relationship(self, db_session):
        """Test the relationship to household."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="My Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            day_of_week=1,
            week_start_date=week_start,
            name="Test Meal",
        )
        db_session.add(meal)
        db_session.commit()
        db_session.refresh(meal)

        assert meal.household is not None
        assert meal.household.name == "My Household"

    def test_multiple_meals_per_week(self, db_session):
        """Test creating multiple meals for a week."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meals = [
            Meal(
                household_id=household.id,
                meal_type="breakfast",
                day_of_week=1,
                week_start_date=week_start,
                name="Pancakes",
            ),
            Meal(
                household_id=household.id,
                meal_type="lunch",
                day_of_week=1,
                week_start_date=week_start,
                name="Sandwich",
            ),
            Meal(
                household_id=household.id,
                meal_type="dinner",
                day_of_week=1,
                week_start_date=week_start,
                name="Pasta",
            ),
        ]
        db_session.add_all(meals)
        db_session.commit()

        monday_meals = (
            db_session.query(Meal)
            .filter_by(
                household_id=household.id, week_start_date=week_start, day_of_week=1
            )
            .all()
        )

        assert len(monday_meals) == 3
        assert {m.meal_type for m in monday_meals} == {"breakfast", "lunch", "dinner"}

    def test_query_meals_by_week(self, db_session):
        """Test querying meals for a specific week."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week1 = date(2024, 1, 1)
        week2 = date(2024, 1, 8)

        week1_meals = [
            Meal(
                household_id=household.id,
                meal_type="dinner",
                day_of_week=i,
                week_start_date=week1,
                name=f"Week1 Day{i}",
            )
            for i in range(7)
        ]
        week2_meals = [
            Meal(
                household_id=household.id,
                meal_type="dinner",
                day_of_week=i,
                week_start_date=week2,
                name=f"Week2 Day{i}",
            )
            for i in range(7)
        ]
        db_session.add_all(week1_meals + week2_meals)
        db_session.commit()

        week1_results = (
            db_session.query(Meal)
            .filter_by(household_id=household.id, week_start_date=week1)
            .all()
        )

        assert len(week1_results) == 7
        assert all("Week1" in m.name for m in week1_results)

    def test_meal_types(self, db_session):
        """Test different meal types."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)
        meal_types = ["breakfast", "lunch", "dinner", "snack"]

        for i, meal_type in enumerate(meal_types):
            meal = Meal(
                household_id=household.id,
                meal_type=meal_type,
                day_of_week=0,
                week_start_date=week_start,
                name=f"Test {meal_type}",
            )
            db_session.add(meal)

        db_session.commit()

        meals = db_session.query(Meal).filter_by(household_id=household.id).all()

        assert len(meals) == 4
        assert {m.meal_type for m in meals} == set(meal_types)

    def test_meal_repr(self, db_session):
        """Test meal string representation."""
        user = User(
            clerk_user_id="user_123", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        week_start = date(2024, 1, 1)

        meal = Meal(
            household_id=household.id,
            meal_type="dinner",
            day_of_week=1,
            week_start_date=week_start,
            name="Test Meal",
        )
        db_session.add(meal)
        db_session.commit()
        db_session.refresh(meal)

        repr_str = repr(meal)
        assert "Meal" in repr_str
        assert "Test Meal" in repr_str or "dinner" in repr_str
