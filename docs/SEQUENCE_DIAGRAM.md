# Grocery List App - Sequence Diagrams

This document contains sequence diagrams illustrating the key user flows and system interactions in the Grocery List App.

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Clerk as Clerk Auth
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    User->>Frontend: Navigate to sign-in page
    Frontend->>Clerk: Display Clerk sign-in component
    User->>Clerk: Enter credentials
    Clerk->>Clerk: Authenticate user
    Clerk->>Frontend: Return JWT token
    Frontend->>Frontend: Store token in session

    Note over Frontend,Backend: User makes authenticated request
    User->>Frontend: Access protected page
    Frontend->>Frontend: Get token from Clerk session
    Frontend->>Backend: API request with Bearer token
    Backend->>Backend: Verify JWT token (get_current_user)
    Backend->>DB: Query user by clerk_user_id
    DB-->>Backend: Return user record
    Backend-->>Frontend: Return authenticated response
    Frontend-->>User: Display page content
```

## Dashboard Load Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    User->>Frontend: Navigate to dashboard
    Frontend->>Frontend: Check authentication (Clerk)
    Frontend->>Frontend: Get JWT token

    par Fetch Grocery Lists
        Frontend->>Backend: GET /api/grocery-lists?include_items=true
        Backend->>Backend: Verify token (get_current_user)
        Backend->>DB: Query user's households
        DB-->>Backend: Return household IDs
        Backend->>DB: Query grocery lists for households
        DB-->>Backend: Return lists with items
        Backend-->>Frontend: Return grocery lists
    and Fetch Dashboard Insights
        Frontend->>Backend: GET /api/dashboard/insights
        Backend->>Backend: Verify token (get_current_user)
        Backend->>DB: Query user's households
        DB-->>Backend: Return household IDs

        par Get Urgent Items
            Backend->>DB: Query pantry items (low stock, expiring)
            DB-->>Backend: Return urgent items
        and Get Suggestions
            Backend->>DB: Query pantry, lists, meals
            DB-->>Backend: Return data for suggestions
            Backend->>Backend: Generate suggestions (restock, meal planning, etc.)
        and Get Stats
            Backend->>DB: Query lists, items, meals, pantry
            DB-->>Backend: Return statistics
        end

        Backend->>Backend: Aggregate insights
        Backend-->>Frontend: Return insights (urgent_items, suggestions, stats)
    end

    Frontend->>Frontend: Transform API data (adapters)
    Frontend->>Frontend: Filter dismissed items (sessionStorage)
    Frontend->>Frontend: Detect user context (time of day, day of week)
    Frontend-->>User: Display dashboard with context-aware layout
```

## Grocery List Management Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    Note over User,DB: Create New Grocery List
    User->>Frontend: Click "Create List"
    Frontend->>Frontend: Show create form
    User->>Frontend: Enter list name, select household
    User->>Frontend: Submit form
    Frontend->>Frontend: Get JWT token
    Frontend->>Backend: POST /api/grocery-lists {name, household_id}
    Backend->>Backend: Verify token (get_current_user)
    Backend->>Backend: Validate permissions (household member)
    Backend->>DB: INSERT grocery_list
    DB-->>Backend: Return created list
    Backend-->>Frontend: Return grocery list
    Frontend->>Frontend: Update local state
    Frontend-->>User: Display new list

    Note over User,DB: Add Item to List
    User->>Frontend: Click "Add Item"
    Frontend->>Frontend: Show add item form
    User->>Frontend: Enter item details (name, quantity, category)
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/grocery-lists/{id}/items
    Backend->>Backend: Verify token & permissions
    Backend->>DB: INSERT grocery_item
    DB-->>Backend: Return created item
    Backend-->>Frontend: Return grocery item
    Frontend->>Frontend: Update local state (optimistic update)
    Frontend-->>User: Display new item in list

    Note over User,DB: Toggle Item Checked Status
    User->>Frontend: Click checkbox on item
    Frontend->>Frontend: Optimistic update (immediate UI change)
    Frontend->>Backend: PUT /api/grocery-lists/{id}/items/{itemId} {checked: true}
    Backend->>Backend: Verify token & permissions
    Backend->>DB: UPDATE grocery_item SET checked = true
    DB-->>Backend: Return updated item
    Backend-->>Frontend: Return updated item
    alt API Success
        Frontend->>Frontend: Confirm optimistic update
    else API Error
        Frontend->>Frontend: Rollback optimistic update
        Frontend-->>User: Show error message
    end
```

## Meal Planning Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    Note over User,DB: Load Meal Planner
    User->>Frontend: Navigate to meal planner
    Frontend->>Frontend: Get JWT token
    Frontend->>Backend: GET /api/meals?week_start={date}
    Backend->>Backend: Verify token (get_current_user)
    Backend->>DB: Query user's households
    Backend->>DB: Query meals for households in date range
    DB-->>Backend: Return meals
    Backend-->>Frontend: Return meals array
    Frontend->>Frontend: Group meals by date and meal_type
    Frontend-->>User: Display weekly calendar with meals

    Note over User,DB: Add Meal
    User->>Frontend: Click on calendar slot
    Frontend->>Frontend: Show AddMealModal
    User->>Frontend: Enter meal details (name, ingredients, category)
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/meals {date, meal_type, name, ingredients, category}
    Backend->>Backend: Verify token & permissions
    Backend->>DB: INSERT meal
    DB-->>Backend: Return created meal
    Backend-->>Frontend: Return meal
    Frontend->>Frontend: Update local state
    Frontend-->>User: Display meal in calendar

    Note over User,DB: Generate Grocery List from Meals
    User->>Frontend: Click "Generate List from Meals"
    Frontend->>Frontend: Show GenerateGroceryListFromMealsModal
    User->>Frontend: Select date range, enter list name
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/meals/generate-grocery-list
    Backend->>Backend: Verify token & permissions
    Backend->>DB: Query meals in date range (exclude "Eat Out")
    DB-->>Backend: Return meals with ingredients
    Backend->>Backend: Aggregate ingredients from all meals
    Backend->>DB: INSERT grocery_list
    Backend->>DB: INSERT grocery_items (one per unique ingredient)
    DB-->>Backend: Return created list with items
    Backend-->>Frontend: Return grocery list
    Frontend->>Frontend: Navigate to grocery list page
    Frontend-->>User: Display generated grocery list
```

## Pantry Management Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    Note over User,DB: Load Pantry
    User->>Frontend: Navigate to pantry page
    Frontend->>Frontend: Get JWT token
    Frontend->>Backend: GET /api/pantry
    Backend->>Backend: Verify token (get_current_user)
    Backend->>DB: Query user's households
    Backend->>DB: Query pantry_items for households
    DB-->>Backend: Return pantry items
    Backend-->>Frontend: Return pantry items array
    Frontend->>Frontend: Calculate statistics (total, low stock, expiring)
    Frontend-->>User: Display pantry grid with items

    Note over User,DB: Add Pantry Item
    User->>Frontend: Click "Add Item"
    Frontend->>Frontend: Show AddPantryItemForm
    User->>Frontend: Enter item details (name, quantity, expiration, threshold)
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/pantry {name, quantity, expiration_date, low_stock_threshold}
    Backend->>Backend: Verify token & permissions
    Backend->>DB: INSERT pantry_item
    DB-->>Backend: Return created item
    Backend-->>Frontend: Return pantry item
    Frontend->>Frontend: Update local state
    Frontend-->>User: Display new item in grid

    Note over User,DB: Update Pantry Item (e.g., after shopping)
    User->>Frontend: Click "Edit" on item
    Frontend->>Frontend: Show EditPantryItemForm
    User->>Frontend: Update quantity or expiration date
    User->>Frontend: Submit form
    Frontend->>Backend: PUT /api/pantry/{id} {quantity, expiration_date}
    Backend->>Backend: Verify token & permissions
    Backend->>DB: UPDATE pantry_item
    DB-->>Backend: Return updated item
    Backend-->>Frontend: Return updated item
    Frontend->>Frontend: Update local state
    Frontend-->>User: Display updated item

    Note over User,DB: Generate Grocery List from Low Stock
    User->>Frontend: Click "Generate List" on low stock alert
    Frontend->>Frontend: Show GenerateGroceryListModal
    User->>Frontend: Select low stock items, enter list name
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/pantry/generate-grocery-list
    Backend->>Backend: Verify token & permissions
    Backend->>DB: Query selected pantry items
    Backend->>DB: INSERT grocery_list
    Backend->>DB: INSERT grocery_items (one per selected pantry item)
    DB-->>Backend: Return created list with items
    Backend-->>Frontend: Return grocery list
    Frontend->>Frontend: Navigate to grocery list page
    Frontend-->>User: Display generated grocery list
```

## Household Management Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL
    participant WeatherAPI as Weather.gov API

    Note over User,DB: Load Household Page
    User->>Frontend: Navigate to household page
    Frontend->>Frontend: Get JWT token
    par Fetch Household Data
        Frontend->>Backend: GET /api/households
        Backend->>Backend: Verify token (get_current_user)
        Backend->>DB: Query user's households with members
        DB-->>Backend: Return households with members
        Backend-->>Frontend: Return households
    and Fetch Shared Lists
        Frontend->>Backend: GET /api/grocery-lists
        Backend->>DB: Query shared grocery lists
        DB-->>Backend: Return shared lists
        Backend-->>Frontend: Return shared lists
    and Fetch Weather Forecast
        Frontend->>Backend: GET /api/weather/forecast?zip_code={zip}
        Backend->>Backend: Verify token
        Backend->>Backend: Check weather cache
        alt Cache Hit
            Backend-->>Frontend: Return cached forecast
        else Cache Miss
            Backend->>WeatherAPI: GET /gridpoints/{office}/{gridX},{gridY}/forecast
            WeatherAPI-->>Backend: Return 7-day forecast
            Backend->>Backend: Cache forecast data
            Backend-->>Frontend: Return forecast
        end
    end
    Frontend-->>User: Display household members, shared lists, weather

    Note over User,DB: Invite Household Member
    User->>Frontend: Click "Invite Member"
    Frontend->>Frontend: Show InviteMemberForm
    User->>Frontend: Enter email, select role
    User->>Frontend: Submit form
    Frontend->>Backend: POST /api/households/{id}/members {email, role}
    Backend->>Backend: Verify token & permissions (admin)
    Backend->>DB: Query user by email
    DB-->>Backend: Return user (or null)
    alt User Exists
        Backend->>DB: INSERT household_member
        DB-->>Backend: Return created member
    else User Not Found
        Backend-->>Frontend: Return error (user must sign up first)
        Frontend-->>User: Show error message
    end
    Backend-->>Frontend: Return household member
    Frontend->>Frontend: Update local state
    Frontend-->>User: Display new member in list

    Note over User,DB: Update Household Preferences
    User->>Frontend: Click "Edit Preferences"
    Frontend->>Frontend: Show PreferencesForm
    User->>Frontend: Enter zip code for weather
    User->>Frontend: Submit form
    Frontend->>Backend: PUT /api/households/{id}/preferences {zip_code}
    Backend->>Backend: Verify token & permissions
    Backend->>DB: UPDATE household_user_preferences
    DB-->>Backend: Return updated preferences
    Backend-->>Frontend: Return preferences
    Frontend->>Frontend: Update local state
    Frontend->>Frontend: Refresh weather forecast with new zip
    Frontend-->>User: Display updated weather forecast
```

## Clerk Webhook Flow (User Sync)

```mermaid
sequenceDiagram
    participant Clerk as Clerk Service
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    Note over Clerk,DB: User Created Event
    Clerk->>Backend: POST /api/auth/webhook {type: "user.created", data: {id, email, name}}
    Backend->>Backend: Verify webhook signature (production)
    Backend->>DB: INSERT user {clerk_user_id, email, name}
    DB-->>Backend: Return created user
    Backend-->>Clerk: 200 OK

    Note over Clerk,DB: User Updated Event
    Clerk->>Backend: POST /api/auth/webhook {type: "user.updated", data: {id, email, name}}
    Backend->>Backend: Verify webhook signature
    Backend->>DB: UPDATE user SET email=?, name=? WHERE clerk_user_id=?
    DB-->>Backend: Return updated user
    Backend-->>Clerk: 200 OK

    Note over Clerk,DB: User Deleted Event
    Clerk->>Backend: POST /api/auth/webhook {type: "user.deleted", data: {id}}
    Backend->>Backend: Verify webhook signature
    Backend->>DB: DELETE user WHERE clerk_user_id=?
    DB-->>Backend: Confirm deletion
    Backend-->>Clerk: 200 OK
```

## Complete User Journey: Planning Meals and Shopping

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL

    Note over User,DB: Step 1: Plan Weekly Meals
    User->>Frontend: Navigate to meal planner
    Frontend->>Backend: GET /api/meals?week_start={date}
    Backend->>DB: Query meals
    DB-->>Backend: Return meals
    Backend-->>Frontend: Return meals
    Frontend-->>User: Display weekly calendar

    loop For each day/meal
        User->>Frontend: Add meal (Breakfast/Lunch/Dinner)
        Frontend->>Backend: POST /api/meals
        Backend->>DB: INSERT meal
        DB-->>Backend: Return meal
        Backend-->>Frontend: Return meal
        Frontend-->>User: Display meal in calendar
    end

    Note over User,DB: Step 2: Generate Shopping List
    User->>Frontend: Click "Generate List from Meals"
    Frontend->>Backend: POST /api/meals/generate-grocery-list
    Backend->>DB: Query meals, aggregate ingredients
    Backend->>DB: INSERT grocery_list and items
    DB-->>Backend: Return list with items
    Backend-->>Frontend: Return grocery list
    Frontend-->>User: Display generated list

    Note over User,DB: Step 3: Check Pantry Before Shopping
    User->>Frontend: Navigate to pantry
    Frontend->>Backend: GET /api/pantry
    Backend->>DB: Query pantry items
    DB-->>Backend: Return pantry items
    Backend-->>Frontend: Return pantry items
    Frontend-->>User: Display pantry grid

    User->>Frontend: Remove items already in pantry from grocery list
    Frontend->>Backend: DELETE /api/grocery-lists/{id}/items/{itemId}
    Backend->>DB: DELETE grocery_item
    DB-->>Backend: Confirm deletion
    Backend-->>Frontend: Confirm deletion
    Frontend-->>User: Update list display

    Note over User,DB: Step 4: Shop and Check Off Items
    loop For each item purchased
        User->>Frontend: Check item checkbox
        Frontend->>Backend: PUT /api/grocery-lists/{id}/items/{itemId} {checked: true}
        Backend->>DB: UPDATE grocery_item SET checked=true
        DB-->>Backend: Return updated item
        Backend-->>Frontend: Return updated item
        Frontend-->>User: Show item as checked
    end

    Note over User,DB: Step 5: Update Pantry After Shopping
    User->>Frontend: Navigate to pantry
    loop For each item purchased
        User->>Frontend: Update pantry item quantity
        Frontend->>Backend: PUT /api/pantry/{id} {quantity: new_quantity}
        Backend->>DB: UPDATE pantry_item
        DB-->>Backend: Return updated item
        Backend-->>Frontend: Return updated item
        Frontend-->>User: Display updated quantity
    end

    Note over User,DB: Step 6: Archive Completed List
    User->>Frontend: Click "Archive List"
    Frontend->>Backend: PUT /api/grocery-lists/{id} {is_archived: true}
    Backend->>DB: UPDATE grocery_list SET is_archived=true
    DB-->>Backend: Return archived list
    Backend-->>Frontend: Return archived list
    Frontend-->>User: Remove list from active view
```

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js App]
        B[Clerk Auth SDK]
        C[API Client Layer]
        D[React Components]
    end

    subgraph "Authentication"
        E[Clerk Service]
    end

    subgraph "Backend Layer"
        F[FastAPI Application]
        G[Auth Middleware]
        H[Route Handlers]
        I[Business Logic]
    end

    subgraph "Data Layer"
        J[PostgreSQL Database]
        K[Weather API Cache]
    end

    subgraph "External Services"
        L[Weather.gov API]
    end

    A --> B
    B --> E
    A --> C
    C --> F
    F --> G
    G --> H
    H --> I
    I --> J
    I --> K
    K --> L

    D --> A
    H --> I
```

## Key Components Interaction

```mermaid
sequenceDiagram
    participant User
    participant Dashboard as Dashboard Page
    participant UrgentItems as UrgentActionItems
    participant Suggestions as SmartSuggestions
    participant Insights as InsightsDisplay
    participant API as API Client
    participant Backend as FastAPI Backend

    User->>Dashboard: Load dashboard
    Dashboard->>API: getGroceryListsWithItems()
    Dashboard->>API: getDashboardInsights()

    API->>Backend: GET /api/grocery-lists
    API->>Backend: GET /api/dashboard/insights

    Backend-->>API: Return data
    API-->>Dashboard: Return transformed data

    Dashboard->>UrgentItems: Pass urgent items
    Dashboard->>Suggestions: Pass suggestions
    Dashboard->>Insights: Pass stats

    UrgentItems-->>User: Display urgent items
    Suggestions-->>User: Display suggestions
    Insights-->>User: Display statistics

    User->>UrgentItems: Click "Add to List"
    UrgentItems->>API: addGroceryItem()
    API->>Backend: POST /api/grocery-lists/{id}/items
    Backend-->>API: Return created item
    API-->>UrgentItems: Return item
    UrgentItems-->>User: Show success, update UI

    User->>Suggestions: Click "Accept" on suggestion
    Suggestions->>API: createGroceryList() or addGroceryItem()
    API->>Backend: POST request
    Backend-->>API: Return created resource
    API-->>Suggestions: Return data
    Suggestions-->>User: Show success, dismiss suggestion
```

---

## Notes

- **Authentication**: All API requests (except webhooks) require a valid Clerk JWT token in the Authorization header
- **Error Handling**: Frontend implements optimistic updates with rollback on error for better UX
- **Caching**: Weather forecasts are cached in the backend to reduce API calls
- **Permissions**: Backend validates user permissions (household membership, admin roles) for all operations
- **Data Transformation**: Frontend uses adapter pattern to transform API responses to UI-friendly formats
- **Session Storage**: Dismissed items and suggestions are stored in browser sessionStorage for the current session
