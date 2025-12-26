# Tasks: Auto-Populate Previous Meals from Meal Planner

## Relevant Files

- `components/household/PreferencesForm.tsx` - Main form component that needs meal fetching and auto-population logic
- `components/household/__tests__/PreferencesForm.test.tsx` - Unit tests for PreferencesForm component
- `components/household/PreferencesDisplay.tsx` - Display component (no changes needed, but verify it still works)
- `components/household/__tests__/PreferencesDisplay.test.tsx` - Unit tests for PreferencesDisplay component
- `app/household/page.tsx` - Parent page component that may need to pass household ID to PreferencesForm
- `app/household/__tests__/page.test.tsx` - Unit tests for household page
- `lib/api/meals.ts` - API functions for fetching meals (already exists, no changes needed)
- `lib/api/household.ts` - API functions for household preferences (already exists, no changes needed)

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `PreferencesForm.tsx` and `PreferencesForm.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

### 0.0 Create feature branch

- [x] 0.1 Create and checkout feature branch: `git checkout -b feature/auto-populate-previous-meals`
- [x] 0.2 Verify branch was created successfully

### 1.0 Add meal fetching logic to PreferencesForm component

- [x] 1.1 Import necessary dependencies in `PreferencesForm.tsx`:
  - Import `getWeeklyMeals` and `getWeekStartDate` from `@/lib/api/meals`
  - Import `useAuth` from `@clerk/nextjs` (if not already imported)
- [x] 1.2 Add state management for meal fetching:
  - Add `isLoadingMeals` state (boolean)
  - Add `mealsError` state (string | null)
  - Add `fetchedMeals` state (string[] | null) to store meal names from API
- [x] 1.3 Add `useEffect` hook to fetch meals when component mounts in edit mode:
  - Check if `preferences?.household_id` exists
  - Check if form is in edit mode (determine how to detect edit mode - may need to add prop or check if preferences exist)
  - Fetch meals only once when form enters edit mode
  - Use `getToken()` from `useAuth()` hook to get authentication token
- [x] 1.4 Implement meal fetching function:
  - Calculate previous week's Monday (see task 2.0)
  - Call `getWeeklyMeals()` with previous week date and household ID
  - Extract meal names from response (see task 3.0)
  - Update `fetchedMeals` state with extracted names
  - Handle errors gracefully (see task 4.0)

### 2.0 Implement previous week date calculation

- [x] 2.1 Create helper function to calculate previous week's Monday:
  - Use `getWeekStartDate()` to get current week's Monday
  - Subtract 7 days from current week's Monday to get previous week's Monday
  - Return date as YYYY-MM-DD string format
- [x] 2.2 Test date calculation edge cases:
  - Test when current date is Monday (should return previous Monday)
  - Test when current date is Sunday (should return previous Monday)
  - Test across month boundaries
  - Test across year boundaries
- [x] 2.3 Integrate date calculation into meal fetching logic:
  - Call helper function in `useEffect` before calling `getWeeklyMeals()`
  - Pass calculated date to `getWeeklyMeals()` API call

### 3.0 Extract and deduplicate meal names from API response

- [x] 3.1 Extract meal names from API response:
  - Access `response.meals` array from `getWeeklyMeals()` response
  - Map over meals array to extract `name` property from each meal
  - Filter out any empty or null meal names
- [x] 3.2 Implement deduplication logic:
  - Create Set or use array methods to remove duplicate meal names
  - Preserve original capitalization and formatting (as per PRD recommendation)
  - Sort meal names alphabetically (optional, but improves UX)
- [x] 3.3 Update form state with extracted meals:
  - When meals are successfully fetched, update `previousMeals` state
  - Format meal names as comma-separated string to match current input format
  - Only auto-populate if `previousMeals` is empty or if preferences don't have existing `previous_meals` (per PRD: meal planner is source of truth)

### 4.0 Add loading states and error handling

- [x] 4.1 Implement loading state management:
  - Set `isLoadingMeals` to `true` when starting meal fetch
  - Set `isLoadingMeals` to `false` when fetch completes (success or error)
  - Use try-catch block around API call
- [x] 4.2 Implement error handling:
  - Catch errors from `getWeeklyMeals()` API call
  - Set `mealsError` state with error message (for debugging)
  - Log error to console for debugging
  - Do NOT block form functionality if meal fetch fails (allow manual entry)
  - Do NOT show error message to user (silent failure per PRD)
- [x] 4.3 Handle edge cases:
  - If no household ID is available, skip meal fetching
  - If no meals exist for previous week, handle gracefully (empty array)
  - If API returns empty meals array, set `fetchedMeals` to empty array
  - If user doesn't have edit permissions, skip meal fetching

### 5.0 Update UI with helper text and visual indicators

- [x] 5.1 Add loading indicator to "Previous Meals" input field:
  - Show subtle loading spinner or disabled state while `isLoadingMeals` is true
  - Consider adding a small spinner icon next to the input label
  - Disable input field during loading (optional, but prevents user confusion)
- [x] 5.2 Update helper text for "Previous Meals" input:
  - Modify existing helper text to mention auto-population from meal planner
  - Example: "Meals from last week's meal planner will be auto-populated. Enter meals you've already made this week, separated by commas."
  - Keep text concise and informative
- [x] 5.3 Add visual indicator (optional enhancement):
  - Consider adding a small badge or icon next to input label indicating "Auto-populated from meal planner"
  - Use subtle styling that doesn't overwhelm the UI
  - Only show indicator when meals were successfully auto-populated
- [x] 5.4 Ensure UI updates correctly:
  - Verify input field populates with meal names when fetch completes
  - Verify user can still manually edit the field after auto-population
  - Verify field remains editable and functional

### 6.0 Write and update tests

- [x] 6.1 Update `PreferencesForm.test.tsx` to test meal fetching:
  - Mock `getWeeklyMeals` API function
  - Mock `getWeekStartDate` helper function
  - Mock `useAuth` hook to return a token
- [x] 6.2 Write test for successful meal auto-population:
  - Test that meals are fetched when form loads in edit mode
  - Test that meal names are extracted and deduplicated correctly
  - Test that input field is populated with comma-separated meal names
  - Test that user can still edit the auto-populated meals
- [x] 6.3 Write test for previous week date calculation:
  - Test helper function with various dates (Monday, Sunday, mid-week)
  - Test edge cases (month boundaries, year boundaries)
  - Verify returned date format is YYYY-MM-DD
- [x] 6.4 Write test for error handling:
  - Test that form still works when meal fetching fails
  - Test that no error message is shown to user on failure
  - Test that manual entry still works after fetch failure
- [x] 6.5 Write test for loading states:
  - Test that loading indicator appears during meal fetch
  - Test that loading indicator disappears after fetch completes
  - Test that input field is properly disabled/enabled during loading
- [x] 6.6 Write test for edge cases:
  - Test behavior when no household ID is available
  - Test behavior when previous week has no meals
  - Test behavior when API returns empty meals array
  - Test that existing preferences.previous_meals are replaced (not merged)
- [x] 6.7 Write test for deduplication logic:
  - Test that duplicate meal names are removed
  - Test that meal names preserve original capitalization
  - Test with meals that have same name but different meal types
- [x] 6.8 Update existing tests if needed:
  - Verify all existing `PreferencesForm.test.tsx` tests still pass
  - Update any tests that may be affected by new meal fetching logic
  - Ensure test coverage remains high
- [x] 6.9 Run all tests and verify they pass:
  - Run `npm test` to execute all tests
  - Run `npm run test:coverage` to check coverage
  - Fix any failing tests
  - Ensure test coverage meets project standards

### 7.0 Code quality and final checks

- [x] 7.1 Run ESLint and fix any errors:
  - Run `npm run lint` to check for linting errors
  - Fix all ESLint errors (not just warnings)
  - Run `npm run lint -- --fix` to auto-fix where possible
- [x] 7.2 Format code with Prettier:
  - Run `npm run format` to format all code
  - Verify code follows project formatting standards
- [x] 7.3 Verify TypeScript types are correct:
  - Check that all types are properly defined
  - Ensure no `any` types are used unnecessarily
  - Verify API response types match expected structure
- [x] 7.4 Test the feature manually:
  - Start the development server
  - Navigate to household preferences page
  - Verify meals are auto-populated from previous week
  - Test manual editing of auto-populated meals
  - Test error scenarios (disconnect network, invalid household, etc.)
- [x] 7.5 Verify PreferencesDisplay still works:
  - Check that PreferencesDisplay component still renders correctly
  - Verify that saved preferences display properly
  - Run existing PreferencesDisplay tests to ensure nothing broke
- [x] 7.6 Review code for best practices:
  - Ensure React hooks are used correctly (dependencies, etc.)
  - Verify no memory leaks (cleanup in useEffect if needed)
  - Check that error handling is comprehensive
  - Ensure code follows project conventions
