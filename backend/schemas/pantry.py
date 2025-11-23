"""Pydantic schemas for pantry inventory API."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PantryItemBase(BaseModel):
    """Base schema for pantry item with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[str] = None
    category: Optional[str] = None
    expiration_date: Optional[datetime] = None
    low_stock_threshold: Optional[float] = Field(None, ge=0)


class PantryItemCreate(PantryItemBase):
    """Schema for creating a new pantry item."""
    household_id: int = Field(..., gt=0)


class PantryItemUpdate(BaseModel):
    """Schema for updating a pantry item (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[str] = None
    category: Optional[str] = None
    expiration_date: Optional[datetime] = None
    low_stock_threshold: Optional[float] = Field(None, ge=0)


class PantryItemResponse(PantryItemBase):
    """Schema for pantry item response."""
    id: int
    household_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

