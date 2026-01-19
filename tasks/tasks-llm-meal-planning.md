# Task List: LLM-Powered Meal Planning Integration

## Relevant Files

- `backend/requirements.txt` - Add anthropic Python package dependency
- `backend/config.py` - Add ANTHROPIC_API_KEY configuration
- `backend/services/meal_planning_ai.py` - **NEW** - AI service module for context gathering, prompt formatting, and Anthropic API integration
- `backend/schemas/meal.py` - Add AI-related Pydantic schemas (MealSuggestion, AISuggestRequest, AISuggestResponse, ChatMessage)
- `backend/routes/meals.py` - Add POST /api/meals/ai-suggest endpoint
- `backend/tests/services/test_meal_planning_ai.py` - **NEW** - Unit tests for AI service
- `backend/tests/routes/test_meals.py` - Add integration tests for AI suggest endpoint
- `lib/api/meals.ts` - Add getAIMealSuggestions() API client function
- `lib/types.ts` - Add TypeScript types for AI suggestions and chat messages
- `components/meal-planner/AIMealPlanningAssistant.tsx` - **NEW** - Main AI assistant component with chat interface
- `components/meal-planner/MealSuggestionCard.tsx` - **NEW** - Component for displaying individual meal suggestions
- `components/meal-planner/AIMealPlanningAssistant.test.tsx` - **NEW** - Component tests for AI assistant
- `app/meal-planner/page.tsx` - Integrate AI assistant component into meal planner page
- `railway-env-template.txt` - Add ANTHROPIC_API_KEY environment variable

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run frontend tests. Running without a path executes all tests found by the Jest configuration.
- Use `pytest [optional/path/to/test/file]` to run backend tests. Running without a path executes all tests.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/llm-meal-planning`)

- [x] 1.0 Backend Setup and Dependencies
  - [x] 1.1 Add anthropic package to backend/requirements.txt
  - [x] 1.2 Add ANTHROPIC_API_KEY to backend/config.py
  - [x] 1.3 Add ANTHROPIC_API_KEY to railway-env-template.txt

- [x] 2.0 Backend AI Service and API Endpoint
  - [x] 2.1 Create backend/services/meal_planning_ai.py with context gathering functions
  - [x] 2.2 Implement prompt formatting function in AI service
  - [x] 2.3 Implement Anthropic API calling function with error handling
  - [x] 2.4 Implement LLM response parsing function
  - [x] 2.5 Add AI-related Pydantic schemas to backend/schemas/meal.py
  - [x] 2.6 Create POST /api/meals/ai-suggest endpoint in backend/routes/meals.py
  - [x] 2.7 Add authentication and permission checks to AI endpoint

- [x] 3.0 Frontend API Client and Types
  - [x] 3.1 Add TypeScript types for AI suggestions and chat messages to lib/types.ts
  - [x] 3.2 Add getAIMealSuggestions() function to lib/api/meals.ts

- [x] 4.0 Frontend AI Assistant Component
  - [x] 4.1 Create components/meal-planner/MealSuggestionCard.tsx component
  - [x] 4.2 Create components/meal-planner/AIMealPlanningAssistant.tsx with chat interface
  - [x] 4.3 Implement meal suggestions display in AI assistant
  - [x] 4.4 Implement meal selection and editing functionality
  - [x] 4.5 Implement apply meals functionality

- [ ] 5.0 Integration and Optional Features
  - [ ] 5.1 Integrate AI assistant component into app/meal-planner/page.tsx
  - [ ] 5.2 Add optional grocery list generation after meals are applied
  - [ ] 5.3 Style chat interface for desktop and mobile responsiveness
  - [ ] 5.4 Add error handling and loading states throughout

- [ ] 6.0 Testing
  - [ ] 6.1 Write unit tests for AI service context gathering functions
  - [ ] 6.2 Write unit tests for prompt formatting
  - [ ] 6.3 Write integration tests for AI suggest endpoint (with mocked Anthropic API)
  - [ ] 6.4 Write component tests for AIMealPlanningAssistant
  - [ ] 6.5 Write component tests for MealSuggestionCard
