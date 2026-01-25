"""Tests for meal planning AI service."""

import pytest
from unittest.mock import patch, Mock, MagicMock
from datetime import date, timedelta
from sqlalchemy.orm import Session

from services.meal_planning_ai import (
    gather_meal_planning_context,
    format_meal_planning_prompt,
    call_anthropic_api,
    parse_llm_response,
    suggest_meals,
)


class TestGatherMealPlanningContext:
    """Tests for context gathering functions."""

    def test_gather_meal_planning_context_with_all_data(
        self, db_session, sample_household, sample_user
    ):
        """Test gathering context with pantry, meals, preferences, and grocery lists."""
        from models.pantry_item import PantryItem
        from models.meal import Meal
        from models.household_user_preferences import HouseholdUserPreferences
        from models.grocery_list import GroceryList
        from models.grocery_item import GroceryItem

        # Create pantry items
        pantry_item = PantryItem(
            household_id=sample_household.id,
            name="Chicken Breast",
            quantity="2 lbs",
            category="Meat",
        )
        db_session.add(pantry_item)

        # Create meals
        week_start = date.today() - timedelta(days=date.today().weekday())
        meal = Meal(
            household_id=sample_household.id,
            meal_type="dinner",
            day_of_week=0,
            week_start_date=week_start,
            name="Spaghetti",
            ingredients="pasta, sauce",
        )
        db_session.add(meal)

        # Create preferences
        prefs = HouseholdUserPreferences(
            household_id=sample_household.id,
            user_id=sample_user.id,
            diet_types=["vegetarian"],
            cooking_apparatus=["oven", "stovetop"],
            zip_code="80202",
        )
        db_session.add(prefs)

        # Create grocery list
        grocery_list = GroceryList(
            household_id=sample_household.id,
            name="Weekly List",
            created_by=sample_user.id,
        )
        db_session.add(grocery_list)
        db_session.commit()

        context = gather_meal_planning_context(
            db_session, sample_household.id, sample_user.id, week_start
        )

        assert "pantry_items" in context
        assert "meals" in context
        assert "preferences" in context
        assert "grocery_lists" in context
        assert len(context["pantry_items"]) > 0
        assert len(context["meals"]) > 0

    def test_gather_meal_planning_context_empty_data(
        self, db_session, sample_household, sample_user
    ):
        """Test gathering context with no existing data."""
        week_start = date.today() - timedelta(days=date.today().weekday())

        context = gather_meal_planning_context(
            db_session, sample_household.id, sample_user.id, week_start
        )

        assert "pantry_items" in context
        assert "meals" in context
        assert "preferences" in context
        assert "grocery_lists" in context
        assert len(context["pantry_items"]) == 0
        assert len(context["meals"]) == 0


class TestFormatMealPlanningPrompt:
    """Tests for prompt formatting function."""

    def test_format_meal_planning_prompt_basic(self):
        """Test basic prompt formatting."""
        context = {
            "pantry_items": [],
            "meals": [],
            "preferences": None,
            "grocery_lists": [],
            "weather": None,
            "household_name": "Test Household",
        }
        user_message = "Suggest meals for this week"
        conversation_history = []

        prompt = format_meal_planning_prompt(
            context, user_message, conversation_history
        )

        assert isinstance(prompt, str)
        assert "meal planning assistant" in prompt.lower()
        assert user_message in prompt

    def test_format_meal_planning_prompt_with_context(self):
        """Test prompt formatting with full context."""
        context = {
            "pantry_items": [
                {"name": "Chicken", "quantity": "2 lbs", "category": "Meat"}
            ],
            "meals": [
                {
                    "name": "Spaghetti",
                    "meal_type": "dinner",
                    "day_of_week": 0,
                    "ingredients": "pasta, sauce",
                }
            ],
            "preferences": {
                "diet_types": ["vegetarian"],
                "cooking_apparatus": ["oven"],
            },
            "grocery_lists": [{"name": "Weekly List"}],
            "weather": None,
            "household_name": "Test Household",
        }
        user_message = "Suggest vegetarian meals"
        conversation_history = []

        prompt = format_meal_planning_prompt(
            context, user_message, conversation_history
        )

        assert "Chicken" in prompt or "pantry" in prompt.lower()
        assert "vegetarian" in prompt.lower()

    def test_format_meal_planning_prompt_includes_meal_category_instructions(self):
        """Test that prompt includes instructions for meal_category recognition."""
        context = {
            "pantry_items": [],
            "meals": [],
            "preferences": None,
            "grocery_lists": [],
            "weather": None,
            "household_name": "Test Household",
        }
        user_message = "Suggest meals"
        conversation_history = []

        prompt = format_meal_planning_prompt(
            context, user_message, conversation_history
        )

        # Check for meal_category in JSON structure
        assert "meal_category" in prompt.lower()
        # Check for eating out recognition instructions
        assert "eat_out" in prompt.lower() or "eating out" in prompt.lower()
        # Check for examples of eating out phrases
        assert (
            "restaurant" in prompt.lower()
            or "takeout" in prompt.lower()
            or "fast food" in prompt.lower()
        )

    def test_format_meal_planning_prompt_includes_eating_out_examples(self):
        """Test that prompt includes examples of eating out phrases."""
        context = {
            "pantry_items": [],
            "meals": [],
            "preferences": None,
            "grocery_lists": [],
            "weather": None,
            "household_name": "Test Household",
        }
        user_message = "Eating out"
        conversation_history = []

        prompt = format_meal_planning_prompt(
            context, user_message, conversation_history
        )

        # Check for various eating out phrase examples
        eating_out_indicators = [
            "eating out",
            "dining out",
            "restaurant",
            "takeout",
            "fast food",
            "ordering in",
            "grabbing lunch out",
        ]
        found_indicators = [
            indicator
            for indicator in eating_out_indicators
            if indicator in prompt.lower()
        ]
        assert (
            len(found_indicators) > 0
        ), f"Prompt should include eating out examples. Found: {found_indicators}"


class TestCallAnthropicAPI:
    """Tests for Anthropic API calling function."""

    @patch("services.meal_planning_ai.Anthropic")
    def test_call_anthropic_api_success(self, mock_anthropic_class):
        """Test successful API call."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text='{"suggestions": [{"meal_name": "Pasta", "meal_type": "dinner"}]}'
            )
        ]
        mock_client.messages.create.return_value = mock_response

        prompt = "Test prompt"
        api_key = "test-key"

        result = call_anthropic_api(prompt, api_key)

        assert result is not None
        mock_client.messages.create.assert_called_once()

    @patch("services.meal_planning_ai.Anthropic")
    def test_call_anthropic_api_missing_key(self, mock_anthropic_class):
        """Test API call with missing API key."""
        with pytest.raises(ValueError, match="API key"):
            call_anthropic_api("test prompt", "")

    @patch("services.meal_planning_ai.Anthropic")
    def test_call_anthropic_api_error(self, mock_anthropic_class):
        """Test API call with error handling."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client
        mock_client.messages.create.side_effect = Exception("API Error")

        with pytest.raises(Exception):
            call_anthropic_api("test prompt", "test-key")


class TestParseLLMResponse:
    """Tests for LLM response parsing."""

    def test_parse_llm_response_valid_json(self):
        """Test parsing valid JSON response."""
        response_text = """
        {
            "suggestions": [
                {
                    "meal_name": "Pasta Primavera",
                    "meal_type": "dinner",
                    "day_of_week": 0,
                    "ingredients": ["pasta", "vegetables", "olive oil"],
                    "uses_pantry_items": ["pasta"],
                    "notes": "Quick and healthy"
                }
            ]
        }
        """
        # Create mock response object
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = response_text.strip()
        mock_response.content = [mock_content_block]

        result = parse_llm_response(mock_response)

        assert "suggestions" in result
        assert len(result["suggestions"]) == 1
        assert result["suggestions"][0]["meal_name"] == "Pasta Primavera"

    def test_parse_llm_response_invalid_json(self):
        """Test parsing invalid JSON response."""
        response_text = "This is not JSON"
        # Create mock response object
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = response_text
        mock_response.content = [mock_content_block]

        with pytest.raises(ValueError, match="Could not parse"):
            parse_llm_response(mock_response)

    def test_parse_llm_response_missing_suggestions(self):
        """Test parsing response without suggestions key."""
        response_text = '{"other_key": "value"}'
        # Create mock response object
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = response_text
        mock_response.content = [mock_content_block]

        with pytest.raises(ValueError, match="suggestions"):
            parse_llm_response(mock_response)

    def test_parse_llm_response_with_meal_category(self):
        """Test parsing response that includes meal_category field."""
        response_text = """
        {
            "suggestions": [
                {
                    "meal_name": "Pizza from restaurant",
                    "meal_type": "dinner",
                    "day_of_week": 0,
                    "ingredients": [],
                    "uses_pantry_items": [],
                    "notes": "Eating out",
                    "meal_category": "eat_out"
                }
            ]
        }
        """
        # Create mock response object
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = response_text.strip()
        mock_response.content = [mock_content_block]

        result = parse_llm_response(mock_response)

        assert "suggestions" in result
        assert len(result["suggestions"]) == 1
        assert result["suggestions"][0]["meal_name"] == "Pizza from restaurant"
        assert result["suggestions"][0]["meal_category"] == "eat_out"

    def test_parse_llm_response_with_all_meal_categories(self):
        """Test parsing response with all meal_category values."""
        response_text = """
        {
            "suggestions": [
                {
                    "meal_name": "Home cooked pasta",
                    "meal_type": "dinner",
                    "day_of_week": 0,
                    "ingredients": ["pasta", "sauce"],
                    "uses_pantry_items": ["pasta"],
                    "notes": "Regular meal",
                    "meal_category": "normal"
                },
                {
                    "meal_name": "Quick sandwich",
                    "meal_type": "lunch",
                    "day_of_week": 1,
                    "ingredients": ["bread", "cheese"],
                    "uses_pantry_items": ["bread"],
                    "notes": "Quick meal",
                    "meal_category": "quick_meal"
                },
                {
                    "meal_name": "Restaurant dinner",
                    "meal_type": "dinner",
                    "day_of_week": 2,
                    "ingredients": [],
                    "uses_pantry_items": [],
                    "notes": "Eating out",
                    "meal_category": "eat_out"
                }
            ]
        }
        """
        # Create mock response object
        mock_response = MagicMock()
        mock_content_block = MagicMock()
        mock_content_block.text = response_text.strip()
        mock_response.content = [mock_content_block]

        result = parse_llm_response(mock_response)

        assert "suggestions" in result
        assert len(result["suggestions"]) == 3
        assert result["suggestions"][0]["meal_category"] == "normal"
        assert result["suggestions"][1]["meal_category"] == "quick_meal"
        assert result["suggestions"][2]["meal_category"] == "eat_out"


class TestSuggestMeals:
    """Tests for main suggest_meals function."""

    @patch("services.meal_planning_ai.call_anthropic_api")
    @patch("services.meal_planning_ai.format_meal_planning_prompt")
    @patch("services.meal_planning_ai.gather_meal_planning_context")
    def test_suggest_meals_success(
        self,
        mock_gather,
        mock_format,
        mock_api,
        db_session,
        sample_household,
        sample_user,
    ):
        """Test successful meal suggestion flow."""
        week_start = date.today() - timedelta(days=date.today().weekday())

        mock_gather.return_value = {
            "pantry_items": [],
            "meals": [],
            "preferences": None,
            "grocery_lists": [],
            "weather": None,
            "household_name": "Test Household",
        }
        mock_format.return_value = "Formatted prompt"
        mock_api.return_value = MagicMock(
            content=[MagicMock(text='{"suggestions": [{"meal_name": "Pasta"}]}')]
        )

        result = suggest_meals(
            db_session,
            sample_household.id,
            sample_user.id,
            week_start,
            "Suggest meals",
            [],
            "test-key",
        )

        assert result is not None
        mock_gather.assert_called_once()
        mock_format.assert_called_once()
        mock_api.assert_called_once()
