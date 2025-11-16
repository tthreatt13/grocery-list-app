"""Pydantic schemas for household-related endpoints."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr


class HouseholdBase(BaseModel):
    """Base household schema with common fields."""
    name: str


class HouseholdCreate(HouseholdBase):
    """Schema for creating a new household."""
    pass


class HouseholdUpdate(BaseModel):
    """Schema for updating household information."""
    name: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


class MemberBase(BaseModel):
    """Base member schema with common fields."""
    user_id: int
    role: str  # admin, member, viewer


class MemberResponse(BaseModel):
    """Schema for household member response."""
    id: int
    household_id: int
    user_id: int
    role: str
    joined_at: datetime
    # Include user details
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class MemberInvite(BaseModel):
    """Schema for inviting a member to a household."""
    email: EmailStr
    role: str = "member"  # Default role is member


class MemberRoleUpdate(BaseModel):
    """Schema for updating a member's role."""
    role: str  # admin, member, viewer
    
    model_config = ConfigDict(extra='ignore')


class HouseholdResponse(HouseholdBase):
    """Schema for household response."""
    id: int
    created_by: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HouseholdWithMembersResponse(HouseholdResponse):
    """Schema for household response with member list."""
    members: List[MemberResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class SharedListItem(BaseModel):
    """Schema for a shared grocery list item."""
    id: int
    name: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    item_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class SharedListsResponse(BaseModel):
    """Schema for household's shared grocery lists."""
    household_id: int
    household_name: str
    lists: List[SharedListItem] = []

