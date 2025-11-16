"""Clerk authentication middleware and dependencies."""

from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from database import get_db
from models.user import User
from config import settings


def verify_clerk_token(token: str, db: Session) -> User:
    """
    Verify Clerk JWT token and return associated user.
    Auto-creates user if they don't exist in database.
    
    Args:
        token: JWT token from Clerk
        db: Database session
    
    Returns:
        User: The authenticated user
    
    Raises:
        HTTPException: If token is invalid
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
            algorithms=["RS256"]
        )
        
        # Extract user ID from token
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject"
            )
        
        # Look up user in database
        user = db.query(User).filter(
            User.clerk_user_id == clerk_user_id
        ).first()
        
        # Auto-create user if they don't exist
        if not user:
            # Extract email from token - Clerk stores it in different ways
            email = None
            
            # Try direct email field (most common)
            email = payload.get("email")
            
            # Try primary_email field
            if not email:
                email = payload.get("primary_email")
            
            # Try email_addresses array
            if not email:
                email_addresses = payload.get("email_addresses", [])
                if email_addresses and len(email_addresses) > 0:
                    if isinstance(email_addresses[0], dict):
                        email = email_addresses[0].get("email_address")
                    else:
                        email = email_addresses[0]
            
            # Try azp (authorized party) as fallback if it looks like an email
            if not email:
                azp = payload.get("azp", "")
                if "@" in azp:
                    email = azp
            
            if not email:
                # Log the payload for debugging (remove sensitive data)
                safe_payload = {k: v for k, v in payload.items() if k not in ['iat', 'exp', 'nbf']}
                print(f"DEBUG: Could not find email in token. Payload keys: {list(safe_payload.keys())}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not found in token. Please ensure your Clerk account has a verified email."
                )
            
            # Get user's name from token
            # Try different name field variations
            name = payload.get("name") or payload.get("full_name")
            if not name:
                first_name = payload.get("first_name") or payload.get("given_name") or ""
                last_name = payload.get("last_name") or payload.get("family_name") or ""
                name = f"{first_name} {last_name}".strip() or None
            
            # Create new user
            user = User(
                clerk_user_id=clerk_user_id,
                email=email,
                name=name or "User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"DEBUG: Created new user with email: {email}")
        
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


def get_current_user(
    token: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
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
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract token from "Bearer <token>" format
    if not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token_value = token[7:]  # Remove "Bearer " prefix
    
    return verify_clerk_token(token_value, db)


def get_current_user_optional(
    token: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
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

