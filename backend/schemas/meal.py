"""Pydantic schemas for meal planner endpoints."""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class MealBase(BaseModel):
    """Base meal schema with common fields."""

    name: Optional[str] = Field(None, max_length=200)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    week_start_date: date
    ingredients: Optional[str] = None
    notes: Optional[str] = None
    meal_category: Optional[str] = Field(
        None, pattern="^(normal|quick_meal|eat_out)$"
    )  # normal, quick_meal, eat_out


class MealCreate(MealBase):
    """Schema for creating a new meal."""

    household_id: int


class MealUpdate(BaseModel):
    """Schema for updating a meal."""

    name: Optional[str] = Field(None, max_length=200)
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    week_start_date: Optional[date] = None
    ingredients: Optional[str] = None
    notes: Optional[str] = None
    meal_category: Optional[str] = Field(None, pattern="^(normal|quick_meal|eat_out)$")

    model_config = ConfigDict(extra="ignore")


class MealResponse(MealBase):
    """Schema for meal response."""

    id: int
    household_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyPlanResponse(BaseModel):
    """Schema for weekly meal plan response."""

    week_start_date: date
    household_id: int
    meals: List[MealResponse]

    model_config = ConfigDict(from_attributes=True)


class GenerateGroceryListRequest(BaseModel):
    """Schema for generating grocery list from meals."""

    week_start_date: date
    household_id: int
    grocery_list_name: Optional[str] = "Generated from Meal Plan"


class GenerateGroceryListResponse(BaseModel):
    """Schema for grocery list generation response."""

    grocery_list_id: int
    items_count: int
    message: str


class MealSuggestion(BaseModel):
    """Schema for AI-generated meal suggestion."""

    meal_name: str = Field(..., max_length=200)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    ingredients: List[str] = Field(default_factory=list)
    uses_pantry_items: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class ChatMessage(BaseModel):
    """Schema for chat message in conversation history."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class AISuggestRequest(BaseModel):
    """Schema for AI meal suggestion request."""

    household_id: int
    week_start_date: date
    user_message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class AISuggestResponse(BaseModel):
    """Schema for AI meal suggestion response."""

    suggestions: List[MealSuggestion]
    conversation_history: List[ChatMessage] = Field(default_factory=list)
