"""Tests for Household model."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household


class TestHouseholdModel:
    """Test cases for Household model."""

    def test_create_household_with_all_fields(self, db_session):
        """Test creating a household with all required fields."""
        # Create a user first
        user = User(clerk_user_id="user_123", email="creator@example.com", name="Creator User")
        db_session.add(user)
        db_session.commit()

        # Create household
        household = Household(name="Smith Family", created_by=user.id)
        db_session.add(household)
        db_session.commit()
        db_session.refresh(household)

        assert household.id is not None
        assert household.name == "Smith Family"
        assert household.created_by == user.id
        assert isinstance(household.created_at, datetime)

    def test_household_name_required(self, db_session):
        """Test that household name is required."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(created_by=user.id)
        db_session.add(household)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_created_by_required(self, db_session):
        """Test that created_by is required."""
        household = Household(name="Test Household")
        db_session.add(household)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_created_by_references_user(self, db_session):
        """Test that created_by must reference an existing user."""
        household = Household(name="Test Household", created_by=99999)  # Non-existent user
        db_session.add(household)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_household_creator_relationship(self, db_session):
        """Test the relationship to the creator user."""
        user = User(clerk_user_id="user_creator", email="creator@example.com", name="Creator")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()
        db_session.refresh(household)

        # Test the relationship
        assert household.creator is not None
        assert household.creator.id == user.id
        assert household.creator.email == "creator@example.com"

    def test_multiple_households_same_creator(self, db_session):
        """Test that one user can create multiple households."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household1 = Household(name="Family Home", created_by=user.id)
        household2 = Household(name="Vacation House", created_by=user.id)

        db_session.add_all([household1, household2])
        db_session.commit()

        # Query households created by user
        households = db_session.query(Household).filter_by(created_by=user.id).all()

        assert len(households) == 2
        assert {h.name for h in households} == {"Family Home", "Vacation House"}

    def test_household_repr(self, db_session):
        """Test household string representation."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()
        db_session.refresh(household)

        repr_str = repr(household)
        assert "Household" in repr_str
        assert "Test Household" in repr_str

    def test_query_household_by_name(self, db_session):
        """Test querying household by name."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Unique Family Name", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        found = db_session.query(Household).filter_by(name="Unique Family Name").first()

        assert found is not None
        assert found.created_by == user.id
