# Meal Planner - Generate Grocery List Modal Feature

## Summary

Replaced the browser alert dialog in the meal planner with a custom modal component similar to the Pantry feature. This modal allows users to generate grocery lists from meal plan ingredients and either create a new grocery list or add ingredients to an existing list.

## Implementation Details

### Test-Driven Development (TDD) Approach

Following TDD principles:
1. **Red Phase**: Created comprehensive test file first with all expected behaviors
2. **Green Phase**: Implemented component to pass all tests
3. **Refactor Phase**: Integrated into meal planner page

### Files Created/Modified

#### 1. Test File (TDD - Step 1)
**`components/meal-planner/__tests__/GenerateGroceryListFromMealsModal.test.tsx`**

Comprehensive test suite covering:
- Modal rendering and visibility
- Display of ingredients
- Ingredient selection/deselection
- List name input
- Create new list functionality
- Add to existing list functionality
- Mode switching (create vs add)
- Validation (disabled states)
- Loading states
- Empty states

Test coverage includes:
- 13 basic functionality tests
- 10 tests for existing list integration
- Edge cases and user interactions

#### 2. Modal Component (TDD - Step 2)
**`components/meal-planner/GenerateGroceryListFromMealsModal.tsx`**

Features:
- **Two Modes**:
  - Create new grocery list with custom name
  - Add to existing grocery list (with dropdown selection)
  
- **Ingredient Management**:
  - Display all ingredients from weekly meal plan
  - Select/deselect individual ingredients
  - Show count of selected ingredients
  - Empty state when no ingredients

- **UI/UX**:
  - Radio button mode selector (only shown when existing lists available)
  - List name input (create mode)
  - List dropdown selector (add mode)
  - Checkbox list for ingredients
  - Loading state during creation
  - Info messages with context
  - Disabled states for validation

- **Props Interface**:
  ```typescript
  interface GenerateGroceryListFromMealsModalProps {
    open: boolean
    onClose: () => void
    ingredients: string[]
    onCreateList: (data: { listName: string; ingredients: string[] }) => void | Promise<void>
    onAddToList?: (data: { listId: number; ingredients: string[] }) => void | Promise<void>
    existingLists?: GroceryListResponse[]
    isCreating?: boolean
  }
  ```

#### 3. Meal Planner Page Integration
**`app/meal-planner/page.tsx`**

Changes:
- Imported new modal component
- Imported grocery API functions
- Added state management for:
  - Modal open/close state
  - Grocery lists
  - Creating/loading state

- Added useEffect to fetch grocery lists when household changes

- Replaced browser `alert()` with modal trigger:
  ```typescript
  // Before:
  const handleGenerateGroceryList = () => {
    alert(`Grocery List Generated!...`)
  }

  // After:
  const handleGenerateGroceryList = () => {
    setIsGenerateModalOpen(true)
  }
  ```

- Added helper function to extract ingredients:
  ```typescript
  const getCurrentWeekIngredients = () => {
    // Filters meals for current week
    // Extracts and deduplicates ingredients
    return allIngredients
  }
  ```

- Added handlers for creating/adding to lists:
  - `handleCreateGroceryList`: Creates new list and adds ingredients as items
  - `handleAddToGroceryList`: Adds ingredients to existing list
  - Both handlers:
    - Get auth token
    - Call grocery API
    - Show success message
    - Close modal
    - Handle errors

## API Integration

Uses existing grocery API functions from `lib/api/grocery.ts`:
- `getGroceryLists()`: Fetch available lists
- `createGroceryList()`: Create new list
- `addGroceryItem()`: Add individual ingredient as item

## User Flow

1. User plans meals for the week with ingredients
2. User clicks "Generate Grocery List" button
3. Modal opens showing all unique ingredients from week's meals
4. User chooses mode:
   - **Create New**: Enter list name, select ingredients, click "Create Grocery List"
   - **Add to Existing**: Select list from dropdown, select ingredients, click "Add to List"
5. Backend creates list/adds items
6. Success message shown
7. Modal closes

## Key Differences from Pantry Modal

While similar in structure, this modal differs from the Pantry version:

1. **Data Source**:
   - Pantry: Low stock items from pantry inventory
   - Meal Planner: Ingredients from meal plans

2. **Default List Name**:
   - Pantry: "Weekly Shopping List"
   - Meal Planner: "Weekly Meal Plan"

3. **Item Display**:
   - Pantry: Shows quantities, units, categories, thresholds
   - Meal Planner: Simple ingredient list (just names)

4. **Empty State Message**:
   - Pantry: "No low stock items found"
   - Meal Planner: "No ingredients found - add ingredients to meals"

## Testing Strategy

### Unit Tests (Jest/React Testing Library)
- Component rendering
- User interactions
- State management
- API integration mocking
- Edge cases

### Manual Testing (Browser)
Prerequisites:
1. Sign in to app
2. Join/create household
3. Add meals with ingredients to meal planner

Test Cases:
1. Click "Generate Grocery List" button
2. Verify modal opens with ingredients
3. Test create new list flow
4. Test add to existing list flow
5. Test ingredient selection/deselection
6. Test validation (empty name, no selection)
7. Test loading states
8. Test error handling

## Future Enhancements

Potential improvements:
1. Allow editing quantities before adding
2. Categorize ingredients automatically
3. Merge duplicate ingredients from multiple meals
4. Show which meals each ingredient is from
5. Add ingredient substitutions
6. Recipe scaling for number of servings
7. Direct link to view created grocery list

## Dependencies

- Existing UI components: Modal, Button, Input, Checkbox, Select
- Grocery API functions
- Auth (Clerk)
- React hooks: useState, useEffect

## No Breaking Changes

This implementation:
- Adds new component without modifying existing ones
- Only changes meal planner page
- Maintains backward compatibility
- Uses existing API structure
- Follows existing UI patterns

## Code Quality

- TypeScript for type safety
- Comprehensive test coverage
- Follows React best practices
- Consistent with codebase patterns
- Proper error handling
- Loading states
- Accessible (ARIA labels)

