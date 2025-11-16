"""Tests for PantryItem model."""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household
from models.pantry_item import PantryItem


class TestPantryItemModel:
    """Test cases for PantryItem model."""
    
    def test_create_pantry_item_full(self, db_session):
        """Test creating a pantry item with all fields."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        expiration = datetime.utcnow() + timedelta(days=7)
        
        item = PantryItem(
            household_id=household.id,
            name="Milk",
            quantity="1 gallon",
            category="Dairy",
            expiration_date=expiration,
            low_stock_threshold=2
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        assert item.id is not None
        assert item.household_id == household.id
        assert item.name == "Milk"
        assert item.quantity == "1 gallon"
        assert item.category == "Dairy"
        assert item.expiration_date == expiration
        assert item.low_stock_threshold == 2
        assert isinstance(item.created_at, datetime)
        assert isinstance(item.updated_at, datetime)
    
    def test_create_pantry_item_minimal(self, db_session):
        """Test creating a pantry item with only required fields."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item = PantryItem(
            household_id=household.id,
            name="Rice"
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        assert item.id is not None
        assert item.name == "Rice"
        assert item.quantity is None
        assert item.category is None
        assert item.expiration_date is None
        assert item.low_stock_threshold is None
    
    def test_household_id_required(self, db_session):
        """Test that household_id is required."""
        item = PantryItem(name="Test Item")
        db_session.add(item)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_name_required(self, db_session):
        """Test that name is required."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item = PantryItem(household_id=household.id)
        db_session.add(item)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_household_relationship(self, db_session):
        """Test the relationship to household."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="My Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item = PantryItem(
            household_id=household.id,
            name="Test Item"
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        assert item.household is not None
        assert item.household.name == "My Household"
    
    def test_multiple_items_per_household(self, db_session):
        """Test that a household can have multiple pantry items."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item1 = PantryItem(
            household_id=household.id,
            name="Flour",
            category="Baking"
        )
        item2 = PantryItem(
            household_id=household.id,
            name="Sugar",
            category="Baking"
        )
        item3 = PantryItem(
            household_id=household.id,
            name="Rice",
            category="Grains"
        )
        db_session.add_all([item1, item2, item3])
        db_session.commit()
        
        items = db_session.query(PantryItem).filter_by(
            household_id=household.id
        ).all()
        
        assert len(items) == 3
        assert {i.name for i in items} == {"Flour", "Sugar", "Rice"}
    
    def test_filter_by_category(self, db_session):
        """Test filtering pantry items by category."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        dairy1 = PantryItem(
            household_id=household.id,
            name="Milk",
            category="Dairy"
        )
        dairy2 = PantryItem(
            household_id=household.id,
            name="Cheese",
            category="Dairy"
        )
        grain = PantryItem(
            household_id=household.id,
            name="Rice",
            category="Grains"
        )
        db_session.add_all([dairy1, dairy2, grain])
        db_session.commit()
        
        dairy_items = db_session.query(PantryItem).filter_by(
            household_id=household.id,
            category="Dairy"
        ).all()
        
        assert len(dairy_items) == 2
        assert {i.name for i in dairy_items} == {"Milk", "Cheese"}
    
    def test_expiring_items(self, db_session):
        """Test querying items that are expiring soon."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        now = datetime.utcnow()
        
        expiring_soon = PantryItem(
            household_id=household.id,
            name="Expiring Soon",
            expiration_date=now + timedelta(days=3)
        )
        expiring_later = PantryItem(
            household_id=household.id,
            name="Expiring Later",
            expiration_date=now + timedelta(days=30)
        )
        no_expiration = PantryItem(
            household_id=household.id,
            name="No Expiration"
        )
        db_session.add_all([expiring_soon, expiring_later, no_expiration])
        db_session.commit()
        
        # Query items expiring within 7 days
        seven_days_from_now = now + timedelta(days=7)
        expiring_items = db_session.query(PantryItem).filter(
            PantryItem.household_id == household.id,
            PantryItem.expiration_date.isnot(None),
            PantryItem.expiration_date <= seven_days_from_now
        ).all()
        
        assert len(expiring_items) == 1
        assert expiring_items[0].name == "Expiring Soon"
    
    def test_updated_at_changes(self, db_session):
        """Test that updated_at timestamp changes on update."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item = PantryItem(
            household_id=household.id,
            name="Test Item",
            quantity="2"
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        original_updated = item.updated_at
        
        # Update the item
        item.quantity = "3"
        db_session.commit()
        db_session.refresh(item)
        
        assert item.quantity == "3"
        assert item.updated_at > original_updated
    
    def test_pantry_item_repr(self, db_session):
        """Test pantry item string representation."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        item = PantryItem(
            household_id=household.id,
            name="Test Item"
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        repr_str = repr(item)
        assert "PantryItem" in repr_str
        assert "Test Item" in repr_str

