"""User management routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from middleware.auth import get_current_user
from models.user import User
from schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


class UserSyncRequest(BaseModel):
    """Request model for syncing user from Clerk."""
    clerk_user_id: str
    email: str
    name: Optional[str] = None


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user's information.
    
    Args:
        current_user: Current authenticated user from token
        db: Database session
    
    Returns:
        UserResponse: Current user's information
    
    Raises:
        HTTPException: If user not found (should not happen if authenticated)
    """
    return current_user


@router.post("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Update current authenticated user's profile.
    
    Args:
        user_update: User update data
        current_user: Current authenticated user from token
        db: Database session
    
    Returns:
        UserResponse: Updated user information
    
    Raises:
        HTTPException: If update fails
    """
    # Update user fields
    if user_update.name is not None:
        current_user.name = user_update.name
    
    # Commit changes
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/sync", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def sync_user(
    user_data: UserSyncRequest,
    db: Session = Depends(get_db)
) -> User:
    """
    Sync a user from Clerk to local database.
    Creates the user if they don't exist, updates if they do.
    
    Args:
        user_data: User data from Clerk
        db: Database session
    
    Returns:
        UserResponse: Synced user information
    """
    # Check if user already exists
    user = db.query(User).filter(
        User.clerk_user_id == user_data.clerk_user_id
    ).first()
    
    if user:
        # Update existing user
        user.email = user_data.email
        if user_data.name:
            user.name = user_data.name
        db.commit()
        db.refresh(user)
        return user
    else:
        # Create new user
        new_user = User(
            clerk_user_id=user_data.clerk_user_id,
            email=user_data.email,
            name=user_data.name or "User"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

