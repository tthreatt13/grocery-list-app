"""Pydantic schemas for user-related endpoints."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""

    clerk_user_id: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    name: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    clerk_user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClerkWebhookEvent(BaseModel):
    """Schema for Clerk webhook events."""

    type: str
    data: dict

    model_config = ConfigDict(extra="allow")
