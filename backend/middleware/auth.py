"""Clerk authentication middleware and dependencies."""

import base64
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from jwt import ExpiredSignatureError, PyJWKClient, PyJWTError
from sqlalchemy.orm import Session
import jwt

from config import settings
from database import get_db
from models.user import User

_jwks_clients: dict[str, PyJWKClient] = {}


def jwks_url_from_publishable_key(publishable_key: str) -> str:
    """Build the Clerk JWKS URL from a publishable key.

    Clerk publishable keys are ``pk_test_<base64>`` or ``pk_live_<base64>``.
    The base64 payload is the Frontend API host, often with a trailing ``$``.
    """
    host = _frontend_api_host(publishable_key)
    return f"https://{host}/.well-known/jwks.json"


def _frontend_api_host(publishable_key: str) -> str:
    if not publishable_key.startswith("pk_"):
        raise ValueError("Invalid Clerk publishable key")

    parts = publishable_key.split("_", 2)
    if len(parts) < 3 or not parts[2]:
        raise ValueError("Invalid Clerk publishable key")

    encoded = parts[2]
    padded = encoded + "=" * (-len(encoded) % 4)
    try:
        decoded = base64.b64decode(padded).decode("utf-8")
    except Exception as exc:
        raise ValueError("Invalid Clerk publishable key") from exc

    host = decoded.strip().rstrip("$")
    if not host or any(char in host for char in "/ \t\r\n"):
        raise ValueError("Invalid Clerk publishable key")
    return host


def get_jwks_client() -> PyJWKClient:
    """Return a cached JWKS client for the configured Clerk instance."""
    url = settings.clerk_jwks_url.strip()
    if not url:
        try:
            url = jwks_url_from_publishable_key(settings.clerk_publishable_key)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk JWKS is not configured",
            ) from exc

    client = _jwks_clients.get(url)
    if client is None:
        client = PyJWKClient(url)
        _jwks_clients[url] = client
    return client


def _uses_test_verification_key() -> bool:
    return settings.environment.lower() == "test" and bool(
        settings.clerk_test_jwt_public_key
    )


def _decode_clerk_token(token: str) -> dict:
    """Verify a Clerk session token and return its claims."""
    if token.startswith("Bearer "):
        token = token[7:]

    if _uses_test_verification_key():
        verification_key = settings.clerk_test_jwt_public_key
    else:
        verification_key = get_jwks_client().get_signing_key_from_jwt(token).key

    return jwt.decode(
        token,
        verification_key,
        algorithms=["RS256"],
        options={"verify_aud": False},
    )


def verify_clerk_token(token: str, db: Session) -> User:
    """
    Verify Clerk JWT token and return associated user.

    Args:
        token: JWT token from Clerk
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
            - 401: If token is invalid, expired, or missing subject
            - 404: If user is not found in database
    """
    try:
        payload = _decode_clerk_token(token)

        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user

    except HTTPException:
        raise
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(exc)}",
        )


def get_current_user(
    token: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to get current authenticated user.

    Args:
        token: Authorization header with Bearer token
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If authentication fails

    Usage:
        @app.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            return {"user_id": user.id}
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_value = token[7:]

    return verify_clerk_token(token_value, db)


def get_current_user_optional(
    token: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    FastAPI dependency to optionally get current authenticated user.
    Returns None if no token is provided instead of raising an exception.

    Args:
        token: Authorization header with Bearer token
        db: Database session

    Returns:
        Optional[User]: The authenticated user or None
    """
    if not token:
        return None

    try:
        return get_current_user(token, db)
    except HTTPException:
        return None
