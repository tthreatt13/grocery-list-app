"""AI service for grocery list dietary review using Anthropic Claude API."""

import logging
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from config import settings
from services.anthropic_client import call_anthropic_api, extract_json_from_response

logger = logging.getLogger(__name__)


def gather_grocery_review_context(
    db: Session, household_id: int, user_id: int, list_id: int
) -> Dict[str, Any]:
    """Gather context for grocery list dietary review."""
    from models.grocery_list import GroceryList
    from models.grocery_item import GroceryItem
    from models.household_user_preferences import HouseholdUserPreferences
    from models.pantry_item import PantryItem
    from models.meal import Meal
    from models.household import Household

    grocery_list = (
        db.query(GroceryList)
        .filter(GroceryList.id == list_id, GroceryList.household_id == household_id)
        .first()
    )
    if not grocery_list:
        raise ValueError("Grocery list not found")

    items = db.query(GroceryItem).filter(GroceryItem.list_id == list_id).all()
    items_data = [
        {
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "category": item.category,
            "meal_type": item.meal_type,
            "checked": item.checked,
            "notes": item.notes,
        }
        for item in items
    ]

    prefs = (
        db.query(HouseholdUserPreferences)
        .filter(
            HouseholdUserPreferences.household_id == household_id,
            HouseholdUserPreferences.user_id == user_id,
        )
        .first()
    )
    preferences_data: Dict[str, Any] = {}
    if prefs:
        preferences_data = {
            "diet_types": prefs.diet_types or [],
            "cooking_apparatus": prefs.cooking_apparatus or [],
            "previous_meals": prefs.previous_meals or [],
        }

    pantry_items = (
        db.query(PantryItem).filter(PantryItem.household_id == household_id).all()
    )
    pantry_data = [
        {
            "name": item.name,
            "quantity": item.quantity,
            "category": item.category,
        }
        for item in pantry_items
    ]

    week_start = date.today() - timedelta(days=date.today().weekday())
    meals = (
        db.query(Meal)
        .filter(
            Meal.household_id == household_id,
            Meal.week_start_date == week_start,
        )
        .all()
    )
    meals_data = [
        {
            "name": meal.name,
            "meal_type": meal.meal_type,
            "day_of_week": meal.day_of_week,
            "ingredients": meal.ingredients,
        }
        for meal in meals
    ]

    household = db.query(Household).filter(Household.id == household_id).first()
    household_name = household.name if household else "Household"

    return {
        "household_name": household_name,
        "list_name": grocery_list.name,
        "list_id": list_id,
        "items": items_data,
        "preferences": preferences_data,
        "pantry_items": pantry_data,
        "meals": meals_data,
    }


def format_grocery_review_prompt(
    context: Dict[str, Any],
    user_message: str,
    conversation_history: List[Dict[str, str]],
) -> str:
    """Format prompt for grocery list dietary gap analysis."""
    prompt_parts = [
        "You are a helpful grocery list dietary advisor for busy parents.",
        "Review the grocery list for dietary gaps and provide actionable suggestions.",
        "",
        "## Instructions",
        "- Provide qualitative gap analysis by default (food groups, balance, missing categories).",
        "- Only include numeric nutritional detail (calories, macros) if the user explicitly asks.",
        "- Return suggestions as add, remove, or swap actions.",
        "- For remove/swap, include target_item_id matching an item id from the list.",
        "",
        "## Response Format",
        "Respond with ONLY valid JSON in this shape:",
        "{",
        '  "gap_analysis": "qualitative summary of gaps and balance",',
        '  "suggestions": [',
        "    {",
        '      "action": "add|remove|swap",',
        '      "name": "item name",',
        '      "quantity": "optional quantity string",',
        '      "category": "optional category",',
        '      "meal_type": "optional meal type",',
        '      "target_item_id": null,',
        '      "reason": "why this helps"',
        "    }",
        "  ]",
        "}",
        "",
        f"## Household: {context.get('household_name', 'Household')}",
        f"## Grocery List: {context.get('list_name', 'Unnamed')} (id: {context.get('list_id')})",
    ]

    items = context.get("items", [])
    if items:
        prompt_parts.append("\n## Current List Items")
        for item in items:
            meal_tag = f", meal: {item['meal_type']}" if item.get("meal_type") else ""
            qty = item.get("quantity") or ""
            prompt_parts.append(
                f"- [id={item['id']}] {item['name']} {qty}{meal_tag}".strip()
            )
    else:
        prompt_parts.append("\n## Current List Items\n(empty list)")

    preferences = context.get("preferences", {})
    if preferences.get("diet_types"):
        prompt_parts.append(
            f"\n## Dietary Preferences\n- Diet types: {', '.join(preferences['diet_types'])}"
        )
    if preferences.get("cooking_apparatus"):
        prompt_parts.append(
            f"- Cooking equipment: {', '.join(preferences['cooking_apparatus'])}"
        )

    meals = context.get("meals", [])
    if meals:
        prompt_parts.append("\n## This Week's Meal Plan")
        for meal in meals:
            prompt_parts.append(
                f"- {meal.get('meal_type', 'meal')}: {meal.get('name', 'Unnamed')}"
            )

    pantry = context.get("pantry_items", [])
    if pantry:
        prompt_parts.append("\n## Pantry Inventory (reference)")
        for item in pantry[:20]:
            prompt_parts.append(f"- {item.get('name', 'item')}")

    if conversation_history:
        prompt_parts.append("\n## Previous Conversation")
        for msg in conversation_history[-5:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.capitalize()}: {content}")

    prompt_parts.append(f"\n## User Request\n{user_message}")

    return "\n".join(prompt_parts)


def parse_grocery_review_response(response: Any) -> Dict[str, Any]:
    """Parse LLM response into gap analysis and suggestions."""
    parsed = extract_json_from_response(response)

    if "gap_analysis" not in parsed:
        raise ValueError("Response missing 'gap_analysis' key")

    if "suggestions" not in parsed:
        raise ValueError("Response missing 'suggestions' key")

    if not isinstance(parsed["suggestions"], list):
        raise ValueError("'suggestions' must be a list")

    return parsed


def _resolve_api_key(api_key: Optional[str]) -> str:
    if api_key:
        return api_key

    resolved = settings.anthropic_api_key
    if not resolved or (isinstance(resolved, str) and resolved.strip() == ""):
        import os as _os_env

        if "ANTHROPIC_API_KEY" in _os_env.environ:
            resolved = _os_env.environ["ANTHROPIC_API_KEY"].strip()

    return resolved


def review_grocery_list(
    db: Session,
    household_id: int,
    user_id: int,
    list_id: int,
    user_message: str,
    conversation_history: List[Dict[str, str]],
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Review a grocery list for dietary gaps and return suggestions."""
    resolved_key = _resolve_api_key(api_key)
    context = gather_grocery_review_context(db, household_id, user_id, list_id)
    prompt = format_grocery_review_prompt(context, user_message, conversation_history)
    response = call_anthropic_api(prompt, resolved_key, settings.anthropic_model)
    return parse_grocery_review_response(response)
