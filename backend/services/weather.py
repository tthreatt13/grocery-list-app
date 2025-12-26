"""Weather service for fetching forecasts from api.weather.gov."""

import logging
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

import requests

logger = logging.getLogger(__name__)

# Weather.gov API base URL
WEATHER_GOV_BASE_URL = "https://api.weather.gov"
# Nominatim (OpenStreetMap) geocoding API for zip code to coordinates
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"

# Cache for forecasts: {zip_code: (forecast_data, expiry_timestamp)}
_forecast_cache: Dict[str, Tuple[Dict, float]] = {}
CACHE_TTL_SECONDS = 30 * 60  # 30 minutes


def zip_to_coordinates(zip_code: str) -> Tuple[float, float]:
    """
    Convert US zip code to latitude and longitude coordinates.

    Uses Nominatim (OpenStreetMap) geocoding service.

    Args:
        zip_code: US zip code (5 digits or 5+4 format)

    Returns:
        Tuple of (latitude, longitude)

    Raises:
        ValueError: If zip code is invalid or cannot be geocoded
        requests.RequestException: If geocoding API request fails
    """
    # Normalize zip code (remove dashes, take first 5 digits)
    normalized_zip = zip_code.replace("-", "").strip()[:5]

    if not normalized_zip.isdigit() or len(normalized_zip) != 5:
        raise ValueError(f"Invalid zip code format: {zip_code}")

    try:
        # Use Nominatim to geocode US zip code
        params = {
            "postalcode": normalized_zip,
            "countrycodes": "us",
            "format": "json",
            "limit": 1,
        }
        headers = {
            "User-Agent": "GroceryApp/1.0 (weather integration)",
        }

        response = requests.get(
            f"{NOMINATIM_BASE_URL}/search",
            params=params,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        if not data or len(data) == 0:
            raise ValueError(f"Could not geocode zip code: {zip_code}")

        lat = float(data[0]["lat"])
        lon = float(data[0]["lon"])

        logger.info(f"Geocoded zip code {zip_code} to coordinates ({lat}, {lon})")
        return (lat, lon)

    except requests.RequestException as e:
        logger.error(f"Geocoding API request failed for zip {zip_code}: {e}")
        raise
    except (KeyError, ValueError, IndexError) as e:
        logger.error(f"Failed to parse geocoding response for zip {zip_code}: {e}")
        raise ValueError(f"Could not geocode zip code: {zip_code}") from e


def get_gridpoint_info(lat: float, lon: float) -> Dict[str, str]:
    """
    Get gridpoint information from weather.gov for given coordinates.

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        Dictionary with 'office', 'gridX', and 'gridY' keys

    Raises:
        requests.RequestException: If weather.gov API request fails
        ValueError: If gridpoint info cannot be retrieved
    """
    try:
        headers = {
            "User-Agent": "GroceryApp/1.0 (weather integration)",
            "Accept": "application/json",
        }

        response = requests.get(
            f"{WEATHER_GOV_BASE_URL}/points/{lat},{lon}",
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        properties = data.get("properties", {})

        if (
            not properties.get("gridId")
            or not properties.get("gridX")
            or not properties.get("gridY")
        ):
            raise ValueError(
                f"Invalid gridpoint response for coordinates ({lat}, {lon})"
            )

        gridpoint_info = {
            "office": properties["gridId"],
            "gridX": str(properties["gridX"]),
            "gridY": str(properties["gridY"]),
        }

        logger.info(
            f"Retrieved gridpoint info for ({lat}, {lon}): "
            f"{gridpoint_info['office']}/{gridpoint_info['gridX']},{gridpoint_info['gridY']}"
        )
        return gridpoint_info

    except requests.RequestException as e:
        logger.error(f"Weather.gov points API request failed for ({lat}, {lon}): {e}")
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Failed to parse gridpoint response for ({lat}, {lon}): {e}")
        raise ValueError(
            f"Could not retrieve gridpoint info for coordinates ({lat}, {lon})"
        ) from e


def fetch_forecast(office: str, gridX: str, gridY: str) -> Dict:
    """
    Fetch 7-day forecast from weather.gov.

    Args:
        office: Weather office ID (e.g., "TOP", "BOU")
        gridX: Grid X coordinate
        gridY: Grid Y coordinate

    Returns:
        Raw forecast data from weather.gov API

    Raises:
        requests.RequestException: If weather.gov API request fails
        ValueError: If forecast cannot be retrieved
    """
    try:
        headers = {
            "User-Agent": "GroceryApp/1.0 (weather integration)",
            "Accept": "application/json",
        }

        response = requests.get(
            f"{WEATHER_GOV_BASE_URL}/gridpoints/{office}/{gridX},{gridY}/forecast",
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        logger.info(f"Fetched forecast from {office}/{gridX},{gridY}")
        return data

    except requests.RequestException as e:
        logger.error(
            f"Weather.gov forecast API request failed for {office}/{gridX},{gridY}: {e}"
        )
        raise
    except ValueError as e:
        logger.error(
            f"Failed to parse forecast response for {office}/{gridX},{gridY}: {e}"
        )
        raise ValueError(
            f"Could not retrieve forecast for {office}/{gridX},{gridY}"
        ) from e


def parse_forecast(forecast_data: Dict) -> List[Dict]:
    """
    Parse weather.gov forecast response to extract daily forecast data.

    Extracts high/low temperatures and precipitation for each day.

    Args:
        forecast_data: Raw forecast data from weather.gov API

    Returns:
        List of daily forecast dictionaries with:
        - date: ISO date string
        - high_temp: High temperature in Fahrenheit
        - low_temp: Low temperature in Fahrenheit
        - precipitation_chance: Precipitation chance percentage
        - condition: Weather condition description

    Raises:
        ValueError: If forecast data cannot be parsed
    """
    try:
        periods = forecast_data.get("properties", {}).get("periods", [])

        if not periods:
            raise ValueError("No forecast periods found in response")

        # Group periods by date (day/night pairs)
        daily_forecasts = []
        seen_dates = set()

        for period in periods:
            # Extract date from startTime
            start_time = period.get("startTime", "")
            if not start_time:
                continue

            # Parse date (format: "2024-01-15T12:00:00-07:00")
            try:
                dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                date_key = dt.date().isoformat()
            except (ValueError, AttributeError):
                logger.warning(f"Could not parse date from {start_time}")
                continue

            # Skip if we've already processed this date
            if date_key in seen_dates:
                continue

            # Find the day period (isDaytime=True) for this date
            day_period = None
            night_period = None

            for p in periods:
                p_start = p.get("startTime", "")
                if not p_start:
                    continue
                try:
                    p_dt = datetime.fromisoformat(p_start.replace("Z", "+00:00"))
                    p_date = p_dt.date().isoformat()
                except (ValueError, AttributeError):
                    continue

                if p_date == date_key:
                    if p.get("isDaytime", False):
                        day_period = p
                    else:
                        night_period = p

            # Use day period for high temp, night period for low temp
            high_temp = None
            low_temp = None
            precipitation_chance = None
            condition = None

            if day_period:
                high_temp = day_period.get("temperature")
                precipitation_chance = day_period.get(
                    "probabilityOfPrecipitation", {}
                ).get("value")
                condition = day_period.get("shortForecast", "N/A")
            elif night_period:
                # If only night period available, use it for both
                low_temp = night_period.get("temperature")
                high_temp = low_temp
                precipitation_chance = night_period.get(
                    "probabilityOfPrecipitation", {}
                ).get("value")
                condition = night_period.get("shortForecast", "N/A")

            # Get low temp from night period if available
            if night_period and not low_temp:
                low_temp = night_period.get("temperature")

            # If we still don't have temps, try to get from the period itself
            if high_temp is None:
                high_temp = period.get("temperature")
            if low_temp is None:
                low_temp = period.get("temperature")

            # Create daily forecast entry
            daily_forecast = {
                "date": date_key,
                "high_temp": high_temp,
                "low_temp": low_temp,
                "precipitation_chance": precipitation_chance,
                "condition": condition or "N/A",
            }

            daily_forecasts.append(daily_forecast)
            seen_dates.add(date_key)

            # Limit to 7 days
            if len(daily_forecasts) >= 7:
                break

        if not daily_forecasts:
            raise ValueError("No valid daily forecasts could be extracted")

        logger.info(f"Parsed {len(daily_forecasts)} daily forecasts")
        return daily_forecasts

    except (KeyError, ValueError, AttributeError) as e:
        logger.error(f"Failed to parse forecast data: {e}")
        raise ValueError(f"Could not parse forecast data: {e}") from e


def get_cached_forecast(zip_code: str) -> Optional[List[Dict]]:
    """
    Get cached forecast for a zip code if it exists and is not expired.

    Args:
        zip_code: Zip code to look up

    Returns:
        Cached forecast data or None if not cached or expired
    """
    if zip_code not in _forecast_cache:
        return None

    forecast_data, expiry_time = _forecast_cache[zip_code]

    if time.time() > expiry_time:
        # Cache expired, remove it
        del _forecast_cache[zip_code]
        return None

    logger.debug(f"Returning cached forecast for zip code {zip_code}")
    return forecast_data


def cache_forecast(zip_code: str, forecast_data: List[Dict]) -> None:
    """
    Cache forecast data for a zip code with TTL.

    Args:
        zip_code: Zip code to cache
        forecast_data: Forecast data to cache
    """
    expiry_time = time.time() + CACHE_TTL_SECONDS
    _forecast_cache[zip_code] = (forecast_data, expiry_time)
    logger.debug(
        f"Cached forecast for zip code {zip_code} (expires in {CACHE_TTL_SECONDS}s)"
    )


def get_weather_forecast(zip_code: str) -> List[Dict]:
    """
    Get 7-day weather forecast for a zip code.

    This is the main function that orchestrates the entire process:
    1. Check cache
    2. Convert zip code to coordinates
    3. Get gridpoint info
    4. Fetch forecast
    5. Parse forecast
    6. Cache result

    Args:
        zip_code: US zip code (5 digits or 5+4 format)

    Returns:
        List of daily forecast dictionaries with:
        - date: ISO date string
        - high_temp: High temperature in Fahrenheit
        - low_temp: Low temperature in Fahrenheit
        - precipitation_chance: Precipitation chance percentage
        - condition: Weather condition description

    Raises:
        ValueError: If zip code is invalid or forecast cannot be retrieved
        requests.RequestException: If API requests fail
    """
    # Check cache first
    cached_forecast = get_cached_forecast(zip_code)
    if cached_forecast is not None:
        return cached_forecast

    try:
        # Step 1: Convert zip code to coordinates
        lat, lon = zip_to_coordinates(zip_code)

        # Step 2: Get gridpoint info
        gridpoint_info = get_gridpoint_info(lat, lon)

        # Step 3: Fetch forecast
        forecast_data = fetch_forecast(
            gridpoint_info["office"],
            gridpoint_info["gridX"],
            gridpoint_info["gridY"],
        )

        # Step 4: Parse forecast
        daily_forecasts = parse_forecast(forecast_data)

        # Step 5: Cache result
        cache_forecast(zip_code, daily_forecasts)

        return daily_forecasts

    except requests.RequestException as e:
        logger.error(f"API request failed for zip code {zip_code}: {e}")
        raise
    except ValueError as e:
        logger.error(f"Invalid input or parsing error for zip code {zip_code}: {e}")
        raise
