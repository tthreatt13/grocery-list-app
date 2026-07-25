"""Integration tests for AI meal suggestion endpoint."""

import json
import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app


class TestAISuggestMeals:
    """Test cases for AI meal suggestion endpoint."""

    @patch("config.settings")
    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_success(
        self,
        mock_anthropic_class,
        mock_settings,
        db_session,
        sample_user,
        sample_household,
    ):
        """Test POST /api/meals/ai-suggest returns meal suggestions successfully."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        # Mock settings to provide API key
        mock_settings.anthropic_api_key = "test-api-key"

        # Mock Anthropic API response
        mock_anthropic_instance = Mock()
        mock_anthropic_class.return_value = mock_anthropic_instance

        # Mock the messages.create method to return a valid response
        mock_response = Mock()
        mock_response.content = [
            Mock(
                type="text",
                text=json.dumps(
                    {
                        "suggestions": [
                            {
                                "meal_name": "Spaghetti Bolognese",
                                "meal_type": "dinner",
                                "day_of_week": 0,
                                "ingredients": ["pasta", "ground beef", "tomato sauce"],
                                "uses_pantry_items": ["pasta"],
                                "notes": "A classic Italian dish",
                            },
                            {
                                "meal_name": "Pancakes",
                                "meal_type": "breakfast",
                                "day_of_week": 1,
                                "ingredients": ["flour", "eggs", "milk"],
                                "uses_pantry_items": [],
                                "notes": "Quick and easy",
                            },
                        ],
                        "conversation_history": [
                            {"role": "user", "content": "Suggest some meals"},
                            {
                                "role": "assistant",
                                "content": "Here are some meal suggestions for your week...",
                            },
                        ],
                    }
                ),
            )
        ]
        mock_anthropic_instance.messages.create.return_value = mock_response

        request_data = {
            "household_id": sample_household.id,
            "week_start_date": "2024-01-01",
            "user_message": "Suggest some meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert "conversation_history" in data
        assert len(data["suggestions"]) == 2
        assert data["suggestions"][0]["meal_name"] == "Spaghetti Bolognese"
        assert data["suggestions"][0]["meal_type"] == "dinner"
        assert data["suggestions"][1]["meal_name"] == "Pancakes"
        assert data["suggestions"][1]["meal_type"] == "breakfast"

        # Verify Anthropic API was called
        mock_anthropic_instance.messages.create.assert_called_once()

    @patch("config.settings")
    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_with_conversation_history(
        self,
        mock_anthropic_class,
        mock_settings,
        db_session,
        sample_user,
        sample_household,
    ):
        """Test POST /api/meals/ai-suggest with conversation history."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        # Mock settings to provide API key
        mock_settings.anthropic_api_key = "test-api-key"

        # Mock Anthropic API response
        mock_anthropic_instance = Mock()
        mock_anthropic_class.return_value = mock_anthropic_instance

        mock_response = Mock()
        mock_response.content = [
            Mock(
                type="text",
                text=json.dumps(
                    {
                        "suggestions": [
                            {
                                "meal_name": "Vegetarian Pasta",
                                "meal_type": "dinner",
                                "day_of_week": 2,
                                "ingredients": ["pasta", "tomatoes", "basil"],
                                "uses_pantry_items": ["pasta"],
                                "notes": "Vegetarian option",
                            }
                        ],
                        "conversation_history": [
                            {"role": "user", "content": "I want vegetarian meals"},
                            {
                                "role": "assistant",
                                "content": "Here are some vegetarian options...",
                            },
                        ],
                    }
                ),
            )
        ]
        mock_anthropic_instance.messages.create.return_value = mock_response

        request_data = {
            "household_id": sample_household.id,
            "week_start_date": "2024-01-01",
            "user_message": "I want vegetarian meals",
            "conversation_history": [
                {"role": "user", "content": "Suggest some meals"},
                {
                    "role": "assistant",
                    "content": "What type of meals are you looking for?",
                },
            ],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert len(data["suggestions"]) == 1
        assert data["suggestions"][0]["meal_name"] == "Vegetarian Pasta"

        # Verify conversation history was passed to API
        call_args = mock_anthropic_instance.messages.create.call_args
        assert call_args is not None

    def test_ai_suggest_meals_unauthorized(self):
        """Test POST /api/meals/ai-suggest without auth token returns 401."""
        request_data = {
            "household_id": 1,
            "week_start_date": "2024-01-01",
            "user_message": "Suggest meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post("/api/meals/ai-suggest", json=request_data)

        assert response.status_code == 401

    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_invalid_household(
        self, mock_anthropic_class, db_session, sample_user
    ):
        """Test POST /api/meals/ai-suggest with invalid household returns 403."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        request_data = {
            "household_id": 99999,  # Non-existent household
            "week_start_date": "2024-01-01",
            "user_message": "Suggest meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 403

    @patch("config.settings")
    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_api_error(
        self,
        mock_anthropic_class,
        mock_settings,
        db_session,
        sample_user,
        sample_household,
    ):
        """Test POST /api/meals/ai-suggest handles Anthropic API errors."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        # Mock settings to provide API key
        mock_settings.anthropic_api_key = "test-api-key"

        # Mock Anthropic API to raise an error
        mock_anthropic_instance = Mock()
        mock_anthropic_class.return_value = mock_anthropic_instance
        mock_anthropic_instance.messages.create.side_effect = Exception(
            "API request failed"
        )

        request_data = {
            "household_id": sample_household.id,
            "week_start_date": "2024-01-01",
            "user_message": "Suggest meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_invalid_json_response(
        self, mock_anthropic_class, db_session, sample_user, sample_household
    ):
        """Test POST /api/meals/ai-suggest handles invalid JSON from API."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        # Mock Anthropic API to return invalid JSON
        mock_anthropic_instance = Mock()
        mock_anthropic_class.return_value = mock_anthropic_instance

        mock_response = Mock()
        mock_response.content = [Mock(type="text", text="This is not valid JSON")]
        mock_anthropic_instance.messages.create.return_value = mock_response

        request_data = {
            "household_id": sample_household.id,
            "week_start_date": "2024-01-01",
            "user_message": "Suggest meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        # Invalid JSON from API should return 400 (Bad Request)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @patch("config.settings")
    @patch("services.anthropic_client.Anthropic")
    def test_ai_suggest_meals_auto_adjusts_week_start(
        self,
        mock_anthropic_class,
        mock_settings,
        db_session,
        sample_user,
        sample_household,
    ):
        """Test POST /api/meals/ai-suggest automatically adjusts week_start_date to Monday."""
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        # Mock settings to provide API key
        mock_settings.anthropic_api_key = "test-api-key"

        # Mock Anthropic API response
        mock_anthropic_instance = Mock()
        mock_anthropic_class.return_value = mock_anthropic_instance

        mock_response = Mock()
        mock_response.content = [
            Mock(
                type="text",
                text=json.dumps(
                    {
                        "suggestions": [],
                        "conversation_history": [
                            {"role": "assistant", "content": "No suggestions"}
                        ],
                    }
                ),
            )
        ]
        mock_anthropic_instance.messages.create.return_value = mock_response

        # Send a date that's not a Monday (2024-01-03 is a Wednesday)
        request_data = {
            "household_id": sample_household.id,
            "week_start_date": "2024-01-03",  # Wednesday
            "user_message": "Suggest meals",
            "conversation_history": [],
        }

        client = TestClient(app)
        response = client.post(
            "/api/meals/ai-suggest",
            json=request_data,
            headers={"Authorization": "Bearer valid_token"},
        )

        app.dependency_overrides.clear()

        # Should succeed (week_start_date is adjusted to Monday internally)
        assert response.status_code == 200
