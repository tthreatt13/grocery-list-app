"""Tests for grocery list AI service."""

import json
from unittest.mock import MagicMock, patch

import pytest

from services.grocery_list_ai import (
    format_grocery_review_prompt,
    gather_grocery_review_context,
    parse_grocery_review_response,
    review_grocery_list,
)


class TestGatherGroceryReviewContext:
    def test_gather_context_includes_items_and_preferences(
        self, db_session, sample_household, sample_user
    ):
        from models.grocery_list import GroceryList
        from models.grocery_item import GroceryItem
        from models.household_user_preferences import HouseholdUserPreferences

        grocery_list = GroceryList(
            household_id=sample_household.id,
            name="Weekly Shop",
            created_by=sample_user.id,
        )
        db_session.add(grocery_list)
        db_session.flush()

        item = GroceryItem(
            list_id=grocery_list.id,
            name="Spinach",
            quantity="1 bag",
            category="Produce",
            meal_type="dinner",
            checked=False,
        )
        db_session.add(item)

        prefs = HouseholdUserPreferences(
            household_id=sample_household.id,
            user_id=sample_user.id,
            diet_types=["vegetarian"],
        )
        db_session.add(prefs)
        db_session.commit()

        context = gather_grocery_review_context(
            db_session, sample_household.id, sample_user.id, grocery_list.id
        )

        assert context["list_name"] == "Weekly Shop"
        assert len(context["items"]) == 1
        assert context["items"][0]["name"] == "Spinach"
        assert context["preferences"]["diet_types"] == ["vegetarian"]


class TestFormatGroceryReviewPrompt:
    def test_prompt_includes_diet_types_and_items(self):
        context = {
            "household_name": "Test Home",
            "list_name": "Shop",
            "list_id": 1,
            "items": [
                {
                    "id": 1,
                    "name": "Bread",
                    "quantity": "1 loaf",
                    "meal_type": "breakfast",
                }
            ],
            "preferences": {"diet_types": ["gluten_free"]},
            "meals": [],
            "pantry_items": [],
        }

        prompt = format_grocery_review_prompt(context, "Review my list", [])

        assert "gluten_free" in prompt
        assert "Bread" in prompt
        assert "Review my list" in prompt


class TestParseGroceryReviewResponse:
    def test_parse_valid_response(self):
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text=json.dumps(
                    {
                        "gap_analysis": "Light on protein",
                        "suggestions": [
                            {
                                "action": "add",
                                "name": "Greek yogurt",
                                "reason": "Adds protein",
                            }
                        ],
                    }
                )
            )
        ]

        result = parse_grocery_review_response(mock_response)

        assert result["gap_analysis"] == "Light on protein"
        assert len(result["suggestions"]) == 1


class TestReviewGroceryList:
    @patch("services.grocery_list_ai.call_anthropic_api")
    def test_review_grocery_list_success(
        self, mock_call_api, db_session, sample_household, sample_user
    ):
        from models.grocery_list import GroceryList

        grocery_list = GroceryList(
            household_id=sample_household.id,
            name="Shop",
            created_by=sample_user.id,
        )
        db_session.add(grocery_list)
        db_session.commit()

        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text=json.dumps(
                    {
                        "gap_analysis": "Needs more vegetables",
                        "suggestions": [],
                    }
                )
            )
        ]
        mock_call_api.return_value = mock_response

        with patch("services.grocery_list_ai.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-5"
            result = review_grocery_list(
                db_session,
                sample_household.id,
                sample_user.id,
                grocery_list.id,
                "Review this list",
                [],
                api_key="test-key",
            )

        assert result["gap_analysis"] == "Needs more vegetables"
        mock_call_api.assert_called_once()
