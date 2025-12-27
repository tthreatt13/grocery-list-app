"""Dashboard insights API endpoints."""

from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from database import get_db
from middleware.auth import get_current_user
from models.user import User
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem
from models.pantry_item import PantryItem
from models.meal import Meal
from models.household_member import HouseholdMember
from schemas.dashboard import (
    DashboardInsightsResponse,
    UrgentItem,
    Suggestion,
    DashboardStats,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_user_household_ids(db: Session, user_id: int) -> List[int]:
    """Get all household IDs for a user."""
    memberships = (
        db.query(HouseholdMember.household_id)
        .filter(HouseholdMember.user_id == user_id)
        .all()
    )
    return [household_id for (household_id,) in memberships]


def get_urgent_items(db: Session, household_ids: List[int]) -> List[UrgentItem]:
    """Get urgent items (expiring soon and low stock) for user's households."""
    urgent_items: List[UrgentItem] = []

    if not household_ids:
        return urgent_items

    # Get items expiring within 5 days
    expiration_threshold = datetime.utcnow() + timedelta(days=5)
    expiring_items = (
        db.query(PantryItem)
        .filter(
            PantryItem.household_id.in_(household_ids),
            PantryItem.expiration_date.isnot(None),
            PantryItem.expiration_date <= expiration_threshold,
            PantryItem.expiration_date >= datetime.utcnow(),
        )
        .all()
    )

    for item in expiring_items:
        days_until = (item.expiration_date - datetime.utcnow()).days
        urgent_items.append(
            UrgentItem(
                id=item.id,
                name=item.name,
                type="expiring_soon",
                household_id=item.household_id,
                category=item.category,
                quantity=item.quantity,
                expiration_date=item.expiration_date,
                days_until_expiration=days_until,
            )
        )

    # Get low stock items
    low_stock_items = (
        db.query(PantryItem)
        .filter(
            PantryItem.household_id.in_(household_ids),
            PantryItem.low_stock_threshold.isnot(None),
        )
        .all()
    )

    for item in low_stock_items:
        # Parse quantity as float if possible, otherwise skip comparison
        try:
            current_qty = float(item.quantity or "0")
            if current_qty <= item.low_stock_threshold:
                urgent_items.append(
                    UrgentItem(
                        id=item.id,
                        name=item.name,
                        type="low_stock",
                        household_id=item.household_id,
                        category=item.category,
                        quantity=item.quantity,
                        current_quantity=item.quantity,
                        low_stock_threshold=item.low_stock_threshold,
                    )
                )
        except (ValueError, TypeError):
            # If quantity can't be parsed, check if it's empty or zero-like
            if not item.quantity or item.quantity.strip() == "0":
                urgent_items.append(
                    UrgentItem(
                        id=item.id,
                        name=item.name,
                        type="low_stock",
                        household_id=item.household_id,
                        category=item.category,
                        quantity=item.quantity,
                        current_quantity=item.quantity,
                        low_stock_threshold=item.low_stock_threshold,
                    )
                )

    return urgent_items


def get_suggestions(
    db: Session, household_ids: List[int], urgent_items: List[UrgentItem]
) -> List[Suggestion]:
    """Generate smart suggestions based on user data."""
    suggestions: List[Suggestion] = []

    if not household_ids:
        return suggestions

    # Suggestion: Restock low stock items
    low_stock_items = [item for item in urgent_items if item.type == "low_stock"]
    if low_stock_items:
        suggestions.append(
            Suggestion(
                id="restock_low_stock",
                type="restock",
                title="Restock Low Stock Items",
                description=f"You have {len(low_stock_items)} item(s) running low. Consider adding them to your shopping list.",
                action_label="View Items",
                priority=2,
            )
        )

    # Suggestion: Use expiring items soon
    expiring_items = [item for item in urgent_items if item.type == "expiring_soon"]
    if expiring_items:
        suggestions.append(
            Suggestion(
                id="use_expiring_items",
                type="meal_planning",
                title="Items Expiring Soon",
                description=f"You have {len(expiring_items)} item(s) expiring within 5 days. Plan meals to use them!",
                action_label="View Items",
                priority=3,
            )
        )

    # Suggestion: Create weekly shopping list if no active lists
    active_lists = (
        db.query(GroceryList)
        .filter(
            GroceryList.household_id.in_(household_ids),
            GroceryList.is_archived == False,
        )
        .count()
    )

    if active_lists == 0:
        suggestions.append(
            Suggestion(
                id="create_weekly_list",
                type="routine",
                title="Create Your Weekly Shopping List",
                description="Start planning your week by creating a new grocery list.",
                action_label="Create List",
                priority=1,
            )
        )

    return suggestions


def get_dashboard_stats(
    db: Session, household_ids: List[int]
) -> DashboardStats:
    """Calculate dashboard statistics."""
    if not household_ids:
        return DashboardStats(
            total_lists=0,
            total_items=0,
            completed_items=0,
            low_stock_count=0,
            expiring_soon_count=0,
            meals_this_week=0,
            planned_days=0,
        )

    # Grocery list stats
    lists = (
        db.query(GroceryList)
        .filter(
            GroceryList.household_id.in_(household_ids),
            GroceryList.is_archived == False,
        )
        .all()
    )

    total_lists = len(lists)
    list_ids = [lst.id for lst in lists]

    total_items = (
        db.query(GroceryItem).filter(GroceryItem.list_id.in_(list_ids)).count()
        if list_ids
        else 0
    )

    completed_items = (
        db.query(GroceryItem)
        .filter(GroceryItem.list_id.in_(list_ids), GroceryItem.checked == True)
        .count()
        if list_ids
        else 0
    )

    # Pantry stats
    expiration_threshold = datetime.utcnow() + timedelta(days=5)
    expiring_soon_count = (
        db.query(PantryItem)
        .filter(
            PantryItem.household_id.in_(household_ids),
            PantryItem.expiration_date.isnot(None),
            PantryItem.expiration_date <= expiration_threshold,
            PantryItem.expiration_date >= datetime.utcnow(),
        )
        .count()
    )

    # Count low stock items
    low_stock_items = (
        db.query(PantryItem)
        .filter(
            PantryItem.household_id.in_(household_ids),
            PantryItem.low_stock_threshold.isnot(None),
        )
        .all()
    )

    low_stock_count = 0
    for item in low_stock_items:
        try:
            current_qty = float(item.quantity or "0")
            if current_qty <= item.low_stock_threshold:
                low_stock_count += 1
        except (ValueError, TypeError):
            if not item.quantity or item.quantity.strip() == "0":
                low_stock_count += 1

    # Meal planner stats
    week_start = datetime.utcnow().date()
    # Get Monday of current week
    days_since_monday = week_start.weekday()
    week_start = week_start - timedelta(days=days_since_monday)

    meals_this_week = (
        db.query(Meal)
        .filter(
            Meal.household_id.in_(household_ids),
            Meal.week_start_date == week_start,
        )
        .count()
    )

    planned_days = (
        db.query(func.count(func.distinct(Meal.day_of_week)))
        .filter(
            Meal.household_id.in_(household_ids),
            Meal.week_start_date == week_start,
        )
        .scalar()
        or 0
    )

    return DashboardStats(
        total_lists=total_lists,
        total_items=total_items,
        completed_items=completed_items,
        low_stock_count=low_stock_count,
        expiring_soon_count=expiring_soon_count,
        meals_this_week=meals_this_week,
        planned_days=planned_days,
    )


@router.get("/insights", response_model=DashboardInsightsResponse)
def get_dashboard_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get aggregated dashboard insights including urgent items, suggestions, and stats.

    Returns:
        DashboardInsightsResponse with:
        - urgent_items: List of items requiring immediate attention (expiring soon, low stock)
        - suggestions: List of personalized recommendations
        - stats: Dashboard statistics (lists, items, meals, etc.)
    """
    # Get user's household IDs
    household_ids = get_user_household_ids(db, current_user.id)

    # Get urgent items
    urgent_items = get_urgent_items(db, household_ids)

    # Get suggestions
    suggestions = get_suggestions(db, household_ids, urgent_items)

    # Get stats
    stats = get_dashboard_stats(db, household_ids)

    return DashboardInsightsResponse(
        urgent_items=urgent_items,
        suggestions=suggestions,
        stats=stats,
    )

