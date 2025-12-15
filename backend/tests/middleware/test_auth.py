"""Tests for Clerk authentication middleware."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from models.user import User


class TestClerkAuthMiddleware:
    """Test cases for Clerk JWT verification middleware."""

    def test_verify_token_success(self, db_session):
        """Test successful token verification returns user."""
        from middleware.auth import verify_clerk_token

        # Mock JWT decode response
        mock_clerk_data = {"sub": "user_123abc", "email": "test@example.com"}

        # Create test user in database
        user = User(
            clerk_user_id="user_123abc", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        with patch("middleware.auth.jwt.decode") as mock_decode:
            mock_decode.return_value = mock_clerk_data

            result = verify_clerk_token("valid_token_here", db_session)

            assert result is not None
            assert result.clerk_user_id == "user_123abc"
            assert result.email == "test@example.com"

    def test_verify_token_missing_subject(self, db_session):
        """Test that token without subject raises 401."""
        from middleware.auth import verify_clerk_token

        mock_clerk_data = {"email": "test@example.com"}  # Missing 'sub' field

        with patch("middleware.auth.jwt.decode") as mock_decode:
            mock_decode.return_value = mock_clerk_data

            with pytest.raises(HTTPException) as exc_info:
                verify_clerk_token("invalid_token", db_session)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_verify_token_invalid_format(self):
        """Test that invalid token format raises 401."""
        from middleware.auth import verify_clerk_token

        with pytest.raises(HTTPException) as exc_info:
            verify_clerk_token("invalid_token", Mock())

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_verify_token_expired(self):
        """Test that expired token raises 401."""
        from middleware.auth import verify_clerk_token

        with patch("middleware.auth.jwt.decode") as mock_decode:
            from jwt import ExpiredSignatureError

            mock_decode.side_effect = ExpiredSignatureError("Token expired")

            with pytest.raises(HTTPException) as exc_info:
                verify_clerk_token("expired_token", Mock())

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_verify_token_user_not_found(self, db_session):
        """Test that token for non-existent user raises 404."""
        from middleware.auth import verify_clerk_token

        mock_clerk_data = {
            "sub": "user_nonexistent",
            "email": "nonexistent@example.com",
        }

        with patch("middleware.auth.jwt.decode") as mock_decode:
            mock_decode.return_value = mock_clerk_data

            with pytest.raises(HTTPException) as exc_info:
                verify_clerk_token("valid_token", db_session)

            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


class TestGetCurrentUserDependency:
    """Test cases for get_current_user dependency function."""

    def test_get_current_user_success(self, db_session):
        """Test successful retrieval of current user from token."""
        from middleware.auth import get_current_user

        # Create test user
        user = User(
            clerk_user_id="user_123abc", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        # Mock token verification
        with patch("middleware.auth.verify_clerk_token") as mock_verify:
            mock_verify.return_value = user

            result = get_current_user(token="Bearer valid_token", db=db_session)

            assert result.clerk_user_id == "user_123abc"
            assert result.email == "test@example.com"

    def test_get_current_user_no_bearer_prefix(self, db_session):
        """Test that token without Bearer prefix raises 401."""
        from middleware.auth import get_current_user

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token="just_a_token", db=db_session)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_missing_token(self, db_session):
        """Test that missing token raises 401."""
        from middleware.auth import get_current_user

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=None, db=db_session)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
