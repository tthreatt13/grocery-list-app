"""Tests for Clerk authentication middleware."""

import base64
from contextlib import contextmanager

import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt import ExpiredSignatureError

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from config import settings
from models.user import User


@contextmanager
def patched_clerk_verification(decode_return=None, decode_side_effect=None):
    """Run verification through the JWKS client, then a patched jwt.decode."""
    client = Mock()
    signing_key = Mock()
    signing_key.key = "verification-key"
    client.get_signing_key_from_jwt.return_value = signing_key
    previous_environment = settings.environment
    object.__setattr__(settings, "environment", "development")
    try:
        with patch("middleware.auth.get_jwks_client", return_value=client), patch(
            "middleware.auth.jwt.decode"
        ) as mock_decode:
            if decode_side_effect is not None:
                mock_decode.side_effect = decode_side_effect
            else:
                mock_decode.return_value = decode_return
            yield mock_decode, client
    finally:
        object.__setattr__(settings, "environment", previous_environment)


class TestClerkAuthMiddleware:
    """Test cases for Clerk JWT verification middleware."""

    def test_verify_token_success(self, db_session):
        """Test successful token verification returns user."""
        from middleware.auth import verify_clerk_token

        mock_clerk_data = {"sub": "user_123abc", "email": "test@example.com"}

        user = User(
            clerk_user_id="user_123abc", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        with patched_clerk_verification(decode_return=mock_clerk_data) as (
            mock_decode,
            client,
        ):
            result = verify_clerk_token("valid_token_here", db_session)

            assert result is not None
            assert result.clerk_user_id == "user_123abc"
            assert result.email == "test@example.com"
            client.get_signing_key_from_jwt.assert_called_once_with("valid_token_here")
            assert mock_decode.call_args.args[1] == "verification-key"
            assert mock_decode.call_args.kwargs["algorithms"] == ["RS256"]

    def test_verify_token_missing_subject(self, db_session):
        """Test that token without subject raises 401."""
        from middleware.auth import verify_clerk_token

        mock_clerk_data = {"email": "test@example.com"}  # Missing 'sub' field

        with patched_clerk_verification(decode_return=mock_clerk_data):
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

        with patched_clerk_verification(
            decode_side_effect=ExpiredSignatureError("Token expired")
        ):
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

        with patched_clerk_verification(decode_return=mock_clerk_data):
            with pytest.raises(HTTPException) as exc_info:
                verify_clerk_token("valid_token", db_session)

            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    def test_verify_token_rejects_unrelated_signing_key(self, db_session):
        """Reject a token signed by a key other than the one JWKS returns."""
        import jwt
        from middleware.auth import verify_clerk_token

        user = User(
            clerk_user_id="user_123abc", email="test@example.com", name="Test User"
        )
        db_session.add(user)
        db_session.commit()

        trusted_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        token = jwt.encode(
            {"sub": user.clerk_user_id, "email": user.email},
            attacker_key,
            algorithm="RS256",
        )

        client = Mock()
        signing_key = Mock()
        signing_key.key = trusted_key.public_key()
        client.get_signing_key_from_jwt.return_value = signing_key

        previous_environment = settings.environment
        object.__setattr__(settings, "environment", "development")
        try:
            with patch("middleware.auth.get_jwks_client", return_value=client):
                with pytest.raises(HTTPException) as exc_info:
                    verify_clerk_token(token, db_session)
        finally:
            object.__setattr__(settings, "environment", previous_environment)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_jwks_url_from_publishable_key(self):
        """Derive the JWKS URL from a Clerk publishable key."""
        from middleware.auth import jwks_url_from_publishable_key

        encoded = base64.b64encode(b"clerk.example.com$").decode("utf-8").rstrip("=")
        publishable_key = f"pk_test_{encoded}"

        assert (
            jwks_url_from_publishable_key(publishable_key)
            == "https://clerk.example.com/.well-known/jwks.json"
        )

    def test_explicit_jwks_url_is_cached(self):
        """Use CLERK_JWKS_URL and reuse the client for that URL."""
        from middleware import auth as auth_module

        previous_url = settings.clerk_jwks_url
        auth_module._jwks_clients.clear()
        object.__setattr__(settings, "clerk_jwks_url", "https://example.test/jwks.json")
        try:
            with patch(
                "middleware.auth.PyJWKClient", return_value=Mock()
            ) as client_cls:
                first = auth_module.get_jwks_client()
                second = auth_module.get_jwks_client()
        finally:
            object.__setattr__(settings, "clerk_jwks_url", previous_url)
            auth_module._jwks_clients.clear()

        assert first is second
        client_cls.assert_called_once_with("https://example.test/jwks.json")


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
