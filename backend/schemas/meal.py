"""Pydantic schemas for meal planner endpoints."""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class MealBase(BaseModel):
    """Base meal schema with common fields."""
    name: str = Field(..., min_length=1, max_length=200)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    week_start_date: date
    ingredients: Optional[str] = None
    notes: Optional[str] = None


class MealCreate(MealBase):
    """Schema for creating a new meal."""
    household_id: int


class MealUpdate(BaseModel):
    """Schema for updating a meal."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    week_start_date: Optional[date] = None
    ingredients: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


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

