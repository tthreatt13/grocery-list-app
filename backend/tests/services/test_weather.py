"""Tests for weather service."""

import pytest
import time
from unittest.mock import patch, Mock
from datetime import datetime

from services.weather import (
    zip_to_coordinates,
    get_gridpoint_info,
    fetch_forecast,
    parse_forecast,
    get_cached_forecast,
    cache_forecast,
    get_weather_forecast,
    CACHE_TTL_SECONDS,
)


class TestZipToCoordinates:
    """Tests for zip_to_coordinates function."""

    @patch("services.weather.requests.get")
    def test_zip_to_coordinates_success(self, mock_get):
        """Test successful zip code to coordinates conversion."""
        mock_response = Mock()
        mock_response.json.return_value = [
            {"lat": "39.7392", "lon": "-104.9903", "display_name": "Denver, CO 80202"}
        ]
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        lat, lon = zip_to_coordinates("80202")

        assert lat == 39.7392
        assert lon == -104.9903
        mock_get.assert_called_once()
        assert "postalcode" in mock_get.call_args[1]["params"]
        assert mock_get.call_args[1]["params"]["postalcode"] == "80202"

    @patch("services.weather.requests.get")
    def test_zip_to_coordinates_with_dash(self, mock_get):
        """Test zip code with dash format (5+4)."""
        mock_response = Mock()
        mock_response.json.return_value = [
            {"lat": "40.7128", "lon": "-74.0060", "display_name": "New York, NY 10001"}
        ]
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        lat, lon = zip_to_coordinates("10001-1234")

        assert lat == 40.7128
        assert lon == -74.0060
        # Should normalize to first 5 digits
        assert mock_get.call_args[1]["params"]["postalcode"] == "10001"

    def test_zip_to_coordinates_invalid_format(self):
        """Test invalid zip code format raises ValueError."""
        with pytest.raises(ValueError, match="Invalid zip code format"):
            zip_to_coordinates("123")

        with pytest.raises(ValueError, match="Invalid zip code format"):
            zip_to_coordinates("abcde")

        with pytest.raises(ValueError, match="Invalid zip code format"):
            zip_to_coordinates("")

    @patch("services.weather.requests.get")
    def test_zip_to_coordinates_not_found(self, mock_get):
        """Test zip code that cannot be geocoded."""
        mock_response = Mock()
        mock_response.json.return_value = []
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        with pytest.raises(ValueError, match="Could not geocode zip code"):
            zip_to_coordinates("99999")

    @patch("services.weather.requests.get")
    def test_zip_to_coordinates_api_error(self, mock_get):
        """Test API request failure."""
        import requests

        mock_get.side_effect = requests.RequestException("API Error")

        with pytest.raises(requests.RequestException):
            zip_to_coordinates("80202")


class TestGetGridpointInfo:
    """Tests for get_gridpoint_info function."""

    @patch("services.weather.requests.get")
    def test_get_gridpoint_info_success(self, mock_get):
        """Test successful gridpoint info retrieval."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "properties": {
                "gridId": "TOP",
                "gridX": 31,
                "gridY": 80,
            }
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        result = get_gridpoint_info(39.7392, -104.9903)

        assert result["office"] == "TOP"
        assert result["gridX"] == "31"
        assert result["gridY"] == "80"
        mock_get.assert_called_once()
        assert "39.7392" in mock_get.call_args[0][0]
        assert "-104.9903" in mock_get.call_args[0][0]

    @patch("services.weather.requests.get")
    def test_get_gridpoint_info_missing_properties(self, mock_get):
        """Test gridpoint response with missing properties."""
        mock_response = Mock()
        mock_response.json.return_value = {"properties": {}}
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        with pytest.raises(ValueError, match="Could not retrieve gridpoint info"):
            get_gridpoint_info(39.7392, -104.9903)

    @patch("services.weather.requests.get")
    def test_get_gridpoint_info_api_error(self, mock_get):
        """Test API request failure."""
        import requests

        mock_get.side_effect = requests.RequestException("API Error")

        with pytest.raises(requests.RequestException):
            get_gridpoint_info(39.7392, -104.9903)


class TestFetchForecast:
    """Tests for fetch_forecast function."""

    @patch("services.weather.requests.get")
    def test_fetch_forecast_success(self, mock_get):
        """Test successful forecast fetch."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "properties": {
                "periods": [
                    {
                        "startTime": "2024-01-15T12:00:00-07:00",
                        "isDaytime": True,
                        "temperature": 65,
                        "shortForecast": "Sunny",
                        "probabilityOfPrecipitation": {"value": 10},
                    }
                ]
            }
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        result = fetch_forecast("TOP", "31", "80")

        assert "properties" in result
        assert "periods" in result["properties"]
        mock_get.assert_called_once()
        assert "TOP" in mock_get.call_args[0][0]
        assert "31" in mock_get.call_args[0][0]
        assert "80" in mock_get.call_args[0][0]

    @patch("services.weather.requests.get")
    def test_fetch_forecast_api_error(self, mock_get):
        """Test API request failure."""
        import requests

        mock_get.side_effect = requests.RequestException("API Error")

        with pytest.raises(requests.RequestException):
            fetch_forecast("TOP", "31", "80")


class TestParseForecast:
    """Tests for parse_forecast function."""

    def test_parse_forecast_success(self):
        """Test successful forecast parsing."""
        forecast_data = {
            "properties": {
                "periods": [
                    {
                        "startTime": "2024-01-15T12:00:00-07:00",
                        "isDaytime": True,
                        "temperature": 65,
                        "shortForecast": "Sunny",
                        "probabilityOfPrecipitation": {"value": 10},
                    },
                    {
                        "startTime": "2024-01-15T18:00:00-07:00",
                        "isDaytime": False,
                        "temperature": 45,
                        "shortForecast": "Clear",
                        "probabilityOfPrecipitation": {"value": 0},
                    },
                    {
                        "startTime": "2024-01-16T12:00:00-07:00",
                        "isDaytime": True,
                        "temperature": 70,
                        "shortForecast": "Partly Cloudy",
                        "probabilityOfPrecipitation": {"value": 20},
                    },
                ]
            }
        }

        result = parse_forecast(forecast_data)

        assert len(result) >= 2
        assert result[0]["date"] == "2024-01-15"
        assert result[0]["high_temp"] == 65
        assert result[0]["low_temp"] == 45
        assert result[0]["precipitation_chance"] == 10
        assert result[0]["condition"] == "Sunny"

    def test_parse_forecast_no_periods(self):
        """Test forecast with no periods."""
        forecast_data = {"properties": {"periods": []}}

        with pytest.raises(ValueError, match="No forecast periods found"):
            parse_forecast(forecast_data)

    def test_parse_forecast_missing_properties(self):
        """Test forecast with missing properties."""
        forecast_data = {}

        with pytest.raises(ValueError):
            parse_forecast(forecast_data)

    def test_parse_forecast_limits_to_7_days(self):
        """Test that forecast parsing limits to 7 days."""
        periods = []
        for day in range(10):  # Create 10 days of data
            periods.append(
                {
                    "startTime": f"2024-01-{15+day}T12:00:00-07:00",
                    "isDaytime": True,
                    "temperature": 65,
                    "shortForecast": "Sunny",
                    "probabilityOfPrecipitation": {"value": 10},
                }
            )
            periods.append(
                {
                    "startTime": f"2024-01-{15+day}T18:00:00-07:00",
                    "isDaytime": False,
                    "temperature": 45,
                    "shortForecast": "Clear",
                    "probabilityOfPrecipitation": {"value": 0},
                }
            )

        forecast_data = {"properties": {"periods": periods}}

        result = parse_forecast(forecast_data)

        assert len(result) == 7


class TestCacheForecast:
    """Tests for forecast caching functions."""

    def test_cache_forecast_and_retrieve(self):
        """Test caching and retrieving forecast."""
        zip_code = "80202"
        forecast_data = [
            {
                "date": "2024-01-15",
                "high_temp": 65,
                "low_temp": 45,
                "precipitation_chance": 10,
                "condition": "Sunny",
            }
        ]

        # Cache should be empty initially
        assert get_cached_forecast(zip_code) is None

        # Cache the forecast
        cache_forecast(zip_code, forecast_data)

        # Should retrieve cached forecast
        cached = get_cached_forecast(zip_code)
        assert cached == forecast_data

    def test_cache_expiry(self):
        """Test that cache expires after TTL."""
        zip_code = "80202"
        forecast_data = [{"date": "2024-01-15", "high_temp": 65}]

        # Cache the forecast
        cache_forecast(zip_code, forecast_data)

        # Manually expire the cache by setting expiry time in the past
        from services.weather import _forecast_cache

        _forecast_cache[zip_code] = (forecast_data, time.time() - 1)

        # Should return None after expiry
        assert get_cached_forecast(zip_code) is None
        # Cache entry should be removed
        assert zip_code not in _forecast_cache

    def test_cache_different_zip_codes(self):
        """Test that different zip codes are cached separately."""
        forecast1 = [{"date": "2024-01-15", "high_temp": 65}]
        forecast2 = [{"date": "2024-01-15", "high_temp": 70}]

        cache_forecast("80202", forecast1)
        cache_forecast("10001", forecast2)

        assert get_cached_forecast("80202") == forecast1
        assert get_cached_forecast("10001") == forecast2


class TestGetWeatherForecast:
    """Tests for get_weather_forecast main function."""

    @patch("services.weather.get_cached_forecast")
    @patch("services.weather.cache_forecast")
    @patch("services.weather.parse_forecast")
    @patch("services.weather.fetch_forecast")
    @patch("services.weather.get_gridpoint_info")
    @patch("services.weather.zip_to_coordinates")
    def test_get_weather_forecast_success(
        self,
        mock_zip_to_coords,
        mock_gridpoint,
        mock_fetch,
        mock_parse,
        mock_cache,
        mock_get_cache,
    ):
        """Test successful weather forecast retrieval."""
        # Setup mocks
        mock_get_cache.return_value = None  # No cached forecast
        mock_zip_to_coords.return_value = (39.7392, -104.9903)
        mock_gridpoint.return_value = {"office": "TOP", "gridX": "31", "gridY": "80"}
        mock_fetch.return_value = {
            "properties": {
                "periods": [
                    {
                        "startTime": "2024-01-15T12:00:00-07:00",
                        "isDaytime": True,
                        "temperature": 65,
                        "shortForecast": "Sunny",
                        "probabilityOfPrecipitation": {"value": 10},
                    },
                    {
                        "startTime": "2024-01-15T18:00:00-07:00",
                        "isDaytime": False,
                        "temperature": 45,
                        "shortForecast": "Clear",
                        "probabilityOfPrecipitation": {"value": 0},
                    },
                ]
            }
        }
        mock_parse.return_value = [
            {
                "date": "2024-01-15",
                "high_temp": 65,
                "low_temp": 45,
                "precipitation_chance": 10,
                "condition": "Sunny",
            }
        ]

        result = get_weather_forecast("80202")

        assert len(result) > 0
        assert result[0]["date"] == "2024-01-15"
        mock_zip_to_coords.assert_called_once_with("80202")
        mock_gridpoint.assert_called_once_with(39.7392, -104.9903)
        mock_fetch.assert_called_once_with("TOP", "31", "80")
        mock_parse.assert_called_once()
        mock_cache.assert_called_once()

    @patch("services.weather.get_cached_forecast")
    @patch("services.weather.fetch_forecast")
    @patch("services.weather.get_gridpoint_info")
    @patch("services.weather.zip_to_coordinates")
    def test_get_weather_forecast_uses_cache(
        self, mock_zip_to_coords, mock_gridpoint, mock_fetch, mock_cache
    ):
        """Test that cached forecast is returned when available."""
        cached_forecast = [
            {
                "date": "2024-01-15",
                "high_temp": 65,
                "low_temp": 45,
                "precipitation_chance": 10,
                "condition": "Sunny",
            }
        ]
        mock_cache.return_value = cached_forecast

        result = get_weather_forecast("80202")

        assert result == cached_forecast
        # Should not call API functions when cache is available
        mock_zip_to_coords.assert_not_called()
        mock_gridpoint.assert_not_called()
        mock_fetch.assert_not_called()

    @patch("services.weather.zip_to_coordinates")
    def test_get_weather_forecast_invalid_zip(self, mock_zip_to_coords):
        """Test that invalid zip code raises ValueError."""
        mock_zip_to_coords.side_effect = ValueError("Invalid zip code")

        with pytest.raises(ValueError, match="Invalid zip code"):
            get_weather_forecast("invalid")

    @patch("services.weather.get_cached_forecast")
    @patch("services.weather.fetch_forecast")
    @patch("services.weather.get_gridpoint_info")
    @patch("services.weather.zip_to_coordinates")
    def test_get_weather_forecast_api_error(
        self, mock_zip_to_coords, mock_gridpoint, mock_fetch, mock_get_cache
    ):
        """Test that API errors are propagated."""
        import requests

        mock_get_cache.return_value = None  # No cached forecast
        mock_zip_to_coords.return_value = (39.7392, -104.9903)
        mock_gridpoint.return_value = {"office": "TOP", "gridX": "31", "gridY": "80"}
        mock_fetch.side_effect = requests.RequestException("API Error")

        with pytest.raises(requests.RequestException):
            get_weather_forecast("80202")

