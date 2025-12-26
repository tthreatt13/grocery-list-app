"""Clerk authentication middleware and dependencies."""

from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from database import get_db
from models.user import User


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
        # Decode JWT token (in production, verify signature with Clerk's public key)
        # For now, we'll decode without verification for testing
        # In production, you'd fetch JWKS from Clerk and verify

        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]

        # Decode token
        # Note: In production, you should verify the signature
        # using Clerk's public keys from their JWKS endpoint
        payload = jwt.decode(
            token,
            options={"verify_signature": False},  # Disabled for testing
            algorithms=["RS256"],
        )

        # Extract user ID from token
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )

        # Look up user in database
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        # Raise 404 if user not found
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}"
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

    # Extract token from "Bearer <token>" format
    if not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_value = token[7:]  # Remove "Bearer " prefix

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
