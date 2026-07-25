"""Integration tests for grocery list AI review endpoint."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app


class TestGroceryListAIReview:
    @patch("services.grocery_list_ai.review_grocery_list")
    @patch("config.settings")
    def test_ai_review_success(
        self,
        mock_settings,
        mock_review,
        db_session,
        sample_user,
        sample_household,
        sample_grocery_list,
    ):
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        mock_settings.anthropic_api_key = "test-api-key"
        mock_settings.anthropic_model = "claude-sonnet-5"
        mock_review.return_value = {
            "gap_analysis": "Your list is light on leafy greens.",
            "suggestions": [
                {
                    "action": "add",
                    "name": "Spinach",
                    "quantity": "1 bag",
                    "category": "Produce",
                    "reason": "Adds leafy greens",
                }
            ],
        }

        try:
            client = TestClient(app)
            response = client.post(
                f"/api/grocery-lists/{sample_grocery_list.id}/ai-review",
                json={"user_message": "Review my list", "conversation_history": []},
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["gap_analysis"] == "Your list is light on leafy greens."
            assert len(data["suggestions"]) == 1
            assert data["suggestions"][0]["action"] == "add"
            assert len(data["conversation_history"]) == 2
            mock_review.assert_called_once()
        finally:
            app.dependency_overrides.clear()

    @patch("config.settings")
    def test_ai_review_list_not_found(
        self, mock_settings, db_session, sample_user, sample_household
    ):
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user
        mock_settings.anthropic_api_key = "test-api-key"

        try:
            client = TestClient(app)
            response = client.post(
                "/api/grocery-lists/99999/ai-review",
                json={"user_message": "Review", "conversation_history": []},
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()
