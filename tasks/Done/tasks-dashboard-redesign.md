# Tasks: Dashboard Redesign - Actionable Insights and Smart Shopping Workflow

## Relevant Files

### Backend

- `backend/routes/dashboard.py` - Dashboard insights API endpoint
- `backend/schemas/dashboard.py` - Pydantic schemas for dashboard responses
- `backend/tests/routes/test_dashboard.py` - Backend tests for dashboard endpoint
- `backend/main.py` - Updated to register dashboard router

### Frontend

- `lib/api/dashboard.ts` - Frontend API client for dashboard insights
- `lib/api/__tests__/dashboard.test.ts` - Frontend tests for dashboard API client
- `components/dashboard/UrgentActionItems.tsx` - Urgent action items component
- `components/dashboard/__tests__/UrgentActionItems.test.tsx` - Tests for UrgentActionItems component
- `components/dashboard/SmartSuggestions.tsx` - Smart suggestions component
- `components/dashboard/__tests__/SmartSuggestions.test.tsx` - Tests for SmartSuggestions component
- `components/dashboard/InsightsDisplay.tsx` - Insights and patterns display component
- `components/dashboard/__tests__/InsightsDisplay.test.tsx` - Tests for InsightsDisplay component
- `components/dashboard/DashboardLayout.tsx` - Context-aware dashboard layout component
- `components/dashboard/__tests__/DashboardLayout.test.tsx` - Tests for DashboardLayout component
- `lib/utils/contextDetection.ts` - Context detection utilities (time of day, day of week)
- `lib/utils/__tests__/contextDetection.test.ts` - Tests for context detection utilities
- `lib/utils/dismissedItems.ts` - Utilities for managing dismissed items (sessionStorage)
- `app/page.tsx` - Dashboard page with integrated dashboard components
- `app/__tests__/page.test.tsx` - Integration tests for dashboard page

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/dashboard-redesign`)
- [x] 1.0 Set up backend data aggregation and API endpoints for dashboard insights
  - [x] 1.1 Write tests for dashboard insights API endpoint
  - [x] 1.2 Create backend schema for dashboard insights response (urgent items, suggestions, stats)
  - [x] 1.3 Implement backend service/function to aggregate urgent items (low stock, expiring soon)
  - [x] 1.4 Implement backend service/function to generate smart suggestions
  - [x] 1.5 Create `/api/dashboard/insights` endpoint that aggregates all dashboard data
  - [x] 1.6 Write and run backend tests to ensure endpoint works correctly
  - [x] 1.7 Create frontend API client function for dashboard insights
  - [x] 1.8 Write frontend tests for API client
- [x] 2.0 Implement Urgent Action Items section
  - [x] 2.1 Write tests for UrgentActionItems component
  - [x] 2.2 Create UrgentActionItems component to display urgent items
  - [x] 2.3 Implement card-based UI for urgent items with visual indicators
  - [x] 2.4 Add one-click actions (e.g., "Add to List", "Mark as Done")
  - [x] 2.5 Integrate UrgentActionItems into dashboard page
  - [x] 2.6 Write integration tests for urgent items section
- [x] 3.0 Implement Smart Suggestions Engine
  - [x] 3.1 Write tests for SmartSuggestions component
  - [x] 3.2 Create SmartSuggestions component to display personalized recommendations
  - [x] 3.3 Implement suggestion card UI with accept/dismiss actions
  - [x] 3.4 Add logic to handle suggestion acceptance (e.g., add to grocery list)
  - [x] 3.5 Integrate SmartSuggestions into dashboard page
  - [x] 3.6 Write integration tests for suggestions section
- [x] 4.0 Implement Context-Aware Views and layout system
  - [x] 4.1 Write tests for context detection utilities (time of day, day of week)
  - [x] 4.2 Create utility functions to detect user context (morning, evening, shopping day)
  - [x] 4.3 Write tests for DashboardLayout component with context-aware rendering
  - [x] 4.4 Create DashboardLayout component that adapts based on context
  - [x] 4.5 Implement different view modes (morning planning, shopping, routine review)
  - [x] 4.6 Update dashboard page to use context-aware layout
  - [x] 4.7 Write integration tests for context-aware views
- [x] 5.0 Implement Insights & Patterns Display
  - [x] 5.1 Write tests for InsightsDisplay component
  - [x] 5.2 Create InsightsDisplay component for consumption trends and patterns
  - [x] 5.3 Implement visual indicators for patterns (e.g., most purchased items)
  - [x] 5.4 Add actionable stats display (e.g., "You've saved X this month")
  - [x] 5.5 Integrate InsightsDisplay into dashboard page
  - [x] 5.6 Write integration tests for insights section
- [x] 6.0 Testing, integration, and performance optimization
  - [x] 6.1 Run all tests and ensure they pass (`npm test`)
  - [x] 6.2 Run ESLint and fix all errors (`npm run lint`)
  - [x] 6.3 Format code with Prettier (`npm run format`)
  - [x] 6.4 Run test coverage and ensure adequate coverage
  - [x] 6.5 Test dashboard load time and optimize if needed
  - [x] 6.6 Test mobile responsiveness
  - [x] 6.7 Verify all dashboard features work end-to-end
  - [x] 6.8 Update relevant files list in this document
