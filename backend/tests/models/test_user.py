"""Tests for User model."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from models.user import User


class TestUserModel:
    """Test cases for User model."""

    def test_create_user_with_all_fields(self, db_session):
        """Test creating a user with all required fields."""
        user = User(clerk_user_id="user_123abc", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.clerk_user_id == "user_123abc"
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_clerk_user_id_is_unique(self, db_session):
        """Test that clerk_user_id must be unique."""
        user1 = User(clerk_user_id="user_duplicate", email="user1@example.com", name="User 1")
        db_session.add(user1)
        db_session.commit()

        user2 = User(
            clerk_user_id="user_duplicate",  # Same clerk_user_id
            email="user2@example.com",
            name="User 2",
        )
        db_session.add(user2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_email_is_unique(self, db_session):
        """Test that email must be unique."""
        user1 = User(clerk_user_id="user_123", email="duplicate@example.com", name="User 1")
        db_session.add(user1)
        db_session.commit()

        user2 = User(
            clerk_user_id="user_456",
            email="duplicate@example.com",  # Same email
            name="User 2",
        )
        db_session.add(user2)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_clerk_user_id_required(self, db_session):
        """Test that clerk_user_id is required."""
        user = User(email="test@example.com", name="Test User")
        db_session.add(user)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_email_required(self, db_session):
        """Test that email is required."""
        user = User(clerk_user_id="user_123", name="Test User")
        db_session.add(user)

        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_name_can_be_null(self, db_session):
        """Test that name is optional."""
        user = User(clerk_user_id="user_123", email="test@example.com")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.name is None
        assert user.id is not None

    def test_updated_at_changes_on_update(self, db_session):
        """Test that updated_at timestamp changes when user is updated."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Original Name")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        original_updated_at = user.updated_at

        # Update the user
        user.name = "Updated Name"
        db_session.commit()
        db_session.refresh(user)

        assert user.name == "Updated Name"
        assert user.updated_at > original_updated_at

    def test_user_repr(self, db_session):
        """Test user string representation."""
        user = User(clerk_user_id="user_123", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        repr_str = repr(user)
        assert "User" in repr_str
        assert "test@example.com" in repr_str

    def test_query_user_by_clerk_id(self, db_session):
        """Test querying user by clerk_user_id."""
        user = User(clerk_user_id="user_findme", email="findme@example.com", name="Find Me")
        db_session.add(user)
        db_session.commit()

        found_user = db_session.query(User).filter_by(clerk_user_id="user_findme").first()

        assert found_user is not None
        assert found_user.email == "findme@example.com"
        assert found_user.name == "Find Me"

    def test_query_user_by_email(self, db_session):
        """Test querying user by email."""
        user = User(clerk_user_id="user_123", email="query@example.com", name="Query User")
        db_session.add(user)
        db_session.commit()

        found_user = db_session.query(User).filter_by(email="query@example.com").first()

        assert found_user is not None
        assert found_user.clerk_user_id == "user_123"
