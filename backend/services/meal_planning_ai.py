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
        db.query(PantryItem).filter(PantryItem.household_id == household_id).all()
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
        items = db.query(GroceryItem).filter(GroceryItem.list_id == gl.id).all()
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
            logger.warning(
                f"Failed to fetch weather for zip {preferences.zip_code}: {e}"
            )

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
    context: Dict[str, Any],
    user_message: str,
    conversation_history: List[Dict[str, str]],
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
        """You are an executive chef and strategic meal planning assistant. Your role is to optimize meal planning for efficiency, cost-effectiveness, and minimal grocery shopping while ensuring delicious, satisfying meals.

**CORE PLANNING STRATEGY:**
1. **Strategic Meal Count**: Plan 1-3 main dinners per week for "normal" nights (excluding eating out). These meals should be designed to create strategic leftovers that cover additional meals.
2. **Protein Optimization**: CRITICAL - Avoid suggesting multiple different proteins in one week. Reuse the same protein across 1-3 meals (e.g., one large roast chicken used for multiple dishes, or ground beef for tacos then spaghetti). This minimizes grocery purchases and reduces waste.
3. **Portion Planning**: All meals should be sized for 2 adults with intentional leftovers. Plan large-batch recipes that naturally create leftovers for subsequent meals.
4. **Pantry-First Approach**: Prioritize using existing pantry items before suggesting new purchases. When new ingredients are needed, choose versatile items that can be used across multiple meals.
5. **Leftover Strategy**: Design meals that create strategic leftovers - either explicit leftover transformations (e.g., "Monday's roast chicken → Tuesday's chicken salad") or large-batch recipes that naturally yield multiple servings.
6. **Ingredient Reuse**: Maximize ingredient reuse across the 1-3 main meals. If suggesting ground beef, use it in multiple dishes. If suggesting vegetables, plan multiple ways to use them.
7. **Cost Efficiency**: Minimize the total number of unique ingredients needed. A well-planned week should require fewer grocery items, not more.
8. **Dietary Preferences**: Respect dietary preferences and available cooking equipment from user preferences.
9. **Meal Variety**: Avoid recently made meals (check previous_meals in preferences) while maintaining ingredient efficiency.
10. **Weather Consideration**: Consider weather when relevant (e.g., hot soups on cold days, grilling on nice days).

**IMPORTANT: Meal Category Recognition**
You must recognize when the user indicates they are eating out, dining at a restaurant, getting takeout, or ordering food. When you detect phrases like:
- "eating out", "dining out", "dining at a restaurant"
- "takeout", "takeout for lunch", "getting takeout"
- "fast food", "fast food breakfast", "drive-thru"
- "ordering in", "ordering in pizza", "delivery"
- "restaurant", "cafe breakfast", "sushi place", "noodle shop", "bakery"
- "grabbing lunch out", "getting burgers from a drive-thru", "had ramen at a noodle shop"

You MUST set the meal_category to "eat_out" for that meal. For quick/easy home-cooked meals, use "quick_meal". For regular home-cooked meals, use "normal".

**PLANNING APPROACH:**
- When planning a week, think like an executive chef: "What's the minimum set of proteins and ingredients I need to create 1-3 delicious main meals that will feed 2 adults with leftovers?"
- Group meals by shared proteins and ingredients. For example: "Ground beef week" (tacos, spaghetti, chili) or "Chicken week" (roast chicken, chicken salad, chicken soup).
- In the notes field, include leftover strategy suggestions when relevant (e.g., "Make extra for chicken salad tomorrow" or "Leftovers work great for lunch").

**RECIPE INSTRUCTIONS FORMAT (for home-cooked meals):**
When providing notes for home-cooked meals (meal_category: "normal" or "quick_meal"), format them as structured recipe instructions:
1. Start with cook time: "Cook Time: [X] minutes" (or hours if applicable, e.g., "Cook Time: 1.5 hours")
2. Follow with step-by-step instructions, each clearly numbered: "Step 1:", "Step 2:", etc.
3. Include ingredients and measurements inline within each step instruction (e.g., "Step 1: Whisk 2 cups flour and 3 eggs together")
4. Derive ingredient measurements from the ingredients list and include them naturally in the step instructions
5. Each step should be a complete instruction that includes what ingredients to use and how to use them

Example format:
"Cook Time: 30 minutes

Step 1: Whisk 2 cups flour and 3 eggs together in a large bowl
Step 2: Fold in 1 cup spinach and 1/2 cup grated cheese
Step 3: Pour into greased pan and bake for 20 minutes at 375°F"

For eating out meals (meal_category: "eat_out"), use simple notes without recipe format.

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "meal_name": "string",
      "meal_type": "breakfast|lunch|dinner|snack",
      "day_of_week": 0-6 (0=Monday, 6=Sunday),
      "ingredients": ["list", "of", "ingredients"],
      "uses_pantry_items": ["list", "of", "pantry", "items", "used"],
      "notes": "string (optional: cooking tips, leftover strategy, ingredient reuse notes, dietary notes). For home-cooked meals, format as structured recipe instructions with cook time and step-by-step instructions. Format: 'Cook Time: [time] minutes\\n\\nStep 1: [instruction with inline ingredients and measurements]\\nStep 2: [instruction with inline ingredients and measurements]' (ingredients and measurements must be inline within each step, not listed separately)",
      "meal_category": "normal|quick_meal|eat_out"
    }
  ]
}

meal_category values:
- "normal": Regular home-cooked meals (default) - these are your 1-3 strategic main dinners
- "quick_meal": Quick and easy home-cooked meals
- "eat_out": Restaurant meals, takeout, fast food, ordering in, or any meal not cooked at home

**CRITICAL RULES FOR SUGGESTING MEALS:**
1. **Count existing "normal" meals first**: Check the "Current Week's Meals" section and count how many meals have meal_category="normal". 
2. **Respect the 1-3 limit**: If there are already 1-3 normal meals planned, DO NOT suggest additional normal meals unless the user explicitly asks for more or to replace existing meals.
3. **Only suggest for empty days**: Only suggest meals for days that don't already have meals of that type, unless the user explicitly asks to replace existing meals.
4. **If limit reached, return empty suggestions**: If the strategic limit (1-3 normal meals) is already met, return an empty suggestions array: {"suggestions": []} with a note explaining why.

Focus on strategic, efficient meal planning that minimizes grocery shopping while maximizing satisfaction."""
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
        # Count meals by category for strategic planning
        normal_count = sum(1 for m in meals if m.get("meal_category") == "normal")
        quick_meal_count = sum(
            1 for m in meals if m.get("meal_category") == "quick_meal"
        )
        eat_out_count = sum(1 for m in meals if m.get("meal_category") == "eat_out")

        prompt_parts.append(
            f"**Meal Summary:** {normal_count} normal meal(s), {quick_meal_count} quick meal(s), {eat_out_count} eat out meal(s)"
        )
        prompt_parts.append(
            "**CRITICAL:** You should plan 1-3 main 'normal' dinners per week. "
            f"If there are already {normal_count} normal meal(s), you should NOT suggest additional normal meals "
            "unless the user explicitly asks for more or to replace existing meals."
        )

        for meal in meals:
            day_names = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ]
            day_name = day_names[meal.get("day_of_week", 0)]
            meal_category = meal.get("meal_category", "normal")
            meal_str = f"- {day_name} {meal.get('meal_type', 'meal')}: {meal.get('name', 'Unnamed')} [category: {meal_category}]"
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
            prompt_parts.append(
                f"- {gl.get('name', 'Unnamed')}: {', '.join(gl.get('items', []))}"
            )
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
            model="claude-sonnet-4-20250514",  # Updated to current recommended model (claude-3-5-sonnet-20241022 was deprecated)
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
        if not hasattr(response, "content") or not response.content:
            raise ValueError(
                "Invalid response format from LLM - no content attribute or content is empty"
            )

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
            original_text = text_content
            text_content = text_content.strip()

            # Store original for fallback
            original_stripped = text_content

            if "```json" in text_content:
                # Extract JSON from markdown code block
                start = text_content.find("```json") + 7
                end = text_content.find("```", start)
                if end != -1:
                    extracted = text_content[start:end].strip()
                    # Only use extracted if it's not empty
                    if extracted:
                        text_content = extracted
                    else:
                        text_content = original_stripped
            elif "```" in text_content:
                # Extract from generic code block
                start = text_content.find("```") + 3
                end = text_content.find("```", start)
                if end != -1:
                    extracted = text_content[start:end].strip()
                    # Only use extracted if it's not empty
                    if extracted:
                        text_content = extracted
                    else:
                        text_content = original_stripped

            # Check if text_content is empty before parsing
            if not text_content:
                raise ValueError(
                    f"Empty text content after extraction - LLM response may be malformed. Original response length: {len(original_text)}"
                )

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

        # Fallback: if settings value is empty, read directly from environment
        if not api_key or (isinstance(api_key, str) and api_key.strip() == ""):
            import os as _os_env

            if "ANTHROPIC_API_KEY" in _os_env.environ:
                api_key = _os_env.environ["ANTHROPIC_API_KEY"].strip()

    # Gather context
    context = gather_meal_planning_context(db, household_id, user_id, week_start_date)

    # Format prompt
    prompt = format_meal_planning_prompt(context, user_message, conversation_history)

    # Call API
    response = call_anthropic_api(prompt, api_key)

    # Parse response
    result = parse_llm_response(response)

    return result
