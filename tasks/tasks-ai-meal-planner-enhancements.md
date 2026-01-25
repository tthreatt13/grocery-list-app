# Tasks: AI Meal Planner Enhancements

## Relevant Files

### Frontend Files

- `components/meal-planner/AIMealPlanningAssistant.tsx` - Main AI assistant component that needs auto-scroll fix
- `components/meal-planner/__tests__/AIMealPlanningAssistant.test.tsx` - Unit tests for AIMealPlanningAssistant component
- `components/meal-planner/MealDetailsModal.tsx` - Modal component that needs Notes to Recipe Instructions update
- `components/meal-planner/__tests__/MealDetailsModal.test.tsx` - Unit tests for MealDetailsModal component
- `lib/types.ts` - Type definitions (may need updates for meal_category handling)
- `lib/api/meals.ts` - API types for meal_category handling

### Backend Files

- `backend/services/meal_planning_ai.py` - AI prompt formatting and meal suggestion logic that needs eating out recognition
- `backend/tests/services/test_meal_planning_ai.py` - Unit tests for meal planning AI service

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `AIMealPlanningAssistant.tsx` and `AIMealPlanningAssistant.test.tsx` in the same directory).
- Follow Test-Driven Development (TDD): Write tests first, then implement the feature.
- **Always run the MANDATORY Pre-Commit Checklist before committing** (see below).

## Development Workflow Requirements

**⚠️ CRITICAL: Follow the development workflow standards in `.cursor/rules/development-workflow.mdc`**

### Pre-Commit Checklist (MUST PASS BEFORE COMMITTING)

#### Frontend Checks (run from project root)

- [ ] **ESLint:** `npm run lint` - Must pass with no errors
- [ ] **Prettier:** `npm run format:check` - Must pass (code must be formatted)
- [ ] **Tests:** `npm run test:ci` - All tests must pass

#### Backend Checks (run from `backend/` directory)

- [ ] **Flake8 Linting:** `flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics` - Must pass with no errors
- [ ] **Black Formatting:** `black --check --exclude="/(alembic/versions|venv)/" .` - Must pass (code must be formatted)
- [ ] **Tests:** `pytest` - All tests must pass

### Test-Driven Development (TDD)

1. **Write tests first** - Before implementing each feature, write failing tests that describe the desired behavior
2. **Implement minimum code** - Write the minimum code needed to make tests pass
3. **Refactor** - Refactor while keeping tests green

### Testing Standards

**Frontend:**

- Use Jest and React Testing Library
- Write descriptive test names
- Test user interactions, not implementation details
- Use `npm run test:ci` before committing (matches CI behavior)

**Backend:**

- Use Pytest for all backend tests
- Write descriptive test names
- Use pytest fixtures for test setup and teardown
- Run `pytest` before committing

### Code Quality

**Frontend:**

- Run `npm run lint` to check for errors
- Run `npm run format` to format code
- Fix ALL ESLint errors before completing work

**Backend:**

- Run `flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics` from `backend/` directory
- Run `black --exclude="/(alembic/versions|venv)/" .` from `backend/` directory
- **IMPORTANT:** Use Black version 23.11.0 (as specified in `backend/requirements.txt`) to match CI

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

### Workflow for Each Task

1. **Write tests first** (TDD approach)
2. **Implement the feature**
3. **Run tests** to ensure they pass
   - Frontend: `npm run test:ci`
   - Backend: `cd backend && pytest`
4. **Check linting**
   - Frontend: `npm run lint`
   - Backend: `cd backend && flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics`
5. **Format code**
   - Frontend: `npm run format`
   - Backend: `cd backend && black --exclude="/(alembic/versions|venv)/" .`
6. **Verify all checks pass** before marking task complete

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/enhance-ai-meal-planner`

- [ ] 1.0 Fix Auto-Scroll Issue in AI Assistant
  - [x] 1.1 Read `components/meal-planner/AIMealPlanningAssistant.tsx` to understand current scroll behavior
  - [x] 1.2 Identify where input focus triggers auto-scroll (check for `focus()`, `scrollIntoView()`, or browser default behavior)
  - [x] 1.3 Add a ref for the input field using `useRef<HTMLInputElement>(null)`
  - [x] 1.4 Modify input focus behavior to prevent auto-scroll using `preventScroll: true` option or `scrollIntoView({ block: 'nearest' })`
  - [x] 1.5 Ensure chat window container remains visible when assistant opens (check viewport visibility)
  - [ ] 1.6 Test on desktop browsers (Chrome, Firefox, Safari, Edge) - verify chat window stays visible
  - [ ] 1.7 Test on mobile viewport - verify chat anchors above soft keyboard and remains visible
  - [ ] 1.8 Verify keyboard navigation: tabbing after opening places cursor in chat input field
  - [x] 1.9 Write/update tests in `components/meal-planner/__tests__/AIMealPlanningAssistant.test.tsx` for scroll behavior
  - [x] 1.10 Run `npm run test:ci` to ensure all frontend tests pass
  - [x] 1.11 Run `npm run lint` and fix any ESLint errors
  - [x] 1.12 Run `npm run format` to format code

- [ ] 2.0 Optimize AI Prompt for Eating Out Recognition
  - [x] 2.1 Read `backend/services/meal_planning_ai.py` to understand current prompt structure
  - [x] 2.2 Review the `format_meal_planning_prompt` function to see current system instructions
  - [x] 2.3 Update system instruction to include recognition of "eating out" scenarios with examples:
    - Add instructions to recognize phrases like "eating out", "dining out", "restaurant", "takeout", "fast food", "ordering in", "grabbing lunch out"
    - Add explicit instruction to set `meal_category: "eat_out"` when user indicates eating out
  - [x] 2.4 Update JSON structure example in prompt to include `meal_category` field:
    - Add `"meal_category": "normal|quick_meal|eat_out"` to the example JSON structure
    - Document when to use each category: `"eat_out"` for restaurant/takeout, `"quick_meal"` for quick/easy meals, `"normal"` for regular home-cooked
  - [x] 2.5 Verify parsing logic in `parse_llm_response` handles `meal_category` field (should already work since it parses full JSON)
  - [x] 2.6 Write/update tests in `backend/tests/services/test_meal_planning_ai.py`:
    - Test that prompt includes meal_category instructions
    - Test that eating out phrases are recognized (use test phrases from PRD)
    - Test that home-cooked phrases still work correctly (regression test)
  - [ ] 2.7 Test with all 11 test phrases from PRD acceptance criteria:
    - "Eating out", "Dining at a restaurant", "Takeout for lunch", "Fast food breakfast", "Ordering in pizza", "Cafe breakfast", "Grabbing lunch out", "Dinner at a sushi place", "Getting burgers from a drive-thru", "Had ramen at a noodle shop", "Coffee and pastry from a bakery"
    - Note: This requires manual/integration testing with the actual API and will be done in task 4.0 (Testing and Validation)
  - [x] 2.8 Run `cd backend && pytest` to ensure all backend tests pass
  - [x] 2.9 Run `cd backend && flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics` and fix any errors
  - [x] 2.10 Run `cd backend && black --exclude="/(alembic/versions|venv)/" .` to format code

- [ ] 3.0 Update MealDetailsModal to Show Recipe Instructions
  - [ ] 3.1 Read `components/meal-planner/MealDetailsModal.tsx` to understand current structure
  - [ ] 3.2 Locate the "Notes" section (around line 97 based on PRD)
  - [ ] 3.3 Change label from "Notes" to "Recipe Instructions" in the heading/label
  - [ ] 3.4 Update any other references to "Notes" in the modal to "Recipe Instructions"
  - [ ] 3.5 Verify the display logic for notes/recipe instructions (keep simple for now - just label change)
  - [ ] 3.6 Test that existing meals with notes display correctly with new label
  - [ ] 3.7 Test responsive layout on desktop, tablet, and mobile viewports
  - [ ] 3.8 Write/update tests in `components/meal-planner/__tests__/MealDetailsModal.test.tsx`:
    - Test that "Recipe Instructions" label appears instead of "Notes"
    - Test that notes content still displays correctly
  - [ ] 3.9 Run `npm run test:ci` to ensure all frontend tests pass
  - [ ] 3.10 Run `npm run lint` and fix any ESLint errors
  - [ ] 3.11 Run `npm run format` to format code

- [ ] 4.0 Testing and Validation
  - [ ] 4.1 Run all frontend tests: `npm run test:ci`
  - [ ] 4.2 Run all backend tests: `cd backend && pytest`
  - [ ] 4.3 Manual testing - Auto-Scroll Fix:
    - Open AI assistant from various scroll positions
    - Verify chat window remains fully visible (header, input, last 2 responses)
    - Test on desktop and mobile viewports
    - Verify keyboard navigation works (tab to input field)
  - [ ] 4.4 Manual testing - Eating Out Recognition:
    - Test all 11 phrases from PRD acceptance criteria
    - Verify each creates meal with `meal_category: "eat_out"`
    - Test home-cooked phrases to ensure no regression
  - [ ] 4.5 Manual testing - Recipe Instructions:
    - Open MealDetailsModal for meals with notes
    - Verify "Recipe Instructions" label appears (not "Notes")
    - Test on desktop, tablet, and mobile viewports
  - [ ] 4.6 Run frontend linting: `npm run lint`
  - [ ] 4.7 Run frontend formatting check: `npm run format:check`
  - [ ] 4.8 Run backend linting: `cd backend && flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics`
  - [ ] 4.9 Run backend formatting check: `cd backend && black --check --exclude="/(alembic/versions|venv)/" .`
  - [ ] 4.10 Verify all pre-commit checklist items pass before finalizing
