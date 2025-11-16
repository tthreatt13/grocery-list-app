"""Tests for GroceryList model."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household
from models.grocery_list import GroceryList


class TestGroceryListModel:
    """Test cases for GroceryList model."""
    
    def test_create_grocery_list(self, db_session):
        """Test creating a grocery list with all fields."""
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Weekly Groceries",
            created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()
        db_session.refresh(grocery_list)
        
        assert grocery_list.id is not None
        assert grocery_list.household_id == household.id
        assert grocery_list.name == "Weekly Groceries"
        assert grocery_list.created_by == user.id
        assert isinstance(grocery_list.created_at, datetime)
        assert isinstance(grocery_list.updated_at, datetime)
    
    def test_household_id_required(self, db_session):
        """Test that household_id is required."""
        user = User(
            clerk_user_id="user_123",
            email="test@example.com",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        grocery_list = GroceryList(
            name="Test List",
            created_by=user.id
        )
        db_session.add(grocery_list)
        
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            created_by=user.id
        )
        db_session.add(grocery_list)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_created_by_required(self, db_session):
        """Test that created_by is required."""
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Test List"
        )
        db_session.add(grocery_list)
        
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Test List",
            created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()
        db_session.refresh(grocery_list)
        
        assert grocery_list.household is not None
        assert grocery_list.household.name == "My Household"
    
    def test_creator_relationship(self, db_session):
        """Test the relationship to creator user."""
        user = User(
            clerk_user_id="user_123",
            email="creator@example.com",
            name="Creator User"
        )
        db_session.add(user)
        db_session.commit()
        
        household = Household(
            name="Test Household",
            created_by=user.id
        )
        db_session.add(household)
        db_session.commit()
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Test List",
            created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()
        db_session.refresh(grocery_list)
        
        assert grocery_list.creator is not None
        assert grocery_list.creator.email == "creator@example.com"
    
    def test_multiple_lists_per_household(self, db_session):
        """Test that a household can have multiple grocery lists."""
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
        
        list1 = GroceryList(
            household_id=household.id,
            name="Weekly List",
            created_by=user.id
        )
        list2 = GroceryList(
            household_id=household.id,
            name="Party List",
            created_by=user.id
        )
        db_session.add_all([list1, list2])
        db_session.commit()
        
        lists = db_session.query(GroceryList).filter_by(
            household_id=household.id
        ).all()
        
        assert len(lists) == 2
        assert {l.name for l in lists} == {"Weekly List", "Party List"}
    
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Original Name",
            created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()
        db_session.refresh(grocery_list)
        
        original_updated = grocery_list.updated_at
        
        # Update the list
        grocery_list.name = "Updated Name"
        db_session.commit()
        db_session.refresh(grocery_list)
        
        assert grocery_list.name == "Updated Name"
        assert grocery_list.updated_at > original_updated
    
    def test_grocery_list_repr(self, db_session):
        """Test grocery list string representation."""
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
        
        grocery_list = GroceryList(
            household_id=household.id,
            name="Shopping List",
            created_by=user.id
        )
        db_session.add(grocery_list)
        db_session.commit()
        db_session.refresh(grocery_list)
        
        repr_str = repr(grocery_list)
        assert "GroceryList" in repr_str
        assert "Shopping List" in repr_str

