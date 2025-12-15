"""Tests for meal planner routes."""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from datetime import datetime, date

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from models.user import User
from models.household import Household
from models.meal import Meal
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem


class TestMealRoutes:
    """Test cases for meal planner endpoints."""

    def test_get_weekly_meals_success(
        self, db_session, sample_user, sample_household, sample_meals
    ):
        """Test GET /api/meals/week returns meals for specified week."""
        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/meals/week?date=2024-01-01&household_id={sample_household.id}",
            headers={"Authorization": "Bearer valid_token"},
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "meals" in data
        assert len(data["meals"]) == 3
        assert data["week_start_date"] == "2024-01-01"
        assert data["household_id"] == sample_household.id

    def test_get_weekly_meals_no_household_id(
        self, db_session, sample_user, sample_household, sample_meals
    ):
        """Test GET /api/meals/week without household_id returns 422."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            "/api/meals/week?date=2024-01-01",
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 422

    def test_get_weekly_meals_empty_week(
        self, db_session, sample_user, sample_household
    ):
        """Test GET /api/meals/week returns empty list for week with no meals."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/meals/week?date=2024-02-01&household_id={sample_household.id}",
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert len(data["meals"]) == 0

    def test_get_weekly_meals_unauthorized(self):
        """Test GET /api/meals/week without auth token returns 401."""
        client = TestClient(app)
        response = client.get("/api/meals/week?date=2024-01-01&household_id=1")

        assert response.status_code == 401

    def test_get_meal_by_id_success(self, db_session, sample_user, sample_meals):
        """Test GET /api/meals/{meal_id} returns meal details."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal = sample_meals[0]

        client = TestClient(app)
        response = client.get(
            f"/api/meals/{meal.id}", headers={"Authorization": "Bearer valid_token"}
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == meal.id
        assert data["name"] == meal.name
        assert data["meal_type"] == meal.meal_type
        assert data["household_id"] == meal.household_id

    def test_get_meal_by_id_not_found(self, db_session, sample_user):
        """Test GET /api/meals/{meal_id} with invalid ID returns 404."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            "/api/meals/99999", headers={"Authorization": "Bearer valid_token"}
        )

        app.dependency_overrides.clear()

        assert response.status_code == 404

    def test_get_meal_by_id_unauthorized(self):
        """Test GET /api/meals/{meal_id} without auth token returns 401."""
        client = TestClient(app)
        response = client.get("/api/meals/1")

        assert response.status_code == 401

    def test_create_meal_success(self, db_session, sample_user, sample_household):
        """Test POST /api/meals creates a new meal."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal_data = {
            "household_id": sample_household.id,
            "name": "Grilled Chicken",
            "meal_type": "dinner",
            "day_of_week": 3,
            "week_start_date": "2024-01-01",
            "ingredients": "chicken, olive oil, spices",
            "notes": "Marinate for 2 hours",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals",
            json=meal_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Grilled Chicken"
        assert data["meal_type"] == "dinner"
        assert data["day_of_week"] == 3
        assert data["household_id"] == sample_household.id
        assert "id" in data

        # Verify in database
        meal = db_session.query(Meal).filter_by(name="Grilled Chicken").first()
        assert meal is not None
        assert meal.ingredients == "chicken, olive oil, spices"

    def test_create_meal_minimal(self, db_session, sample_user, sample_household):
        """Test POST /api/meals with minimal required fields."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal_data = {
            "household_id": sample_household.id,
            "name": "Quick Sandwich",
            "meal_type": "lunch",
            "day_of_week": 1,
            "week_start_date": "2024-01-01",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals",
            json=meal_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Quick Sandwich"
        assert data["ingredients"] is None
        assert data["notes"] is None

    def test_create_meal_invalid_meal_type(
        self, db_session, sample_user, sample_household
    ):
        """Test POST /api/meals with invalid meal_type returns 422."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal_data = {
            "household_id": sample_household.id,
            "name": "Test Meal",
            "meal_type": "brunch",  # Invalid
            "day_of_week": 1,
            "week_start_date": "2024-01-01",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals",
            json=meal_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 422

    def test_create_meal_invalid_day_of_week(
        self, db_session, sample_user, sample_household
    ):
        """Test POST /api/meals with invalid day_of_week returns 422."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal_data = {
            "household_id": sample_household.id,
            "name": "Test Meal",
            "meal_type": "dinner",
            "day_of_week": 7,  # Invalid (should be 0-6)
            "week_start_date": "2024-01-01",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals",
            json=meal_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 422

    def test_create_meal_unauthorized(self):
        """Test POST /api/meals without auth token returns 401."""
        meal_data = {
            "household_id": 1,
            "name": "Test Meal",
            "meal_type": "dinner",
            "day_of_week": 1,
            "week_start_date": "2024-01-01",
        }

        client = TestClient(app)
        response = client.post("/api/meals", json=meal_data)

        assert response.status_code == 401

    def test_update_meal_success(self, db_session, sample_user, sample_meals):
        """Test PUT /api/meals/{meal_id} updates meal details."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal = sample_meals[0]
        update_data = {"name": "Updated Pancakes", "notes": "Add blueberries"}

        client = TestClient(app)
        response = client.put(
            f"/api/meals/{meal.id}",
            json=update_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Pancakes"
        assert data["notes"] == "Add blueberries"

        # Verify in database
        db_session.refresh(meal)
        assert meal.name == "Updated Pancakes"
        assert meal.notes == "Add blueberries"

    def test_update_meal_partial(self, db_session, sample_user, sample_meals):
        """Test PUT /api/meals/{meal_id} with partial update."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal = sample_meals[0]
        original_name = meal.name
        update_data = {"ingredients": "flour, eggs, milk, butter, vanilla"}

        client = TestClient(app)
        response = client.put(
            f"/api/meals/{meal.id}",
            json=update_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == original_name  # Unchanged
        assert "vanilla" in data["ingredients"]

    def test_update_meal_not_found(self, db_session, sample_user):
        """Test PUT /api/meals/{meal_id} with invalid ID returns 404."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        update_data = {"name": "Updated Name"}

        client = TestClient(app)
        response = client.put(
            "/api/meals/99999",
            json=update_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 404

    def test_update_meal_unauthorized(self):
        """Test PUT /api/meals/{meal_id} without auth token returns 401."""
        update_data = {"name": "Updated Name"}

        client = TestClient(app)
        response = client.put("/api/meals/1", json=update_data)

        assert response.status_code == 401

    def test_delete_meal_success(self, db_session, sample_user, sample_meals):
        """Test DELETE /api/meals/{meal_id} deletes meal."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        meal = sample_meals[0]
        meal_id = meal.id

        client = TestClient(app)
        response = client.delete(
            f"/api/meals/{meal_id}", headers={"Authorization": "Bearer valid_token"}
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

        # Verify deleted from database
        deleted_meal = db_session.query(Meal).filter_by(id=meal_id).first()
        assert deleted_meal is None

    def test_delete_meal_not_found(self, db_session, sample_user):
        """Test DELETE /api/meals/{meal_id} with invalid ID returns 404."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.delete(
            "/api/meals/99999", headers={"Authorization": "Bearer valid_token"}
        )

        app.dependency_overrides.clear()

        assert response.status_code == 404

    def test_delete_meal_unauthorized(self):
        """Test DELETE /api/meals/{meal_id} without auth token returns 401."""
        client = TestClient(app)
        response = client.delete("/api/meals/1")

        assert response.status_code == 401

    def test_generate_grocery_list_success(
        self, db_session, sample_user, sample_household, sample_meals
    ):
        """Test POST /api/meals/generate-grocery-list creates grocery list from meals."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-01-01",
            "household_id": sample_household.id,
            "grocery_list_name": "Week of Jan 1st",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()
        assert "grocery_list_id" in data
        assert data["items_count"] > 0
        assert "message" in data

        # Verify grocery list was created
        grocery_list = (
            db_session.query(GroceryList).filter_by(id=data["grocery_list_id"]).first()
        )
        assert grocery_list is not None
        assert grocery_list.name == "Week of Jan 1st"
        assert grocery_list.household_id == sample_household.id

        # Verify grocery items were created
        items = db_session.query(GroceryItem).filter_by(list_id=grocery_list.id).all()
        assert len(items) > 0

        # Check that ingredients were parsed correctly
        item_names = [item.name.lower() for item in items]
        # At least some ingredients from our sample meals should be present
        assert any(
            "flour" in name or "eggs" in name or "pasta" in name for name in item_names
        )

        # Verify that meal types are preserved
        assert all(item.meal_type is not None for item in items)
        meal_types = {item.meal_type for item in items}
        assert "breakfast" in meal_types
        assert "dinner" in meal_types
        assert "lunch" in meal_types

    def test_generate_grocery_list_no_meals(
        self, db_session, sample_user, sample_household
    ):
        """Test POST /api/meals/generate-grocery-list with no meals in week."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-03-01",  # Week with no meals
            "household_id": sample_household.id,
            "grocery_list_name": "Empty Week",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        # Should succeed but with 0 items
        assert response.status_code == 201
        data = response.json()
        assert data["items_count"] == 0

    def test_generate_grocery_list_default_name(
        self, db_session, sample_user, sample_household, sample_meals
    ):
        """Test POST /api/meals/generate-grocery-list with default list name."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-01-01",
            "household_id": sample_household.id,
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()

        # Verify default name was used
        grocery_list = (
            db_session.query(GroceryList).filter_by(id=data["grocery_list_id"]).first()
        )
        assert "Generated from Meal Plan" in grocery_list.name

    def test_generate_grocery_list_unauthorized(self):
        """Test POST /api/meals/generate-grocery-list without auth token returns 401."""
        request_data = {"week_start_date": "2024-01-01", "household_id": 1}

        client = TestClient(app)
        response = client.post("/api/meals/generate-grocery-list", json=request_data)

        assert response.status_code == 401

    def test_generate_grocery_list_preserves_meal_types(
        self, db_session, sample_user, sample_household, sample_meals
    ):
        """Test that grocery items generated from meals preserve meal type information."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-01-01",
            "household_id": sample_household.id,
            "grocery_list_name": "Meal Type Test",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()

        # Verify grocery items were created with correct meal types
        items = (
            db_session.query(GroceryItem)
            .filter_by(list_id=data["grocery_list_id"])
            .all()
        )

        # Group items by meal type
        items_by_meal_type = {}
        for item in items:
            if item.meal_type not in items_by_meal_type:
                items_by_meal_type[item.meal_type] = []
            items_by_meal_type[item.meal_type].append(item.name.lower())

        # Verify breakfast items have breakfast meal type
        assert "breakfast" in items_by_meal_type
        breakfast_items = items_by_meal_type["breakfast"]
        assert any("flour" in item for item in breakfast_items)
        assert any("eggs" in item for item in breakfast_items)
        assert any("milk" in item for item in breakfast_items)
        assert any("butter" in item for item in breakfast_items)

        # Verify dinner items have dinner meal type
        assert "dinner" in items_by_meal_type
        dinner_items = items_by_meal_type["dinner"]
        assert any("pasta" in item for item in dinner_items)
        assert any("beef" in item for item in dinner_items)
        assert any("sauce" in item for item in dinner_items)

        # Verify lunch items have lunch meal type
        assert "lunch" in items_by_meal_type
        lunch_items = items_by_meal_type["lunch"]
        assert any("chicken" in item for item in lunch_items)
        assert any("lettuce" in item for item in lunch_items)

        # Verify no items have null meal type
        assert all(item.meal_type is not None for item in items)

    def test_generate_grocery_list_mixed_meal_types_same_ingredient(
        self, db_session, sample_user, sample_household
    ):
        """Test that same ingredient from different meal types gets separate entries with correct meal types."""
        from models.meal import Meal
        from datetime import date

        # Create meals with same ingredient but different meal types
        week_start = date(2024, 2, 5)  # Monday
        meals = [
            Meal(
                household_id=sample_household.id,
                meal_type="breakfast",
                day_of_week=0,  # Monday
                week_start_date=week_start,
                name="Breakfast Eggs",
                ingredients="eggs, toast",
            ),
            Meal(
                household_id=sample_household.id,
                meal_type="dinner",
                day_of_week=0,  # Monday
                week_start_date=week_start,
                name="Dinner Eggs",
                ingredients="eggs, rice",
            ),
        ]

        for meal in meals:
            db_session.add(meal)
        db_session.commit()

        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-02-05",
            "household_id": sample_household.id,
            "grocery_list_name": "Mixed Meal Types Test",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()

        # Verify grocery items were created
        items = (
            db_session.query(GroceryItem)
            .filter_by(list_id=data["grocery_list_id"])
            .all()
        )

        # Find all egg items
        egg_items = [item for item in items if "eggs" in item.name.lower()]

        # Should have two egg entries - one for breakfast, one for dinner
        assert len(egg_items) == 2

        meal_types = {item.meal_type for item in egg_items}
        assert meal_types == {"breakfast", "dinner"}

    def test_generate_grocery_list_empty_ingredients_preserves_meal_type(
        self, db_session, sample_user, sample_household
    ):
        """Test that meals with empty ingredients don't create items but other meals still preserve meal types."""
        from models.meal import Meal
        from datetime import date

        week_start = date(2024, 3, 4)  # Monday
        meals = [
            Meal(
                household_id=sample_household.id,
                meal_type="breakfast",
                day_of_week=0,  # Monday
                week_start_date=week_start,
                name="Empty Breakfast",
                ingredients="",  # Empty ingredients
            ),
            Meal(
                household_id=sample_household.id,
                meal_type="lunch",
                day_of_week=0,  # Monday
                week_start_date=week_start,
                name="Sandwich",
                ingredients="bread, ham, cheese",
            ),
        ]

        for meal in meals:
            db_session.add(meal)
        db_session.commit()

        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "week_start_date": "2024-03-04",
            "household_id": sample_household.id,
            "grocery_list_name": "Empty Ingredients Test",
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/generate-grocery-list",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 201
        data = response.json()

        # Verify only lunch items were created (breakfast had empty ingredients)
        items = (
            db_session.query(GroceryItem)
            .filter_by(list_id=data["grocery_list_id"])
            .all()
        )

        # Should only have lunch items
        assert len(items) == 3  # bread, ham, cheese
        assert all(item.meal_type == "lunch" for item in items)

        item_names = [item.name.lower() for item in items]
        assert "bread" in item_names
        assert "ham" in item_names
        assert "cheese" in item_names
