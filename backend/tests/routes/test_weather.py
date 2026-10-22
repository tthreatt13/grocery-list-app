"""Tests for weather API routes."""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from models.user import User
from models.household import Household
from models.household_member import HouseholdMember
from models.household_user_preferences import HouseholdUserPreferences
from tests.jwt_test_keys import make_auth_token


@pytest.fixture
def auth_headers(sample_user):
    """Create authentication headers for testing."""
    token = make_auth_token(sample_user.clerk_user_id, sample_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_household_with_preferences(db_session, sample_user, sample_household):
    """Create a household with user preferences including zip code."""
    # Ensure user is a member
    member = (
        db_session.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == sample_household.id,
            HouseholdMember.user_id == sample_user.id,
        )
        .first()
    )
    if not member:
        member = HouseholdMember(
            household_id=sample_household.id, user_id=sample_user.id, role="admin"
        )
        db_session.add(member)
        db_session.commit()

    # Create preferences with zip code
    preferences = HouseholdUserPreferences(
        household_id=sample_household.id,
        user_id=sample_user.id,
        zip_code="80202",
    )
    db_session.add(preferences)
    db_session.commit()
    db_session.refresh(preferences)

    return sample_household


class TestGetForecastByZip:
    """Tests for GET /api/weather/forecast/{zip_code} endpoint."""

    @patch("routes.weather.get_weather_forecast")
    def test_get_forecast_by_zip_success(
        self, mock_get_forecast, db_session, sample_user, auth_headers
    ):
        """Test successful forecast retrieval by zip code."""
        # Mock forecast data
        mock_forecast_data = [
            {
                "date": "2024-01-15",
                "high_temp": 65,
                "low_temp": 45,
                "precipitation_chance": 30,
                "condition": "Partly Cloudy",
            },
            {
                "date": "2024-01-16",
                "high_temp": 70,
                "low_temp": 50,
                "precipitation_chance": 0,
                "condition": "Sunny",
            },
        ]
        mock_get_forecast.return_value = mock_forecast_data

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get("/api/weather/forecast/80202", headers=auth_headers)

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["zip_code"] == "80202"
        assert len(data["forecasts"]) == 2
        assert data["forecasts"][0]["date"] == "2024-01-15"
        assert data["forecasts"][0]["high_temp"] == 65
        assert data["forecasts"][0]["low_temp"] == 45
        assert data["forecasts"][0]["precipitation_chance"] == 30
        assert data["forecasts"][0]["condition"] == "Partly Cloudy"
        mock_get_forecast.assert_called_once_with("80202")

    @patch("routes.weather.get_weather_forecast")
    def test_get_forecast_by_zip_invalid_zip(
        self, mock_get_forecast, db_session, sample_user, auth_headers
    ):
        """Test forecast retrieval with invalid zip code."""
        mock_get_forecast.side_effect = ValueError("Invalid zip code format: 123")

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get("/api/weather/forecast/123", headers=auth_headers)

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "Invalid zip code" in response.json()["detail"]

    @patch("routes.weather.get_weather_forecast")
    def test_get_forecast_by_zip_api_failure(
        self, mock_get_forecast, db_session, sample_user, auth_headers
    ):
        """Test forecast retrieval when weather API fails."""
        mock_get_forecast.side_effect = Exception("API request failed")

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get("/api/weather/forecast/80202", headers=auth_headers)

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 500
        assert "Failed to retrieve weather forecast" in response.json()["detail"]

    def test_get_forecast_by_zip_unauthorized(self, db_session):
        """Test forecast retrieval without authentication."""
        client = TestClient(app)
        response = client.get("/api/weather/forecast/80202")

        assert response.status_code == 401


class TestGetMyForecast:
    """Tests for GET /api/weather/forecast/me endpoint."""

    @patch("routes.weather.get_weather_forecast")
    def test_get_my_forecast_success(
        self,
        mock_get_forecast,
        db_session,
        sample_user,
        sample_household_with_preferences,
        auth_headers,
    ):
        """Test successful forecast retrieval for user's saved zip code."""
        # Mock forecast data
        mock_forecast_data = [
            {
                "date": "2024-01-15",
                "high_temp": 65,
                "low_temp": 45,
                "precipitation_chance": 30,
                "condition": "Partly Cloudy",
            },
        ]
        mock_get_forecast.return_value = mock_forecast_data

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/weather/forecast/me?household_id={sample_household_with_preferences.id}",
            headers=auth_headers,
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["zip_code"] == "80202"
        assert len(data["forecasts"]) == 1
        assert data["forecasts"][0]["date"] == "2024-01-15"
        mock_get_forecast.assert_called_once_with("80202")

    def test_get_my_forecast_no_zip_code(
        self, db_session, sample_user, sample_household, auth_headers
    ):
        """Test forecast retrieval when zip code is not set in preferences."""
        # Ensure user is a member
        member = (
            db_session.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == sample_household.id,
                HouseholdMember.user_id == sample_user.id,
            )
            .first()
        )
        if not member:
            member = HouseholdMember(
                household_id=sample_household.id, user_id=sample_user.id, role="admin"
            )
            db_session.add(member)
            db_session.commit()

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/weather/forecast/me?household_id={sample_household.id}",
            headers=auth_headers,
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 404
        assert "Zip code not set" in response.json()["detail"]

    def test_get_my_forecast_not_member(self, db_session, sample_user, auth_headers):
        """Test forecast retrieval when user is not a member of the household."""
        # Create a second user to own the household
        other_user = User(
            clerk_user_id="other_clerk_user",
            email="other@example.com",
            name="Other User",
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        # Create a household that the test user is NOT a member of
        household = Household(name="Other Household", created_by=other_user.id)
        db_session.add(household)
        db_session.commit()
        db_session.refresh(household)

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/weather/forecast/me?household_id={household.id}",
            headers=auth_headers,
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 403

    @patch("routes.weather.get_weather_forecast")
    def test_get_my_forecast_invalid_zip(
        self,
        mock_get_forecast,
        db_session,
        sample_user,
        sample_household_with_preferences,
        auth_headers,
    ):
        """Test forecast retrieval when saved zip code is invalid."""
        mock_get_forecast.side_effect = ValueError("Invalid zip code format: 80202")

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get(
            f"/api/weather/forecast/me?household_id={sample_household_with_preferences.id}",
            headers=auth_headers,
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "Invalid zip code" in response.json()["detail"]

    def test_get_my_forecast_missing_household_id(
        self, db_session, sample_user, auth_headers
    ):
        """Test forecast retrieval without household_id query parameter."""
        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return sample_user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get("/api/weather/forecast/me", headers=auth_headers)

        # Cleanup
        app.dependency_overrides.clear()

        assert (
            response.status_code == 422
        )  # Validation error for missing required query param
