"""Pydantic schemas for dashboard insights."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UrgentItem(BaseModel):
    """Schema for urgent action items."""

    id: int
    name: str
    type: str = Field(..., description="Type of urgent item: 'expiring_soon' or 'low_stock'")
    household_id: int
    category: Optional[str] = None
    quantity: Optional[str] = None
    expiration_date: Optional[datetime] = None
    days_until_expiration: Optional[int] = Field(
        None, description="Days until expiration (for expiring items)"
    )
    low_stock_threshold: Optional[float] = None
    current_quantity: Optional[str] = None

    model_config = {"from_attributes": False}


class Suggestion(BaseModel):
    """Schema for smart suggestions."""

    id: str = Field(..., description="Unique suggestion ID")
    type: str = Field(..., description="Type of suggestion: 'restock', 'meal_planning', 'routine'")
    title: str
    description: str
    action_label: str = Field(..., description="Label for the action button (e.g., 'Add to List')")
    action_data: Optional[dict] = Field(
        None, description="Data needed to perform the action (e.g., item name, list ID)"
    )
    priority: int = Field(
        default=0, description="Priority level (higher = more important)"
    )


class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""

    total_lists: int
    total_items: int
    completed_items: int
    low_stock_count: int
    expiring_soon_count: int
    meals_this_week: int
    planned_days: int = Field(..., description="Number of days with planned meals")


class DashboardInsightsResponse(BaseModel):
    """Schema for dashboard insights response."""

    urgent_items: List[UrgentItem] = Field(default_factory=list)
    suggestions: List[Suggestion] = Field(default_factory=list)
    stats: DashboardStats

