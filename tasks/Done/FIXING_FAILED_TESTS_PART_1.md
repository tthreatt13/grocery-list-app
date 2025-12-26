<!-- ee165a00-e7d4-4686-94a7-a4b9db7c38f1 f4baf766-ccaf-43b5-ba8e-8ba78f789d31 -->

# Fix All Failing Tests

## Overview

Fix 54 failing tests across 10 test suites. Issues include: mock configuration problems, query specificity (multiple elements), component rendering issues, and data format mismatches.

## Test Suite Failures Summary

1. **app/meal-planner/tests/page.mobile-delete.test.tsx** (6 tests) - Can't find "Scrambled Eggs" text
2. **app/meal-planner/tests/page.simplified-flow.test.tsx** (7 tests) - Can't find "Scrambled Eggs" text
3. **app/tests/page.test.tsx** (1 test) - Multiple "Total Items" elements
4. **components/meal-planner/tests/MobileWeeklyCalendar.test.tsx** (3 tests) - Multiple "Add breakfast" and "Today" elements
5. **components/layout/tests/MobileNav.test.tsx** (5 tests) - `pathname` is undefined
6. **components/layout/tests/Navbar.test.tsx** (1 test) - `mockUseAuth` referenced before initialization
7. **components/meal-planner/tests/AddMealModal.delete.test.tsx** (1 test) - Multiple "Add Meal" elements
8. **app/meal-planner/tests/page.test.tsx** (3 tests) - Multiple "generate grocery list" matches, can't find "generate grocery list from meals"
9. **app/grocery-lists/[id]/**tests**/page.test.tsx** (2 tests) - Can't find quantity text "2.5 lbs" and "12"
10. **Various act() warnings** - Multiple components need act() wrapping

## Implementation Plan

### 1. Fix MobileNav Tests (pathname undefined)

**File**: `components/layout/__tests__/MobileNav.test.tsx`

- Issue: `usePathname()` mock returns undefined
- Fix: Update mock to properly return a string value, not a function
- Change mock from `jest.fn(() => '/')` to ensure it returns the value correctly

### 2. Fix Navbar Test (mockUseAuth initialization)

**File**: `components/layout/__tests__/Navbar.test.tsx`

- Issue: `mockUseAuth` referenced before initialization
- Fix: Move `mockUseAuth` definition before the component import or restructure the mock

### 3. Fix Meal Planner Mobile Tests (can't find "Scrambled Eggs")

**Files**:

- `app/meal-planner/__tests__/page.mobile-delete.test.tsx`
- `app/meal-planner/__tests__/page.simplified-flow.test.tsx`
- Issue: Tests can't find meal text in mobile view
- Fix:
- Check if meals are being rendered in mobile view
- Verify test waits for async data loading
- Ensure mobile calendar component is rendering meals correctly
- May need to check `MobileWeeklyCalendar` component rendering

### 4. Fix Dashboard Page Test (multiple "Total Items")

**File**: `app/__tests__/page.test.tsx`

- Issue: Multiple elements with "Total Items" text
- Fix: Use `getAllByText` or more specific query (e.g., by role or test-id)
- Check `app/page.tsx` - there appear to be duplicate stats cards

### 5. Fix MobileWeeklyCalendar Tests (multiple elements)

**File**: `components/meal-planner/__tests__/MobileWeeklyCalendar.test.tsx`

- Issue: Multiple "Add breakfast" and "Today" elements
- Fix: Use `getAllByText` or more specific queries (e.g., by role, container, or test-id)
- Tests should handle multiple instances appropriately

### 6. Fix AddMealModal Test (multiple "Add Meal")

**File**: `components/meal-planner/__tests__/AddMealModal.delete.test.tsx`

- Issue: Multiple "Add Meal" elements (heading and button)
- Fix: Use more specific query (e.g., `getByRole('heading')` for title, `getByRole('button')` for button)

### 7. Fix Meal Planner Page Tests (generate grocery list)

**File**: `app/meal-planner/__tests__/page.test.tsx`

- Issue:
- Multiple "generate grocery list" matches (button text and description)
- Can't find "generate grocery list from meals" text
- Fix:
- Use more specific queries for button (e.g., `getByRole('button', { name: /generate grocery list/i })`)
- Check modal title text in `GenerateGroceryListFromMealsModal` component
- Verify modal is actually opening

### 8. Fix Grocery List Detail Page Tests (quantity display)

**File**: `app/grocery-lists/[id]/**tests**/page.test.tsx`

- Issue: Can't find quantity text "2.5 lbs" and "12"
- Fix:
- Check how quantity is parsed from API response (quantity is string "2.5 lbs")
- Verify `parseQuantityString` function in `app/grocery-lists/[id]/page.tsx` correctly parses
- Check `formatQuantity` function in `lib/utils.ts`
- Verify `GroceryListItem` component displays quantity correctly
- May need to check if quantity/unit are being split correctly when displaying

### 9. Fix act() Warnings

**Files**: Multiple component test files

- Issue: State updates not wrapped in act()
- Fix: Wrap state updates in `act()` or use `waitFor` appropriately
- Components affected:
- `AddPantryItemForm`
- `ReuseListModal`
- `EditPantryItemForm`
- `AddItemForm`
- `InviteMemberForm`
- `Home` (dashboard page)

## Implementation Order

1. Fix mock issues first (MobileNav, Navbar) - these are blocking
2. Fix query specificity issues (Dashboard, MobileWeeklyCalendar, AddMealModal, Meal Planner page)
3. Fix component rendering issues (Meal Planner mobile tests)
4. Fix data format issues (Grocery List detail page)
5. Address act() warnings last (non-blocking)

## Testing Strategy

After each fix:

- Run specific test file to verify fix
- Run full test suite to ensure no regressions
- Check for linting errors
- Format code with Prettier

### To-dos

- [x] Fix MobileNav test mock - ensure usePathname() returns a value instead of undefined. Update mock configuration in components/layout/**tests**/MobileNav.test.tsx
- [x] Fix Navbar test mock - move mockUseAuth definition before component import to fix initialization order in components/layout/**tests**/Navbar.test.tsx
- [x] Fix Dashboard page test - use getAllByText or more specific query for 'Total Items' in app/**tests**/page.test.tsx
- [x] Fix MobileWeeklyCalendar tests - use getAllByText or more specific queries for 'Add breakfast' and 'Today' in components/meal-planner/**tests**/MobileWeeklyCalendar.test.tsx
- [x] Fix AddMealModal test - use more specific query (getByRole) to distinguish between heading and button 'Add Meal' in components/meal-planner/**tests**/AddMealModal.delete.test.tsx
- [x] Fix Meal Planner page tests - use more specific queries for 'generate grocery list' button and verify modal title text in app/meal-planner/**tests**/page.test.tsx
- [x] Fix Meal Planner mobile delete tests - investigate why 'Scrambled Eggs' text isn't found. Check MobileWeeklyCalendar rendering and async data loading in app/meal-planner/**tests**/page.mobile-delete.test.tsx and page.simplified-flow.test.tsx
- [x] Fix Grocery List detail page tests - investigate quantity parsing and display. Check parseQuantityString, formatQuantity, and GroceryListItem component to ensure '2.5 lbs' and '12' are displayed correctly in app/grocery-lists/[id]/**tests**/page.test.tsx. See tasks/GROCERY_LIST_QUANTITY_TEST_FIX.md for details.
- [ ] Fix act() warnings - wrap state updates in act() or use waitFor appropriately in affected component tests (AddPantryItemForm, ReuseListModal, EditPantryItemForm, AddItemForm, InviteMemberForm, Home)
- [ ] Run full test suite to verify all tests pass, check for linting errors, and format code with Prettier
