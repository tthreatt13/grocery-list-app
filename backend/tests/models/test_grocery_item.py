"""Tests for GroceryItem model."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem


class TestGroceryItemModel:
    """Test cases for GroceryItem model."""

    def test_create_grocery_item_full(self, db_session):
        """Test creating a grocery item with all fields."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(
            list_id=grocery_list.id,
            name="Milk",
            quantity="1 gallon",
            category="Dairy",
            notes="Organic preferred",
            checked=False,
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        assert item.id is not None
        assert item.list_id == grocery_list.id
        assert item.name == "Milk"
        assert item.quantity == "1 gallon"
        assert item.category == "Dairy"
        assert item.notes == "Organic preferred"
        assert item.checked is False
        assert isinstance(item.created_at, datetime)

    def test_create_grocery_item_minimal(self, db_session):
        """Test creating a grocery item with only required fields."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id, name="Bread")
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        assert item.id is not None
        assert item.name == "Bread"
        assert item.quantity is None
        assert item.category is None
        assert item.notes is None
        assert item.checked is False  # Default value

    def test_list_id_required(self, db_session):
        """Test that list_id is required."""
        item = GroceryItem(name="Test Item")
        db_session.add(item)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_name_required(self, db_session):
        """Test that name is required."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id)
        db_session.add(item)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_checked_defaults_to_false(self, db_session):
        """Test that checked defaults to False."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id, name="Test Item")
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        assert item.checked is False

    def test_check_item(self, db_session):
        """Test marking an item as checked."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id, name="Test Item")
        db_session.add(item)
        db_session.commit()

        # Check the item
        item.checked = True
        db_session.commit()
        db_session.refresh(item)

        assert item.checked is True

    def test_grocery_list_relationship(self, db_session):
        """Test the relationship to grocery list."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(household_id=household.id, name="My List", created_by=user.id)
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id, name="Test Item")
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        assert item.grocery_list is not None
        assert item.grocery_list.name == "My List"

    def test_multiple_items_per_list(self, db_session):
        """Test that a list can have multiple items."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item1 = GroceryItem(list_id=grocery_list.id, name="Milk", category="Dairy")
        item2 = GroceryItem(list_id=grocery_list.id, name="Bread", category="Bakery")
        item3 = GroceryItem(list_id=grocery_list.id, name="Apples", category="Produce")
        db_session.add_all([item1, item2, item3])
        db_session.commit()

        items = db_session.query(GroceryItem).filter_by(list_id=grocery_list.id).all()

        assert len(items) == 3
        assert {i.name for i in items} == {"Milk", "Bread", "Apples"}

    def test_filter_by_category(self, db_session):
        """Test filtering items by category."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        dairy1 = GroceryItem(list_id=grocery_list.id, name="Milk", category="Dairy")
        dairy2 = GroceryItem(list_id=grocery_list.id, name="Cheese", category="Dairy")
        produce = GroceryItem(list_id=grocery_list.id, name="Apples", category="Produce")
        db_session.add_all([dairy1, dairy2, produce])
        db_session.commit()

        dairy_items = (
            db_session.query(GroceryItem).filter_by(list_id=grocery_list.id, category="Dairy").all()
        )

        assert len(dairy_items) == 2
        assert {i.name for i in dairy_items} == {"Milk", "Cheese"}

    def test_grocery_item_repr(self, db_session):
        """Test grocery item string representation."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        grocery_list = GroceryList(
            household_id=household.id, name="Weekly List", created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()

        item = GroceryItem(list_id=grocery_list.id, name="Test Item")
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        repr_str = repr(item)
        assert "GroceryItem" in repr_str
        assert "Test Item" in repr_str
