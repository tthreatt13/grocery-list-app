# Task List: Weather API Integration

## Feature Overview

Integrate a weather API to provide 7-day forecasts based on zip code entry. The forecast will display high/low temperatures and precipitation data to help users make informed cooking decisions. The feature will be integrated into the household preferences system, allowing users to save their zip code to their profile and view weather data on the household page and in the preferences form.

## Relevant Files

- `backend/models/household_user_preferences.py` - Add zip_code field to preferences model
- `backend/schemas/household.py` - Update schemas to include zip_code and weather data
- `backend/routes/households.py` - Add weather API endpoint and update preferences endpoints
- `backend/routes/weather.py` - New route file for weather API integration
- `lib/api/household.ts` - Update TypeScript interfaces for zip_code and weather data
- `lib/api/weather.ts` - New API client for weather endpoints
- `components/household/PreferencesForm.tsx` - Add zip code input field
- `components/household/WeatherForecast.tsx` - New component to display 7-day forecast
- `app/household/page.tsx` - Integrate weather forecast display
- `backend/alembic/versions/[new_migration].py` - Database migration for zip_code field

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `WeatherForecast.tsx` and `WeatherForecast.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Use api.weather.gov as the api service

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Feature branch already created

- [x] 1.0 Backend: Add zip code storage to household preferences
  - [x] 1.1 Create Alembic migration to add `zip_code` field (String, nullable) to `household_user_preferences` table
  - [x] 1.2 Update `HouseholdUserPreferences` model in `backend/models/household_user_preferences.py` to include `zip_code` column
  - [x] 1.3 Update `HouseholdPreferencesBase` schema in `backend/schemas/household.py` to include `zip_code: Optional[str] = None`
  - [x] 1.4 Update `update_my_preferences` route in `backend/routes/households.py` to handle `zip_code` field
  - [x] 1.5 Run migration: `cd backend && alembic upgrade head`
  - [x] 1.6 Write test in `backend/tests/routes/test_households.py` to verify zip_code can be saved and retrieved
  - [x] 1.7 Run tests: `cd backend && pytest tests/routes/test_households.py::TestHouseholdPreferences -v`

- [x] 2.0 Backend: Integrate weather API service
  - [x] 2.1 Research api.weather.gov API structure and endpoints (7-day forecast endpoint)
  - [x] 2.2 Create `backend/services/weather.py` module for weather API integration
  - [x] 2.3 Implement function to convert zip code to coordinates using api.weather.gov `/points/{lat},{lon}` endpoint (may need geocoding service for zip to lat/lon)
  - [x] 2.4 Implement function to fetch 7-day forecast from api.weather.gov `/gridpoints/{office}/{gridX},{gridY}/forecast` endpoint
  - [x] 2.5 Parse forecast response to extract high/low temperatures and precipitation for each day
  - [x] 2.6 Implement caching mechanism (in-memory or Redis) to cache forecasts by zip code with 30-minute TTL
  - [x] 2.7 Add error handling for API failures, invalid zip codes, and rate limiting
  - [x] 2.8 Add `requests` library usage (already in requirements.txt) or use `httpx` for async requests
  - [x] 2.9 Write unit tests in `backend/tests/services/test_weather.py` for weather service functions
  - [x] 2.10 Run tests: `cd backend && pytest tests/services/test_weather.py -v`

- [x] 3.0 Backend: Create weather API endpoints
  - [x] 3.1 Create `backend/routes/weather.py` with APIRouter
  - [x] 3.2 Add GET endpoint `/api/weather/forecast/{zip_code}` to get 7-day forecast for a zip code
  - [x] 3.3 Add GET endpoint `/api/weather/forecast/me` to get forecast for current user's saved zip code (requires household_id query param)
  - [x] 3.4 Create `backend/schemas/weather.py` with response schemas: `WeatherForecastResponse`, `DailyForecast`
  - [x] 3.5 Add authentication middleware to weather endpoints
  - [x] 3.6 Add error responses for invalid zip codes, API failures, and missing zip code
  - [x] 3.7 Register weather router in `backend/main.py`: `app.include_router(weather.router, prefix="/api")`
  - [x] 3.8 Update `backend/routes/__init__.py` to export weather router
  - [x] 3.9 Write integration tests in `backend/tests/routes/test_weather.py` for weather endpoints
  - [x] 3.10 Run tests: `cd backend && pytest tests/routes/test_weather.py -v`

- [x] 4.0 Frontend: Update preferences form with zip code input
  - [x] 4.1 Update `HouseholdPreferences` interface in `lib/api/household.ts` to include `zip_code?: string | null`
  - [x] 4.2 Update `HouseholdPreferencesUpdate` interface in `lib/api/household.ts` to include `zip_code?: string | null`
  - [x] 4.3 Add zip code input field to `components/household/PreferencesForm.tsx` with label "Zip Code"
  - [x] 4.4 Add zip code validation (US zip code format: 5 digits or 5+4 format)
  - [x] 4.5 Pre-populate zip code field from existing preferences when editing
  - [x] 4.6 Update form state management to include zip_code field
  - [x] 4.7 Update form submission to include zip_code in the request
  - [x] 4.8 Add error display for invalid zip code format
  - [x] 4.9 Write test in `components/household/__tests__/PreferencesForm.test.tsx` for zip code input
  - [x] 4.10 Run tests: `npm test -- components/household/__tests__/PreferencesForm.test.tsx`

- [x] 5.0 Frontend: Create weather forecast display component
  - [x] 5.1 Create `components/household/WeatherForecast.tsx` component
  - [x] 5.2 Create `lib/api/weather.ts` with TypeScript interfaces and API functions
  - [x] 5.3 Define `DailyForecast` interface with: date, high_temp, low_temp, precipitation_chance, condition
  - [x] 5.4 Define `WeatherForecastResponse` interface with array of `DailyForecast`
  - [x] 5.5 Implement `getWeatherForecast(zipCode: string, token: string)` function in `lib/api/weather.ts`
  - [x] 5.6 Implement `getMyWeatherForecast(householdId: number, token: string)` function in `lib/api/weather.ts`
  - [x] 5.7 Design WeatherForecast component to display 7-day forecast in a responsive grid/card layout
  - [x] 5.8 Display each day with: date, high/low temperatures, precipitation chance, and weather condition icon
  - [x] 5.9 Add loading state while fetching weather data
  - [x] 5.10 Add error state with user-friendly error message
  - [x] 5.11 Add empty state when no zip code is set
  - [x] 5.12 Style component to match existing design system (use Tailwind classes)
  - [x] 5.13 Write test in `components/household/__tests__/WeatherForecast.test.tsx` for component rendering and states
  - [x] 5.14 Run tests: `npm test -- components/household/__tests__/WeatherForecast.test.tsx`

- [ ] 6.0 Frontend: Integrate weather display into household page
  - [ ] 6.1 Import WeatherForecast component in `app/household/page.tsx`
  - [ ] 6.2 Add state for weather forecast data and loading/error states
  - [ ] 6.3 Fetch weather forecast when preferences are loaded and zip_code exists
  - [ ] 6.4 Add useEffect hook to fetch weather data when zip_code changes
  - [ ] 6.5 Display WeatherForecast component in the preferences section of household page
  - [ ] 6.6 Handle error cases gracefully (show error message, don't break page)
  - [ ] 6.7 Refresh weather data when user updates zip code in preferences
  - [ ] 6.8 Update existing test in `app/household/__tests__/page.test.tsx` to include weather forecast
  - [ ] 6.9 Run tests: `npm test -- app/household/__tests__/page.test.tsx`
  - [ ] 6.10 Test end-to-end: Update zip code in preferences form and verify weather forecast appears
