"""Tests for grocery list API endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestGetGroceryLists:
    """Tests for GET /api/grocery-lists endpoint."""

    def test_get_all_grocery_lists_success(
        self, client, sample_grocery_list, sample_user
    ):
        """Test getting all grocery lists for a user's households."""
        response = client.get("/api/grocery-lists")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["name"] == "Weekly Groceries"
        assert data[0]["household_id"] == sample_grocery_list.household_id
        assert "is_archived" in data[0]
        assert data[0]["is_archived"] is False

    def test_get_empty_grocery_lists(self, client, db_session):
        """Test getting grocery lists when none exist."""
        response = client.get("/api/grocery-lists")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestGetGroceryListById:
    """Tests for GET /api/grocery-lists/{list_id} endpoint."""

    def test_get_grocery_list_by_id_success(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test getting a single grocery list with its items."""
        response = client.get(f"/api/grocery-lists/{sample_grocery_list.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_grocery_list.id
        assert data["name"] == "Weekly Groceries"
        assert "items" in data
        assert len(data["items"]) == 3
        assert "is_archived" in data
        assert data["is_archived"] is False

        # Check first item details
        items = sorted(data["items"], key=lambda x: x["name"])
        assert items[0]["name"] == "Apples"
        assert items[0]["category"] == "Produce"
        assert items[0]["checked"] is False

    def test_get_grocery_list_not_found(self, client):
        """Test getting a non-existent grocery list."""
        response = client.get("/api/grocery-lists/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestCreateGroceryList:
    """Tests for POST /api/grocery-lists endpoint."""

    def test_create_grocery_list_success(self, client, sample_household, sample_user):
        """Test creating a new grocery list."""
        payload = {"name": "Weekend Shopping", "household_id": sample_household.id}

        response = client.post("/api/grocery-lists", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Weekend Shopping"
        assert data["household_id"] == sample_household.id
        assert "id" in data
        assert "created_at" in data
        assert data["is_archived"] is False

    def test_create_grocery_list_invalid_household(self, client):
        """Test creating a grocery list with non-existent household."""
        payload = {"name": "Test List", "household_id": 99999}

        response = client.post("/api/grocery-lists", json=payload)

        assert response.status_code == 404
        assert "household" in response.json()["detail"].lower()

    def test_create_grocery_list_missing_name(self, client, sample_household):
        """Test creating a grocery list without a name."""
        payload = {"household_id": sample_household.id}

        response = client.post("/api/grocery-lists", json=payload)

        assert response.status_code == 422

    def test_create_grocery_list_empty_name(self, client, sample_household):
        """Test creating a grocery list with empty name."""
        payload = {"name": "", "household_id": sample_household.id}

        response = client.post("/api/grocery-lists", json=payload)

        assert response.status_code == 422


class TestUpdateGroceryList:
    """Tests for PUT /api/grocery-lists/{list_id} endpoint."""

    def test_update_grocery_list_name_success(self, client, sample_grocery_list):
        """Test updating grocery list name."""
        payload = {"name": "Updated Weekly List"}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Weekly List"
        assert data["id"] == sample_grocery_list.id
        assert "is_archived" in data

    def test_update_grocery_list_not_found(self, client):
        """Test updating a non-existent grocery list."""
        payload = {"name": "Updated List"}

        response = client.put("/api/grocery-lists/99999", json=payload)

        assert response.status_code == 404

    def test_update_grocery_list_empty_name(self, client, sample_grocery_list):
        """Test updating grocery list with empty name."""
        payload = {"name": ""}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}", json=payload
        )

        assert response.status_code == 422


class TestArchiveGroceryList:
    """Tests for archiving/unarchiving grocery lists via PUT endpoint."""

    def test_archive_grocery_list_success(self, client, sample_grocery_list):
        """Test archiving a grocery list."""
        payload = {"is_archived": True}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] is True
        assert data["id"] == sample_grocery_list.id

        # Verify it's archived in the database
        get_response = client.get(f"/api/grocery-lists/{sample_grocery_list.id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["is_archived"] is True

    def test_unarchive_grocery_list_success(self, client, db_session, sample_user):
        """Test unarchiving a grocery list."""
        from models.household import Household
        from models.grocery_list import GroceryList

        household = Household(name="Test Household", created_by=sample_user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id,
            name="Archived List",
            created_by=sample_user.id,
            is_archived=True,
        )
        db_session.add(grocery_list)
        db_session.commit()

        payload = {"is_archived": False}

        response = client.put(f"/api/grocery-lists/{grocery_list.id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] is False
        assert data["id"] == grocery_list.id

        # Verify it's unarchived in the database
        get_response = client.get(f"/api/grocery-lists/{grocery_list.id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["is_archived"] is False

    def test_archive_and_update_name_together(self, client, sample_grocery_list):
        """Test archiving a list and updating its name in the same request."""
        payload = {"name": "Updated Archived List", "is_archived": True}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Archived List"
        assert data["is_archived"] is True


class TestDeleteGroceryList:
    """Tests for DELETE /api/grocery-lists/{list_id} endpoint."""

    def test_delete_grocery_list_success(self, client, sample_grocery_list):
        """Test deleting a grocery list."""
        response = client.delete(f"/api/grocery-lists/{sample_grocery_list.id}")

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verify list is deleted
        get_response = client.get(f"/api/grocery-lists/{sample_grocery_list.id}")
        assert get_response.status_code == 404

    def test_delete_grocery_list_not_found(self, client):
        """Test deleting a non-existent grocery list."""
        response = client.delete("/api/grocery-lists/99999")

        assert response.status_code == 404


class TestCreateGroceryItem:
    """Tests for POST /api/grocery-lists/{list_id}/items endpoint."""

    def test_create_grocery_item_success(self, client, sample_grocery_list):
        """Test adding an item to a grocery list."""
        payload = {
            "name": "Bread",
            "quantity": "2 loaves",
            "category": "Bakery",
            "notes": "Whole wheat",
            "checked": False,
        }

        response = client.post(
            f"/api/grocery-lists/{sample_grocery_list.id}/items", json=payload
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Bread"
        assert data["quantity"] == "2 loaves"
        assert data["category"] == "Bakery"
        assert data["list_id"] == sample_grocery_list.id
        assert "id" in data

    def test_create_grocery_item_minimal(self, client, sample_grocery_list):
        """Test adding an item with only required fields."""
        payload = {"name": "Eggs"}

        response = client.post(
            f"/api/grocery-lists/{sample_grocery_list.id}/items", json=payload
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Eggs"
        assert data["checked"] is False

    def test_create_grocery_item_invalid_list(self, client):
        """Test adding an item to non-existent list."""
        payload = {"name": "Bread"}

        response = client.post("/api/grocery-lists/99999/items", json=payload)

        assert response.status_code == 404

    def test_create_grocery_item_missing_name(self, client, sample_grocery_list):
        """Test adding an item without a name."""
        payload = {}

        response = client.post(
            f"/api/grocery-lists/{sample_grocery_list.id}/items", json=payload
        )

        assert response.status_code == 422


class TestUpdateGroceryItem:
    """Tests for PUT /api/grocery-lists/{list_id}/items/{item_id} endpoint."""

    def test_update_grocery_item_success(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test updating a grocery item."""
        item = sample_grocery_items[0]
        payload = {"name": "Green Apples", "quantity": "3 lbs", "checked": True}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}/items/{item.id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Green Apples"
        assert data["quantity"] == "3 lbs"
        assert data["checked"] is True

    def test_update_grocery_item_checked_only(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test updating only the checked status."""
        item = sample_grocery_items[0]
        payload = {"checked": True}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}/items/{item.id}", json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["checked"] is True
        assert data["name"] == item.name  # Name unchanged

    def test_update_grocery_item_not_found(self, client, sample_grocery_list):
        """Test updating a non-existent item."""
        payload = {"name": "Updated"}

        response = client.put(
            f"/api/grocery-lists/{sample_grocery_list.id}/items/99999", json=payload
        )

        assert response.status_code == 404

    def test_update_grocery_item_wrong_list(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test updating an item with wrong list ID."""
        item = sample_grocery_items[0]
        payload = {"name": "Updated"}

        response = client.put(f"/api/grocery-lists/99999/items/{item.id}", json=payload)

        assert response.status_code == 404


class TestDeleteGroceryItem:
    """Tests for DELETE /api/grocery-lists/{list_id}/items/{item_id} endpoint."""

    def test_delete_grocery_item_success(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test deleting a grocery item."""
        item = sample_grocery_items[0]

        response = client.delete(
            f"/api/grocery-lists/{sample_grocery_list.id}/items/{item.id}"
        )

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    def test_delete_grocery_item_not_found(self, client, sample_grocery_list):
        """Test deleting a non-existent item."""
        response = client.delete(
            f"/api/grocery-lists/{sample_grocery_list.id}/items/99999"
        )

        assert response.status_code == 404


class TestFilterGroceryItems:
    """Tests for GET /api/grocery-lists/{list_id}/items?category={category} endpoint."""

    def test_filter_items_by_category(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test filtering items by category."""
        response = client.get(
            f"/api/grocery-lists/{sample_grocery_list.id}/items",
            params={"category": "Produce"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2  # Apples and Bananas
        for item in data:
            assert item["category"] == "Produce"

    def test_filter_items_no_matches(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test filtering with category that has no items."""
        response = client.get(
            f"/api/grocery-lists/{sample_grocery_list.id}/items",
            params={"category": "Frozen"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_all_items_no_filter(
        self, client, sample_grocery_list, sample_grocery_items
    ):
        """Test getting all items without filter."""
        response = client.get(f"/api/grocery-lists/{sample_grocery_list.id}/items")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_filter_items_list_not_found(self, client):
        """Test filtering items for non-existent list."""
        response = client.get("/api/grocery-lists/99999/items")

        assert response.status_code == 404
