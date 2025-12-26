# Weather API Testing Guide

This guide explains how to test the weather API endpoints that were created in task 3.0.

## Prerequisites

1. **Start the backend server:**

   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn main:app --reload
   ```

   The server will start on `http://localhost:8000`

2. **Get an authentication token:**
   - Use the test token generator script (see below)
   - Or create a test token manually (see "Creating Test Tokens" section)

## Testing Methods

### 1. FastAPI Interactive Documentation (Recommended)

The easiest way to test the API is using FastAPI's built-in interactive documentation:

1. **Open Swagger UI:**
   - Navigate to: `http://localhost:8000/docs`
   - You'll see all available endpoints including the weather endpoints

2. **Set up Authentication (IMPORTANT - Do this first!):**
   - Click the **"Authorize"** button at the top right of the page (looks like a lock icon 🔒)
   - In the "Value" field, enter your token in one of these formats:
     - **Option 1 (Recommended):** Just the token itself: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **Option 2:** With Bearer prefix: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Click **"Authorize"** to save
   - Click **"Close"** to close the dialog
   - ✅ Now all your requests will be authenticated automatically!

3. **Test the endpoints:**
   - Click on `/api/weather/forecast/{zip_code}` or `/api/weather/forecast/me`
   - Click **"Try it out"**
   - Fill in the required parameters:
     - For `/forecast/{zip_code}`: Enter a zip code like `80202` or `29615`
     - For `/forecast/me`: Enter `household_id` as a query parameter (e.g., `1`)
   - Click **"Execute"**
   - View the response below

**Note:** If you see "Missing authorization header" error, it means you haven't clicked the "Authorize" button yet. The Authorization field you see in the parameters list is NOT where you enter your token - use the "Authorize" button at the top instead!

### 2. Using cURL Commands

#### Test Forecast by Zip Code

```bash
# Replace YOUR_TOKEN with your actual JWT token
curl -X GET "http://localhost:8000/api/weather/forecast/80202" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Response:**

```json
{
  "zip_code": "80202",
  "forecasts": [
    {
      "date": "2024-01-15",
      "high_temp": 65,
      "low_temp": 45,
      "precipitation_chance": 30,
      "condition": "Partly Cloudy"
    },
    {
      "date": "2024-01-16",
      "high_temp": 70,
      "low_temp": 50,
      "precipitation_chance": 0,
      "condition": "Sunny"
    }
    // ... more days
  ]
}
```

#### Test Forecast for Current User's Saved Zip Code

```bash
# Replace YOUR_TOKEN and HOUSEHOLD_ID with actual values
curl -X GET "http://localhost:8000/api/weather/forecast/me?household_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Prerequisites for this endpoint:**

- User must be a member of the household
- User must have a zip code saved in their preferences for that household

### 3. Using Python Requests

```python
import requests

# Your authentication token
token = "YOUR_JWT_TOKEN"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test forecast by zip code
response = requests.get(
    "http://localhost:8000/api/weather/forecast/80202",
    headers=headers
)
print(response.json())

# Test forecast for user's saved zip code
response = requests.get(
    "http://localhost:8000/api/weather/forecast/me",
    headers=headers,
    params={"household_id": 1}
)
print(response.json())
```

### 4. Using the Test Suite

Run the automated tests:

```bash
cd backend
source venv/bin/activate
pytest tests/routes/test_weather.py -v
```

This will run all 9 test cases covering:

- Successful forecast retrieval
- Invalid zip code handling
- API failure handling
- Unauthorized access
- Missing zip code in preferences
- Non-member access attempts

### 5. Using Postman or Insomnia

1. **Create a new request:**
   - Method: `GET`
   - URL: `http://localhost:8000/api/weather/forecast/80202`

2. **Add authentication:**
   - Go to the "Authorization" tab
   - Select "Bearer Token"
   - Enter your JWT token

3. **Send the request:**
   - Click "Send"
   - View the response

## Endpoint Details

### GET `/api/weather/forecast/{zip_code}`

Get 7-day weather forecast for any US zip code.

**Parameters:**

- `zip_code` (path parameter): US zip code (5 digits or 5+4 format)
  - Example: `80202` or `80202-1234`

**Authentication:** Required (Bearer token)

**Response:**

- `200 OK`: Success with forecast data
- `400 Bad Request`: Invalid zip code format
- `500 Internal Server Error`: Weather API failure

### GET `/api/weather/forecast/me`

Get 7-day weather forecast for current user's saved zip code.

**Query Parameters:**

- `household_id` (required): Household ID

**Authentication:** Required (Bearer token)

**Response:**

- `200 OK`: Success with forecast data
- `400 Bad Request`: Invalid zip code in preferences
- `403 Forbidden`: User is not a member of the household
- `404 Not Found`: Zip code not set in preferences or household not found
- `500 Internal Server Error`: Weather API failure

## Example Test Scenarios

### Scenario 1: Valid Zip Code

```bash
curl -X GET "http://localhost:8000/api/weather/forecast/10001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with 7-day forecast

### Scenario 2: Invalid Zip Code

```bash
curl -X GET "http://localhost:8000/api/weather/forecast/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `400 Bad Request` with error message

### Scenario 3: Missing Authentication

```bash
curl -X GET "http://localhost:8000/api/weather/forecast/80202"
```

Expected: `401 Unauthorized`

### Scenario 4: User's Saved Zip Code

```bash
# First, ensure user has zip_code set in preferences
# Then:
curl -X GET "http://localhost:8000/api/weather/forecast/me?household_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with forecast for saved zip code

### Scenario 5: No Zip Code in Preferences

```bash
# If user hasn't set zip_code in preferences:
curl -X GET "http://localhost:8000/api/weather/forecast/me?household_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `404 Not Found` with message about zip code not set

## Troubleshooting

### Issue: 401 Unauthorized

- **Solution:** Ensure you're including a valid Bearer token in the Authorization header
- Format: `Authorization: Bearer <token>`

### Issue: 404 Not Found (for `/forecast/me`)

- **Solution:**
  1. Ensure the user has a zip code set in their preferences for the household
  2. Verify the household_id is correct
  3. Check that the user is a member of the household

### Issue: 500 Internal Server Error

- **Solution:**
  - Check backend logs for detailed error messages
  - Verify internet connection (API calls external weather service)
  - Weather API may be temporarily unavailable

### Issue: Slow Response Times

- **Note:** First request for a zip code may take 5-10 seconds as it:
  1. Geocodes the zip code
  2. Fetches gridpoint info
  3. Retrieves forecast data
- Subsequent requests for the same zip code are cached for 30 minutes

## Creating Test Tokens

### Method 1: Using the Test Token Generator Script (Recommended)

A helper script is provided to easily generate test tokens:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python scripts/generate_test_token.py
```

**Options:**

```bash
# Custom email
python scripts/generate_test_token.py --email mytest@example.com

# Custom Clerk user ID
python scripts/generate_test_token.py --clerk-id my_test_user_456

# Custom name
python scripts/generate_test_token.py --name "John Doe"

# All options together
python scripts/generate_test_token.py --email test@example.com --clerk-id test_user_123 --name "Test User"
```

The script will:

1. Create a test user in the database (if it doesn't exist)
2. Generate a JWT token for that user
3. Print the token and example usage commands

### Method 2: Manual Token Creation (Python)

If you prefer to create tokens manually:

```python
import jwt
from datetime import datetime, timedelta

# Create token payload
token_payload = {
    "sub": "test_clerk_user_123",  # Must match a clerk_user_id in your database
    "email": "test@example.com",
    "iat": int(datetime.utcnow().timestamp()),
    "exp": int((datetime.utcnow() + timedelta(days=365)).timestamp()),
}

# Generate token (signature verification is disabled in auth middleware for testing)
token = jwt.encode(token_payload, "secret", algorithm="HS256")
print(f"Bearer {token}")
```

**Important:** The `sub` field must match a `clerk_user_id` that exists in your database. If the user doesn't exist, you'll get a 404 error.

### Method 3: Create User via API

You can also create a user via the sync endpoint:

```bash
# First, create the user
curl -X POST "http://localhost:8000/api/users/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "clerk_user_id": "test_clerk_user_123",
    "email": "test@example.com",
    "name": "Test User"
  }'

# Then generate a token for that user using Method 1 or 2
```

### Verifying Your Token Works

Test your token with a simple authenticated request:

```bash
# Replace YOUR_TOKEN with your actual token
curl -X GET "http://localhost:8000/api/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

If successful, you'll get user information. If you get a 404, the user doesn't exist in the database yet.

## Notes

- **Caching:** Forecasts are cached for 30 minutes per zip code
- **Rate Limiting:** The weather API (api.weather.gov) has rate limits, but caching helps mitigate this
- **Geocoding:** Uses Nominatim (OpenStreetMap) for zip code to coordinates conversion
- **Data Source:** Forecasts come from the National Weather Service (api.weather.gov)
- **Token Security:** Test tokens are for development only. Signature verification is disabled in the auth middleware for testing purposes.
