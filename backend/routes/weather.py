"""Weather API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from middleware.permissions import require_household_member, validate_household_exists
from models.user import User
from models.household_user_preferences import HouseholdUserPreferences
from schemas.weather import WeatherForecastResponse, DailyForecast
from services.weather import get_weather_forecast
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/forecast/me", response_model=WeatherForecastResponse)
def get_my_forecast(
    household_id: int = Query(..., description="Household ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeatherForecastResponse:
    """
    Get 7-day weather forecast for current user's saved zip code.

    Args:
        household_id: Household ID (query parameter)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Weather forecast response with 7-day forecast

    Raises:
        HTTPException:
            - 403: If user is not a member of the household
            - 404: If preferences not found or zip code not set
            - 400: If zip code is invalid
            - 500: If weather API request fails
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check user is a member of the household
    require_household_member(db, household_id, current_user)

    # Get user's preferences for this household
    preferences = (
        db.query(HouseholdUserPreferences)
        .filter(
            HouseholdUserPreferences.household_id == household_id,
            HouseholdUserPreferences.user_id == current_user.id,
        )
        .first()
    )

    if not preferences or not preferences.zip_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zip code not set in preferences. Please update your preferences first.",
        )

    try:
        # Fetch forecast using weather service
        daily_forecasts = get_weather_forecast(preferences.zip_code)

        # Convert to response format
        forecast_items = [
            DailyForecast(
                date=forecast["date"],
                high_temp=forecast.get("high_temp"),
                low_temp=forecast.get("low_temp"),
                precipitation_chance=forecast.get("precipitation_chance"),
                condition=forecast.get("condition"),
            )
            for forecast in daily_forecasts
        ]

        return WeatherForecastResponse(zip_code=preferences.zip_code, forecasts=forecast_items)

    except ValueError as e:
        logger.error(f"Invalid zip code or forecast error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Weather API request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve weather forecast. Please try again later.",
        )


@router.get("/forecast/{zip_code}", response_model=WeatherForecastResponse)
def get_forecast_by_zip(
    zip_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeatherForecastResponse:
    """
    Get 7-day weather forecast for a zip code.

    Args:
        zip_code: US zip code (5 digits or 5+4 format)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Weather forecast response with 7-day forecast

    Raises:
        HTTPException:
            - 400: If zip code is invalid
            - 500: If weather API request fails
    """
    try:
        # Fetch forecast using weather service
        daily_forecasts = get_weather_forecast(zip_code)

        # Convert to response format
        forecast_items = [
            DailyForecast(
                date=forecast["date"],
                high_temp=forecast.get("high_temp"),
                low_temp=forecast.get("low_temp"),
                precipitation_chance=forecast.get("precipitation_chance"),
                condition=forecast.get("condition"),
            )
            for forecast in daily_forecasts
        ]

        return WeatherForecastResponse(zip_code=zip_code, forecasts=forecast_items)

    except ValueError as e:
        logger.error(f"Invalid zip code or forecast error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Weather API request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve weather forecast. Please try again later.",
        )
