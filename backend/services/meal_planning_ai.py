"""AI service for meal planning using Anthropic Claude API."""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import date, timedelta
from sqlalchemy.orm import Session

from anthropic import Anthropic
from config import settings
from services.weather import get_weather_forecast

logger = logging.getLogger(__name__)


def gather_meal_planning_context(
    db: Session, household_id: int, user_id: int, week_start_date: date
) -> Dict[str, Any]:
    """
    Gather all context data needed for meal planning.

    Collects:
    - Pantry inventory
    - Current week's meals
    - User preferences
    - Active grocery lists
    - Weather forecast (if zip code available)
    - Household information

    Args:
        db: Database session
        household_id: Household ID
        user_id: User ID
        week_start_date: Monday date of the target week

    Returns:
        Dictionary containing all context data
    """
    from models.pantry_item import PantryItem
    from models.meal import Meal
    from models.household_user_preferences import HouseholdUserPreferences
    from models.grocery_list import GroceryList
    from models.grocery_item import GroceryItem
    from models.household import Household

    # Get household info
    household = db.query(Household).filter(Household.id == household_id).first()
    household_name = household.name if household else "Household"

    # Get pantry items
    pantry_items = (
        db.query(PantryItem)
        .filter(PantryItem.household_id == household_id)
        .all()
    )
    pantry_data = [
        {
            "name": item.name,
            "quantity": item.quantity,
            "category": item.category,
            "expiration_date": (
                item.expiration_date.isoformat() if item.expiration_date else None
            ),
        }
        for item in pantry_items
    ]

    # Get current week's meals
    meals = (
        db.query(Meal)
        .filter(
            Meal.household_id == household_id,
            Meal.week_start_date == week_start_date,
        )
        .all()
    )
    meals_data = [
        {
            "name": meal.name,
            "meal_type": meal.meal_type,
            "day_of_week": meal.day_of_week,
            "ingredients": meal.ingredients,
            "notes": meal.notes,
            "meal_category": meal.meal_category,
        }
        for meal in meals
    ]

    # Get user preferences
    preferences = (
        db.query(HouseholdUserPreferences)
        .filter(
            HouseholdUserPreferences.household_id == household_id,
            HouseholdUserPreferences.user_id == user_id,
        )
        .first()
    )
    preferences_data = None
    if preferences:
        preferences_data = {
            "diet_types": preferences.diet_types or [],
            "cooking_apparatus": preferences.cooking_apparatus or [],
            "previous_meals": preferences.previous_meals or [],
            "zip_code": preferences.zip_code,
        }

    # Get active grocery lists
    grocery_lists = (
        db.query(GroceryList)
        .filter(
            GroceryList.household_id == household_id,
            GroceryList.is_archived == False,  # noqa: E712
        )
        .all()
    )
    grocery_lists_data = []
    for gl in grocery_lists:
        items = (
            db.query(GroceryItem)
            .filter(GroceryItem.list_id == gl.id)
            .all()
        )
        grocery_lists_data.append(
            {
                "name": gl.name,
                "items": [item.name for item in items],
            }
        )

    # Get weather forecast if zip code is available
    weather_data = None
    if preferences and preferences.zip_code:
        try:
            weather_forecast = get_weather_forecast(preferences.zip_code)
            weather_data = weather_forecast
        except Exception as e:
            logger.warning(f"Failed to fetch weather for zip {preferences.zip_code}: {e}")

    # Calculate week end date (Sunday)
    week_end_date = week_start_date + timedelta(days=6)

    return {
        "pantry_items": pantry_data,
        "meals": meals_data,
        "preferences": preferences_data,
        "grocery_lists": grocery_lists_data,
        "weather": weather_data,
        "household_name": household_name,
        "week_start_date": week_start_date.isoformat(),
        "week_end_date": week_end_date.isoformat(),
    }


def format_meal_planning_prompt(
    context: Dict[str, Any], user_message: str, conversation_history: List[Dict[str, str]]
) -> str:
    """
    Format context and user message into a prompt for the LLM.

    Args:
        context: Context data from gather_meal_planning_context
        user_message: Current user message
        conversation_history: Previous conversation messages

    Returns:
        Formatted prompt string
    """
    prompt_parts = []

    # System instruction
    prompt_parts.append(
        """You are a meal planning assistant for a grocery list app. Help the user plan meals for the week.

Your goal is to suggest practical, delicious meals that:
1. Use pantry items when possible to reduce waste and save money
2. Suggest additional ingredients for shopping when needed
3. Focus on dinners that create leftovers for lunch (efficient meal planning)
4. Consider dietary preferences and available cooking equipment
5. Avoid recently made meals (check previous_meals in preferences)
6. Consider weather when relevant (e.g., hot soups on cold days, grilling on nice days)

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "meal_name": "string",
      "meal_type": "breakfast|lunch|dinner|snack",
      "day_of_week": 0-6 (0=Monday, 6=Sunday),
      "ingredients": ["list", "of", "ingredients"],
      "uses_pantry_items": ["list", "of", "pantry", "items", "used"],
      "notes": "string (optional cooking tips, dietary notes, etc.)"
    }
  ]
}

Only suggest meals for days that don't already have meals of that type, unless the user explicitly asks to replace existing meals."""
    )

    # Add context
    prompt_parts.append("\n## Context\n")

    # Household info
    prompt_parts.append(f"**Household:** {context.get('household_name', 'Unknown')}")
    prompt_parts.append(
        f"**Target Week:** {context.get('week_start_date')} to {context.get('week_end_date')}"
    )

    # Pantry items
    pantry_items = context.get("pantry_items", [])
    if pantry_items:
        prompt_parts.append("\n**Pantry Inventory:**")
        for item in pantry_items:
            item_str = f"- {item['name']}"
            if item.get("quantity"):
                item_str += f" ({item['quantity']})"
            if item.get("category"):
                item_str += f" - {item['category']}"
            prompt_parts.append(item_str)
    else:
        prompt_parts.append("\n**Pantry Inventory:** (empty)")

    # Current meals
    meals = context.get("meals", [])
    if meals:
        prompt_parts.append("\n**Current Week's Meals:**")
        for meal in meals:
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_name = day_names[meal.get("day_of_week", 0)]
            meal_str = f"- {day_name} {meal.get('meal_type', 'meal')}: {meal.get('name', 'Unnamed')}"
            if meal.get("ingredients"):
                meal_str += f" (ingredients: {meal['ingredients']})"
            prompt_parts.append(meal_str)
    else:
        prompt_parts.append("\n**Current Week's Meals:** (none planned yet)")

    # Preferences
    preferences = context.get("preferences")
    if preferences:
        prompt_parts.append("\n**User Preferences:**")
        if preferences.get("diet_types"):
            prompt_parts.append(f"- Diet types: {', '.join(preferences['diet_types'])}")
        if preferences.get("cooking_apparatus"):
            prompt_parts.append(
                f"- Available cooking equipment: {', '.join(preferences['cooking_apparatus'])}"
            )
        if preferences.get("previous_meals"):
            prompt_parts.append(
                f"- Recently made meals (avoid these): {', '.join(preferences['previous_meals'])}"
            )
    else:
        prompt_parts.append("\n**User Preferences:** (none set)")

    # Grocery lists
    grocery_lists = context.get("grocery_lists", [])
    if grocery_lists:
        prompt_parts.append("\n**Active Grocery Lists:**")
        for gl in grocery_lists:
            prompt_parts.append(f"- {gl.get('name', 'Unnamed')}: {', '.join(gl.get('items', []))}")
    else:
        prompt_parts.append("\n**Active Grocery Lists:** (none)")

    # Weather
    weather = context.get("weather")
    if weather:
        prompt_parts.append("\n**7-Day Weather Forecast:**")
        for day in weather[:7]:  # Limit to 7 days
            weather_str = f"- {day.get('date')}: {day.get('condition', 'N/A')}"
            if day.get("high_temp"):
                weather_str += f", High: {day['high_temp']}°F"
            if day.get("low_temp"):
                weather_str += f", Low: {day['low_temp']}°F"
            if day.get("precipitation_chance"):
                weather_str += f", Rain: {day['precipitation_chance']}%"
            prompt_parts.append(weather_str)
    else:
        prompt_parts.append("\n**Weather Forecast:** (not available)")

    # Conversation history
    if conversation_history:
        prompt_parts.append("\n## Previous Conversation")
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.capitalize()}: {content}")

    # User message
    prompt_parts.append(f"\n## User Request\n{user_message}")

    return "\n".join(prompt_parts)


def call_anthropic_api(prompt: str, api_key: str) -> Any:
    """
    Call Anthropic Claude API with the formatted prompt.

    Args:
        prompt: Formatted prompt string
        api_key: Anthropic API key

    Returns:
        API response object

    Raises:
        ValueError: If API key is missing
        Exception: If API call fails
    """
    if not api_key:
        raise ValueError("Anthropic API key is required")

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Using Sonnet for cost/performance balance
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            timeout=60.0,  # 60 second timeout
        )
        return response
    except Exception as e:
        logger.error(f"Anthropic API call failed: {e}")
        raise


def parse_llm_response(response: Any) -> Dict[str, List[Dict[str, Any]]]:
    """
    Parse LLM response into structured meal suggestions.

    Args:
        response: Anthropic API response object

    Returns:
        Dictionary with 'suggestions' key containing list of meal suggestions

    Raises:
        ValueError: If response cannot be parsed or is invalid
    """
    try:
        # Extract text from response
        if hasattr(response, "content") and response.content:
            text_content = ""
            for content_block in response.content:
                if hasattr(content_block, "text"):
                    text_content += content_block.text
                elif isinstance(content_block, dict) and "text" in content_block:
                    text_content += content_block["text"]

            if not text_content:
                raise ValueError("Empty response from LLM")

            # Try to extract JSON from the response (might be wrapped in markdown code blocks)
            text_content = text_content.strip()
            if "```json" in text_content:
                # Extract JSON from markdown code block
                start = text_content.find("```json") + 7
                end = text_content.find("```", start)
                if end != -1:
                    text_content = text_content[start:end].strip()
            elif "```" in text_content:
                # Extract from generic code block
                start = text_content.find("```") + 3
                end = text_content.find("```", start)
                if end != -1:
                    text_content = text_content[start:end].strip()

            # Parse JSON
            parsed = json.loads(text_content)

            if "suggestions" not in parsed:
                raise ValueError("Response missing 'suggestions' key")

            if not isinstance(parsed["suggestions"], list):
                raise ValueError("'suggestions' must be a list")

            return parsed

        else:
            raise ValueError("Invalid response format from LLM")

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM response: {e}")
        raise ValueError(f"Could not parse JSON response from LLM: {e}")
    except Exception as e:
        logger.error(f"Failed to parse LLM response: {e}")
        raise


def suggest_meals(
    db: Session,
    household_id: int,
    user_id: int,
    week_start_date: date,
    user_message: str,
    conversation_history: List[Dict[str, str]],
    api_key: Optional[str] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Main function to suggest meals using AI.

    Orchestrates the entire flow:
    1. Gather context
    2. Format prompt
    3. Call Anthropic API
    4. Parse response

    Args:
        db: Database session
        household_id: Household ID
        user_id: User ID
        week_start_date: Monday date of the target week
        user_message: User's message/request
        conversation_history: Previous conversation messages
        api_key: Optional API key (uses settings if not provided)

    Returns:
        Dictionary with 'suggestions' key containing meal suggestions

    Raises:
        ValueError: If API key is missing or response is invalid
        Exception: If API call fails
    """
    # Use provided API key or fall back to settings
    if api_key is None:
        api_key = settings.anthropic_api_key

    # Gather context
    context = gather_meal_planning_context(db, household_id, user_id, week_start_date)

    # Format prompt
    prompt = format_meal_planning_prompt(context, user_message, conversation_history)

    # Call API
    response = call_anthropic_api(prompt, api_key)

    # Parse response
    result = parse_llm_response(response)

    return result
