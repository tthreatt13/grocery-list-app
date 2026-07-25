"""Pydantic schemas for grocery lists and items."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Grocery Item Schemas
class GroceryItemBase(BaseModel):
    """Base schema for grocery item."""

    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    quantity: Optional[str] = Field(
        None, max_length=50, description="Quantity (e.g., '2 lbs', '1 gallon')"
    )
    category: Optional[str] = Field(
        None, max_length=50, description="Category (e.g., 'Produce', 'Dairy')"
    )
    meal_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Meal type (e.g., 'Breakfast', 'Lunch', 'Dinner', 'Snack')",
    )
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")


class GroceryItemCreate(GroceryItemBase):
    """Schema for creating a grocery item."""

    checked: bool = Field(default=False, description="Whether item is checked off")


class GroceryItemUpdate(BaseModel):
    """Schema for updating a grocery item."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    meal_type: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)
    checked: Optional[bool] = None


class GroceryItemResponse(GroceryItemBase):
    """Schema for grocery item response."""

    id: int
    list_id: int
    checked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Grocery List Schemas
class GroceryListBase(BaseModel):
    """Base schema for grocery list."""

    name: str = Field(..., min_length=1, max_length=200, description="List name")
    is_archived: bool = Field(default=False, description="Whether the list is archived")


class GroceryListCreate(GroceryListBase):
    """Schema for creating a grocery list."""

    household_id: int = Field(
        ..., gt=0, description="Household ID this list belongs to"
    )


class GroceryListUpdate(BaseModel):
    """Schema for updating a grocery list."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    is_archived: Optional[bool] = Field(
        None, description="Whether to archive/unarchive the list"
    )


class GroceryListResponse(GroceryListBase):
    """Schema for grocery list response (without items)."""

    id: int
    household_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroceryListWithItems(GroceryListResponse):
    """Schema for grocery list response with all items included."""

    items: List[GroceryItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class GrocerySuggestion(BaseModel):
    """Schema for AI-generated grocery list suggestion."""

    action: str = Field(..., pattern="^(add|remove|swap)$")
    name: str = Field(..., max_length=200)
    quantity: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    meal_type: Optional[str] = Field(None, max_length=50)
    target_item_id: Optional[int] = None
    reason: Optional[str] = Field(None, max_length=500)


class ChatMessage(BaseModel):
    """Schema for chat message in conversation history."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class AIReviewRequest(BaseModel):
    """Schema for AI grocery list review request."""

    user_message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class AIReviewResponse(BaseModel):
    """Schema for AI grocery list review response."""

    gap_analysis: str
    suggestions: List[GrocerySuggestion] = Field(default_factory=list)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
