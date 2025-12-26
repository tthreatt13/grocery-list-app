"""Tests for HouseholdMember association model."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.household import Household
from models.household_member import HouseholdMember


class TestHouseholdMemberModel:
    """Test cases for HouseholdMember model."""

    def test_create_household_member(self, db_session):
        """Test creating a household member association."""
        # Create user and household
        user = User(clerk_user_id="user_123", email="member@example.com", name="Member User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        # Create household member association
        member = HouseholdMember(household_id=household.id, user_id=user.id, role="admin")
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        assert member.household_id == household.id
        assert member.user_id == user.id
        assert member.role == "admin"
        assert isinstance(member.joined_at, datetime)

    def test_household_id_required(self, db_session):
        """Test that household_id is required."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        member = HouseholdMember(user_id=user.id, role="member")
        db_session.add(member)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_id_required(self, db_session):
        """Test that user_id is required."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        member = HouseholdMember(household_id=household.id, role="member")
        db_session.add(member)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_role_required(self, db_session):
        """Test that role is required."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        member = HouseholdMember(household_id=household.id, user_id=user.id)
        db_session.add(member)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_unique_household_user_combination(self, db_session):
        """Test that a user can only be added to a household once."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        member1 = HouseholdMember(household_id=household.id, user_id=user.id, role="admin")
        db_session.add(member1)
        db_session.commit()

        # Try to add same user to same household again
        member2 = HouseholdMember(household_id=household.id, user_id=user.id, role="member")
        db_session.add(member2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_multiple_users_in_household(self, db_session):
        """Test that multiple users can belong to the same household."""
        user1 = User(clerk_user_id="user_1", email="user1@example.com", name="User 1")
        user2 = User(clerk_user_id="user_2", email="user2@example.com", name="User 2")
        db_session.add_all([user1, user2])
        db_session.commit()

        household = Household(name="Shared Household", created_by=user1.id)
        db_session.add(household)
        db_session.commit()

        member1 = HouseholdMember(household_id=household.id, user_id=user1.id, role="admin")
        member2 = HouseholdMember(household_id=household.id, user_id=user2.id, role="member")
        db_session.add_all([member1, member2])
        db_session.commit()

        members = db_session.query(HouseholdMember).filter_by(household_id=household.id).all()

        assert len(members) == 2
        assert {m.role for m in members} == {"admin", "member"}

    def test_user_in_multiple_households(self, db_session):
        """Test that a user can belong to multiple households."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household1 = Household(name="Household 1", created_by=user.id)
        household2 = Household(name="Household 2", created_by=user.id)
        db_session.add_all([household1, household2])
        db_session.commit()

        member1 = HouseholdMember(household_id=household1.id, user_id=user.id, role="admin")
        member2 = HouseholdMember(household_id=household2.id, user_id=user.id, role="admin")
        db_session.add_all([member1, member2])
        db_session.commit()

        memberships = db_session.query(HouseholdMember).filter_by(user_id=user.id).all()

        assert len(memberships) == 2

    def test_household_relationship(self, db_session):
        """Test the relationship to household."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        member = HouseholdMember(household_id=household.id, user_id=user.id, role="admin")
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        assert member.household is not None
        assert member.household.name == "Test Household"

    def test_user_relationship(self, db_session):
        """Test the relationship to user."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        member = HouseholdMember(household_id=household.id, user_id=user.id, role="member")
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        assert member.user is not None
        assert member.user.email == "test@example.com"

    def test_role_values(self, db_session):
        """Test different role values."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        household = Household(name="Test Household", created_by=user.id)
        db_session.add(household)
        db_session.commit()

        # Test admin role
        admin = HouseholdMember(household_id=household.id, user_id=user.id, role="admin")
        db_session.add(admin)
        db_session.commit()

        assert admin.role == "admin"

        # Clean up
        db_session.delete(admin)
        db_session.commit()

        # Test member role
        member = HouseholdMember(household_id=household.id, user_id=user.id, role="member")
        db_session.add(member)
        db_session.commit()

        assert member.role == "member"

        # Clean up
        db_session.delete(member)
        db_session.commit()

        # Test viewer role
        viewer = HouseholdMember(household_id=household.id, user_id=user.id, role="viewer")
        db_session.add(viewer)
        db_session.commit()

        assert viewer.role == "viewer"
