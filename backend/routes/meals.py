"""Meal planner routes for managing weekly meal plans."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta

from database import get_db
from middleware.auth import get_current_user
from middleware.permissions import require_household_member
from models.user import User
from models.meal import Meal
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem
from schemas.meal import (
    MealCreate,
    MealUpdate,
    MealResponse,
    WeeklyPlanResponse,
    GenerateGroceryListRequest,
    GenerateGroceryListResponse,
)

router = APIRouter(tags=["meals"])


def get_week_start_monday(input_date: date) -> date:
    """Get the Monday of the week for a given date."""
    # Calculate days since Monday (0 = Monday, 6 = Sunday)
    days_since_monday = input_date.weekday()
    week_start = input_date - timedelta(days=days_since_monday)
    return week_start


def parse_ingredients(ingredients_str: str) -> List[str]:
    """Parse ingredients string into list of individual ingredients."""
    if not ingredients_str:
        return []

    # Try splitting by newlines first (for list format)
    if "\n" in ingredients_str:
        items = [item.strip() for item in ingredients_str.split("\n")]
    else:
        # Split by comma for comma-separated format
        items = [item.strip() for item in ingredients_str.split(",")]

    # Clean up items: remove empty strings, bullet points, numbers
    cleaned_items = []
    for item in items:
        if not item:
            continue
        # Remove common prefixes like "- ", "* ", "1. ", etc.
        item = item.lstrip("- *•")
        item = item.strip()
        # Remove leading numbers and dots
        while item and item[0].isdigit():
            item = item[1:].lstrip(". ")
        if item:
            cleaned_items.append(item)

    return cleaned_items


@router.get("/meals/week", response_model=WeeklyPlanResponse)
async def get_weekly_meals(
    date: date = Query(..., description="Any date within the target week (YYYY-MM-DD)"),
    household_id: int = Query(..., description="Household ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all meals for a specific week.

    The week is calculated as Monday through Sunday based on the provided date.
    """
    # Check permission: user must be a household member
    require_household_member(db, household_id, current_user)

    # Calculate the Monday of the week
    week_start = get_week_start_monday(date)

    # Query meals for this week and household
    meals = (
        db.query(Meal)
        .filter(Meal.household_id == household_id, Meal.week_start_date == week_start)
        .order_by(Meal.day_of_week, Meal.meal_type)
        .all()
    )

    return WeeklyPlanResponse(
        week_start_date=week_start, household_id=household_id, meals=meals
    )


@router.get("/meals/{meal_id}", response_model=MealResponse)
async def get_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific meal by ID."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )

    # Check permission: user must be a household member
    require_household_member(db, meal.household_id, current_user)

    return meal


@router.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def create_meal(
    meal_data: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meal in the meal planner."""
    # Check permission: user must be a household member
    require_household_member(db, meal_data.household_id, current_user)

    # Ensure week_start_date is a Monday
    week_start = get_week_start_monday(meal_data.week_start_date)

    meal = Meal(
        household_id=meal_data.household_id,
        meal_type=meal_data.meal_type,
        day_of_week=meal_data.day_of_week,
        week_start_date=week_start,
        name=meal_data.name,
        ingredients=meal_data.ingredients,
        notes=meal_data.notes,
    )

    db.add(meal)
    db.commit()
    db.refresh(meal)

    return meal


@router.put("/meals/{meal_id}", response_model=MealResponse)
async def update_meal(
    meal_id: int,
    meal_data: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing meal."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )

    # Check permission: user must be a household member
    require_household_member(db, meal.household_id, current_user)

    # Update only provided fields
    update_data = meal_data.model_dump(exclude_unset=True)

    # If week_start_date is being updated, ensure it's a Monday
    if "week_start_date" in update_data and update_data["week_start_date"]:
        update_data["week_start_date"] = get_week_start_monday(
            update_data["week_start_date"]
        )

    for field, value in update_data.items():
        setattr(meal, field, value)

    db.commit()
    db.refresh(meal)

    return meal


@router.delete("/meals/{meal_id}")
async def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a meal from the meal planner."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )

    # Check permission: user must be a household member
    require_household_member(db, meal.household_id, current_user)

    db.delete(meal)
    db.commit()

    return {"message": "Meal deleted successfully"}


@router.post(
    "/meals/generate-grocery-list",
    response_model=GenerateGroceryListResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_grocery_list(
    request: GenerateGroceryListRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a grocery list from meals in a specific week.

    This endpoint:
    1. Finds all meals for the specified week
    2. Extracts ingredients from each meal
    3. Creates a new grocery list with those ingredients as items
    """
    # Check permission: user must be a household member
    require_household_member(db, request.household_id, current_user)

    # Calculate the Monday of the week
    week_start = get_week_start_monday(request.week_start_date)

    # Get all meals for this week
    meals = (
        db.query(Meal)
        .filter(
            Meal.household_id == request.household_id,
            Meal.week_start_date == week_start,
        )
        .all()
    )

    # Create the grocery list
    grocery_list = GroceryList(
        household_id=request.household_id,
        name=request.grocery_list_name,
        created_by=current_user.id,
    )
    db.add(grocery_list)
    db.commit()
    db.refresh(grocery_list)

    # Parse ingredients from all meals and create grocery items with meal type
    items_count = 0
    for meal in meals:
        if meal.ingredients:
            ingredients = parse_ingredients(meal.ingredients)
            for ingredient in ingredients:
                if ingredient:  # Skip empty strings
                    grocery_item = GroceryItem(
                        list_id=grocery_list.id,
                        name=ingredient,
                        quantity="",  # User can update quantity later
                        category="Uncategorized",
                        meal_type=meal.meal_type,
                        checked=False,
                    )
                    db.add(grocery_item)
                    items_count += 1

    db.commit()

    return GenerateGroceryListResponse(
        grocery_list_id=grocery_list.id,
        items_count=items_count,
        message=f"Successfully generated grocery list with {items_count} items from {len(meals)} meals",
    )
