"""Pydantic schemas for weather-related endpoints."""

from typing import Optional, List
from pydantic import BaseModel


class DailyForecast(BaseModel):
    """Schema for a single day's weather forecast."""

    date: str  # ISO date string (YYYY-MM-DD)
    high_temp: Optional[int] = None  # High temperature in Fahrenheit
    low_temp: Optional[int] = None  # Low temperature in Fahrenheit
    precipitation_chance: Optional[int] = None  # Precipitation chance percentage (0-100)
    condition: Optional[str] = None  # Weather condition description


class WeatherForecastResponse(BaseModel):
    """Schema for weather forecast response."""

    zip_code: str
    forecasts: List[DailyForecast]
