"""Meal planner routes for managing weekly meal plans."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import date, timedelta

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
    AISuggestRequest,
    AISuggestResponse,
    MealSuggestion,
    ChatMessage,
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


@router.get("/meals/all", response_model=List[MealResponse])
async def get_all_meals(
    household_id: int = Query(..., description="Household ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all meals for a household (for diagnostic purposes).

    This endpoint returns all meals for a household regardless of week,
    useful for debugging date-related issues.
    """
    # Check permission: user must be a household member
    require_household_member(db, household_id, current_user)

    meals = (
        db.query(Meal)
        .filter(Meal.household_id == household_id)
        .order_by(Meal.week_start_date, Meal.day_of_week, Meal.meal_type)
        .all()
    )

    return meals


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
        meal_category=meal_data.meal_category or "normal",
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

    # Get all meals for this week, excluding "eat_out" meals
    meals = (
        db.query(Meal)
        .filter(
            Meal.household_id == request.household_id,
            Meal.week_start_date == week_start,
            # Exclude "eat_out" meals from grocery list generation
            or_(
                Meal.meal_category != "eat_out",
                Meal.meal_category.is_(None),
            ),
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
        message=(
            f"Successfully generated grocery list with {items_count} items "
            f"from {len(meals)} meals"
        ),
    )


@router.post("/meals/ai-suggest", response_model=AISuggestResponse)
async def ai_suggest_meals(
    request: AISuggestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-generated meal suggestions using Anthropic Claude API.

    This endpoint:
    1. Gathers context (pantry, meals, preferences, weather, etc.)
    2. Formats a prompt for the LLM
    3. Calls Anthropic API
    4. Returns structured meal suggestions

    The response includes meal suggestions and updated conversation history.
    """
    # Check permission: user must be a household member
    require_household_member(db, request.household_id, current_user)

    # Ensure week_start_date is a Monday
    week_start = get_week_start_monday(request.week_start_date)

    # Convert conversation history to format expected by service
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.conversation_history
    ]

    try:
        from services.meal_planning_ai import suggest_meals
        from config import settings

        # #region agent log
        import logging

        _logger = logging.getLogger(__name__)
        try:
            import json
            import time
            import os as _os

            _log_paths = [
                "/Users/tonythreatt/git/grocery-list-app/.cursor/debug.log",
                _os.path.join(
                    _os.path.dirname(_os.path.dirname(__file__)), ".cursor", "debug.log"
                ),
                ".cursor/debug.log",
            ]
            _log_data = {
                "location": "meals.py:345",
                "message": "Route handler accessing settings.anthropic_api_key",
                "data": {
                    "settings_anthropic_api_key_exists": bool(
                        settings.anthropic_api_key
                    ),
                    "settings_anthropic_api_key_length": len(
                        settings.anthropic_api_key
                    ),
                    "settings_anthropic_api_key_empty": settings.anthropic_api_key
                    == "",
                    "raw_env_ANTHROPIC_API_KEY_exists": "ANTHROPIC_API_KEY"
                    in _os.environ,
                    "raw_env_ANTHROPIC_API_KEY_length": (
                        len(_os.environ.get("ANTHROPIC_API_KEY", ""))
                        if "ANTHROPIC_API_KEY" in _os.environ
                        else 0
                    ),
                },
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "E",
            }
            _logger.error(
                f"[DEBUG] ANTHROPIC_API_KEY check - settings.anthropic_api_key exists: {bool(settings.anthropic_api_key)}, length: {len(settings.anthropic_api_key)}, raw env exists: {'ANTHROPIC_API_KEY' in _os.environ}, raw env length: {len(_os.environ.get('ANTHROPIC_API_KEY', '')) if 'ANTHROPIC_API_KEY' in _os.environ else 0}"
            )
            for _lp in _log_paths:
                try:
                    _os.makedirs(_os.path.dirname(_lp), exist_ok=True)
                    with open(_lp, "a") as f:
                        f.write(json.dumps(_log_data) + "\n")
                    break
                except:
                    continue
        except Exception as _e:
            _logger.error(f"[DEBUG] Failed to log API key check: {_e}")
        # #endregion

        # Call AI service
        result = suggest_meals(
            db=db,
            household_id=request.household_id,
            user_id=current_user.id,
            week_start_date=week_start,
            user_message=request.user_message,
            conversation_history=conversation_history,
            api_key=settings.anthropic_api_key,
        )

        # Convert suggestions to MealSuggestion objects
        suggestions = [
            MealSuggestion(
                meal_name=suggestion.get("meal_name", ""),
                meal_type=suggestion.get("meal_type", "dinner"),
                day_of_week=suggestion.get("day_of_week", 0),
                ingredients=suggestion.get("ingredients", []),
                uses_pantry_items=suggestion.get("uses_pantry_items", []),
                notes=suggestion.get("notes"),
            )
            for suggestion in result.get("suggestions", [])
        ]

        # Update conversation history with user message and assistant response
        updated_history = request.conversation_history.copy()
        updated_history.append(ChatMessage(role="user", content=request.user_message))
        # Add assistant response summary
        updated_history.append(
            ChatMessage(
                role="assistant",
                content=f"I've suggested {len(suggestions)} meal(s) for your week.",
            )
        )

        return AISuggestResponse(
            suggestions=suggestions,
            conversation_history=updated_history,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request or API configuration: {str(e)}",
        )
    except Exception as e:
        # Log the error for debugging
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"AI meal suggestion failed: {e}", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate meal suggestions: {str(e)}",
        )
