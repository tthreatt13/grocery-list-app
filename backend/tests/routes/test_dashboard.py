"""Tests for dashboard insights API endpoint."""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


@pytest.fixture
def authenticated_client(client, sample_user):
    """Create an authenticated test client."""
    from middleware.auth import get_current_user
    from main import app

    def override_get_current_user():
        return sample_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    yield client

    app.dependency_overrides.clear()


class TestGetDashboardInsights:
    """Tests for GET /api/dashboard/insights endpoint."""

    def test_get_dashboard_insights_success(
        self, authenticated_client, sample_user, sample_household, sample_grocery_list, db_session
    ):
        """Test getting dashboard insights with all data."""
        # Create pantry items with different states
        from models.pantry_item import PantryItem

        # Item expiring soon (within 5 days)
        expiring_item = PantryItem(
            household_id=sample_household.id,
            name="Milk",
            quantity="1 gallon",
            category="Dairy",
            expiration_date=datetime.utcnow() + timedelta(days=3),
        )

        # Item with low stock
        low_stock_item = PantryItem(
            household_id=sample_household.id,
            name="Flour",
            quantity="0.5",
            category="Pantry",
            low_stock_threshold=1.0,
        )

        # Normal item
        normal_item = PantryItem(
            household_id=sample_household.id,
            name="Sugar",
            quantity="2 lbs",
            category="Pantry",
        )

        db_session.add(expiring_item)
        db_session.add(low_stock_item)
        db_session.add(normal_item)
        db_session.commit()

        response = authenticated_client.get("/api/dashboard/insights")

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "urgent_items" in data
        assert "suggestions" in data
        assert "stats" in data

        # Check urgent items
        urgent_items = data["urgent_items"]
        assert isinstance(urgent_items, list)
        # Should include expiring items and low stock items
        assert len(urgent_items) >= 2

        # Check suggestions
        suggestions = data["suggestions"]
        assert isinstance(suggestions, list)

        # Check stats
        stats = data["stats"]
        assert isinstance(stats, dict)
        assert "total_lists" in stats
        assert "total_items" in stats
        assert "completed_items" in stats
        assert "low_stock_count" in stats
        assert "expiring_soon_count" in stats
        assert "meals_this_week" in stats

    def test_get_dashboard_insights_empty_data(self, authenticated_client, sample_user, db_session):
        """Test getting dashboard insights when no data exists."""
        response = authenticated_client.get("/api/dashboard/insights")

        assert response.status_code == 200
        data = response.json()

        assert "urgent_items" in data
        assert "suggestions" in data
        assert "stats" in data

        # Should return empty lists but valid structure
        assert data["urgent_items"] == []
        assert isinstance(data["suggestions"], list)
        assert data["stats"]["total_lists"] == 0
        assert data["stats"]["total_items"] == 0
        assert data["stats"]["low_stock_count"] == 0
        assert data["stats"]["expiring_soon_count"] == 0

    def test_get_dashboard_insights_expiring_items(
        self, authenticated_client, sample_user, sample_household, db_session
    ):
        """Test that expiring items are correctly identified."""
        from models.pantry_item import PantryItem

        # Item expiring in 1 day (should be included)
        expiring_today = PantryItem(
            household_id=sample_household.id,
            name="Bread",
            quantity="1 loaf",
            expiration_date=datetime.utcnow() + timedelta(days=1),
        )

        # Item expiring in 5 days (should be included)
        expiring_soon = PantryItem(
            household_id=sample_household.id,
            name="Yogurt",
            quantity="4 containers",
            expiration_date=datetime.utcnow() + timedelta(days=5),
        )

        # Item expiring in 7 days (should NOT be included)
        expiring_later = PantryItem(
            household_id=sample_household.id,
            name="Cheese",
            quantity="1 block",
            expiration_date=datetime.utcnow() + timedelta(days=7),
        )

        db_session.add(expiring_today)
        db_session.add(expiring_soon)
        db_session.add(expiring_later)
        db_session.commit()

        response = authenticated_client.get("/api/dashboard/insights")

        assert response.status_code == 200
        data = response.json()

        urgent_items = data["urgent_items"]
        expiring_item_names = [
            item["name"] for item in urgent_items if item["type"] == "expiring_soon"
        ]

        assert "Bread" in expiring_item_names
        assert "Yogurt" in expiring_item_names
        assert "Cheese" not in expiring_item_names

    def test_get_dashboard_insights_low_stock_items(
        self, authenticated_client, sample_user, sample_household, db_session
    ):
        """Test that low stock items are correctly identified."""
        from models.pantry_item import PantryItem

        # Item below threshold
        low_stock = PantryItem(
            household_id=sample_household.id,
            name="Rice",
            quantity="0.5",
            category="Pantry",
            low_stock_threshold=1.0,
        )

        # Item above threshold
        normal_stock = PantryItem(
            household_id=sample_household.id,
            name="Pasta",
            quantity="2.0",
            category="Pantry",
            low_stock_threshold=1.0,
        )

        # Item without threshold (should not be included)
        no_threshold = PantryItem(
            household_id=sample_household.id,
            name="Salt",
            quantity="1",
            category="Pantry",
        )

        db_session.add(low_stock)
        db_session.add(normal_stock)
        db_session.add(no_threshold)
        db_session.commit()

        response = authenticated_client.get("/api/dashboard/insights")

        assert response.status_code == 200
        data = response.json()

        urgent_items = data["urgent_items"]
        low_stock_item_names = [
            item["name"] for item in urgent_items if item["type"] == "low_stock"
        ]

        assert "Rice" in low_stock_item_names
        assert "Pasta" not in low_stock_item_names
        assert "Salt" not in low_stock_item_names

    def test_get_dashboard_insights_stats_calculation(
        self,
        authenticated_client,
        sample_user,
        sample_household,
        sample_grocery_list,
        sample_grocery_items,
        db_session,
    ):
        """Test that stats are correctly calculated."""
        response = authenticated_client.get("/api/dashboard/insights")

        assert response.status_code == 200
        data = response.json()

        stats = data["stats"]
        assert stats["total_lists"] == 1
        assert stats["total_items"] == 3
        assert stats["completed_items"] == 1  # One item is checked

