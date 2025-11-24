# Pantry Generate Grocery List Feature

## Overview

This feature provides an in-app modal for generating grocery lists from low-stock pantry items. Users can either **create a new grocery list** or **add items to an existing list**.

## Implementation Summary

### Files Created/Modified

#### 1. **Components Created**

- `components/pantry/GenerateGroceryListModal.tsx` - Main modal component for generating grocery lists
- `components/pantry/__tests__/GenerateGroceryListModal.test.tsx` - Comprehensive test suite (20+ test cases)

#### 2. **Components Modified**

- `app/pantry/page.tsx` - Integrated the new modal and functionality

#### 3. **Tests Created**

- `app/pantry/__tests__/page.test.tsx` - Integration tests for the pantry page functionality

## Features Implemented

### ✅ In-App Modal (No Browser Alert)

- Beautiful, modern modal UI with proper styling
- Replaces the system alert() with a professional modal component
- Proper loading states and animations

### ✅ Generate Grocery List from Low Stock Items

- Automatically identifies items where `quantity <= lowStockThreshold`
- Displays all low-stock items in an organized list
- Shows current quantity vs threshold for each item

### ✅ Item Selection

- All low-stock items are pre-selected by default
- Users can check/uncheck items individually
- Shows count of selected items in real-time
- Displays current stock, threshold, and category for each item

### ✅ **NEW: Add to Existing List or Create New List**

- **Mode Selection**: Users can choose between:
  - **Create New List**: Start a fresh grocery list with a custom name
  - **Add to Existing List**: Add low-stock items to an existing grocery list
- Automatically fetches all available grocery lists from the household
- Smart UI: Only shows mode selection when existing lists are available
- Dropdown selector with all available grocery lists
- Different button text based on mode ("Create Grocery List" vs "Add to List")

### ✅ Customizable List Name (Create Mode)

- Default name: "Weekly Shopping List"
- Users can edit the name before creating
- Validation ensures list name is not empty

### ✅ Push to Grocery List

- **Create Mode**: Creates a new grocery list in the household
- **Add Mode**: Adds items to the selected existing list
- Adds selected items as grocery list items
- Includes helpful notes (e.g., "Restock - Low stock threshold: 1")
- Preserves quantity and category information
- Auto-refreshes the list of available grocery lists after creation

### ✅ User Feedback

- Success message banner after list creation
- Shows number of items added
- Auto-dismisses after 5 seconds
- Error handling with clear error messages

### ✅ Smart UI States

- Button disabled when no low-stock items
- Loading state while creating list
- Create button disabled when no items selected or list name empty
- Modal cannot be closed while creating (prevents accidental dismissal)

## Test Coverage

### Unit Tests (GenerateGroceryListModal.test.tsx)

- ✅ Modal open/close behavior
- ✅ Rendering of low stock items
- ✅ Item selection/deselection
- ✅ List name input and validation
- ✅ Create button enable/disable logic
- ✅ Success callback with correct data
- ✅ Loading states
- ✅ Empty state handling
- ✅ Selected items count display
- ✅ **NEW: Mode selection (Create New vs Add to Existing)**
- ✅ **NEW: Display of existing lists in dropdown**
- ✅ **NEW: Conditional rendering based on mode**
- ✅ **NEW: Add to existing list functionality**
- ✅ **NEW: Button text changes based on mode**
- ✅ **NEW: Validation for list selection in Add mode**
- ✅ **NEW: Item selection persistence across mode changes**
- ✅ **NEW: Hide mode selection when no existing lists**

### Integration Tests (page.test.tsx)

- ✅ Button visibility
- ✅ Low stock count calculation
- ✅ Modal opening
- ✅ Item display in modal
- ✅ Grocery list creation flow
- ✅ Success message display
- ✅ Modal closure after success
- ✅ Error handling

## How It Works

### User Flow

1. User navigates to the Pantry page (`/pantry`)
2. The "Low Stock" stat card shows the count of items needing restocking
3. User clicks "Generate Grocery List" button (only enabled if there are low-stock items)
4. Modal opens showing all low-stock items:
   - Items are pre-selected
   - Shows current quantity, threshold, and category
   - User can deselect items they don't want to add
5. **NEW: User chooses between two options (if existing lists are available):**
   - **Option A: Create New List**
     - Enter a custom list name (default: "Weekly Shopping List")
     - Click "Create Grocery List" button
     - System creates a new grocery list with selected items
   - **Option B: Add to Existing List**
     - Select a list from the dropdown
     - Click "Add to List" button
     - System adds selected items to the chosen list
6. Success message appears:
   - Create mode: "Grocery list [name] created successfully with X items!"
   - Add mode: "Added X items to [list name] successfully!"
7. Modal closes automatically
8. User can navigate to `/grocery-lists` to view and manage the list

### Technical Implementation

#### Low Stock Detection

```typescript
const lowStockItemsList = items.filter(
  (item) =>
    item.lowStockThreshold !== undefined &&
    item.quantity <= item.lowStockThreshold
)
```

#### Fetching Existing Lists

```typescript
// Fetch all available grocery lists for the household
const groceryListsData = await getGroceryLists(token)
setGroceryLists(groceryListsData)
```

#### Grocery List Creation (Create Mode)

```typescript
// 1. Create the list
const newList = await createGroceryList(
  {
    name: data.listName,
    household_id: selectedHouseholdId,
  },
  token
)

// 2. Add each selected item
for (const item of data.items) {
  await addGroceryItem(
    newList.id,
    {
      name: item.name,
      quantity: `${item.quantity} ${item.unit}`,
      category: item.category,
      notes: `Restock - Low stock threshold: ${item.lowStockThreshold}`,
      checked: false,
    },
    token
  )
}

// 3. Refresh the list of grocery lists
const updatedLists = await getGroceryLists(token)
setGroceryLists(updatedLists)
```

#### Adding to Existing List (Add Mode)

```typescript
// Add each selected item to the existing list
for (const item of data.items) {
  await addGroceryItem(
    data.listId,
    {
      name: item.name,
      quantity: `${item.quantity} ${item.unit}`,
      category: item.category,
      notes: `Restock - Low stock threshold: ${item.lowStockThreshold}`,
      checked: false,
    },
    token
  )
}
```

#### Modal Mode Management

```typescript
// State for managing mode
const [mode, setMode] = useState<'create' | 'add'>('create')
const [selectedListId, setSelectedListId] = useState<number | null>(null)

// Validation logic
const canSubmit =
  selectedCount > 0 &&
  !isCreating &&
  (mode === 'create' ? listName.trim().length > 0 : selectedListId !== null)

// Submit handler
const handleSubmit = async () => {
  const items = lowStockItems.filter((item) => selectedItems.has(item.id))

  if (mode === 'create') {
    await onCreateList({ listName, items })
  } else if (mode === 'add' && onAddToList && selectedListId !== null) {
    await onAddToList({ listId: selectedListId, items })
  }
}
```

## Testing Instructions

### Manual Testing Steps

1. **Setup Test Data**
   - Navigate to `/pantry`
   - Add some pantry items with low stock thresholds
   - Set quantities below the thresholds (e.g., Milk: 0.5 gallon, threshold: 1)
   - Create at least one grocery list (navigate to `/grocery-lists` and create a list)

2. **Test Generate Button**
   - Verify "Generate Grocery List" button is visible
   - Button should be disabled if no low-stock items
   - Button should be enabled when low-stock items exist

3. **Test Modal Functionality**
   - Click "Generate Grocery List"
   - Verify modal opens with all low-stock items
   - Check that all items are pre-selected
   - Try unchecking and rechecking items
   - Verify item count updates correctly

4. **Test Mode Selection (NEW)**
   - Verify two radio buttons appear: "Create New List" and "Add to Existing List"
   - "Create New List" should be selected by default
   - Click "Add to Existing List" radio button
   - Verify UI changes to show dropdown instead of text input
   - Click back to "Create New List"
   - Verify UI changes back to text input

5. **Test Create New List Mode**
   - Select "Create New List" mode
   - Default list name should be "Weekly Shopping List"
   - Edit the name
   - Try clearing it (create button should disable)
   - Enter a valid name
   - Click "Create Grocery List"
   - Verify loading state shows
   - Wait for success message: "Grocery list [name] created successfully with X items!"
   - Verify modal closes
   - Navigate to `/grocery-lists`
   - Confirm new list exists with selected items

6. **Test Add to Existing List Mode (NEW)**
   - Open the modal again
   - Select "Add to Existing List" mode
   - Verify dropdown shows all available grocery lists
   - Don't select a list yet - button should be disabled
   - Select a list from the dropdown
   - Button should now be enabled and say "Add to List"
   - Click "Add to List"
   - Verify loading state shows
   - Wait for success message: "Added X items to [list name] successfully!"
   - Verify modal closes
   - Navigate to `/grocery-lists`
   - Open the selected list
   - Confirm the items were added

7. **Test with No Existing Lists**
   - Delete all grocery lists
   - Open the modal
   - Verify only "Create New List" UI is shown (no mode selection)

8. **Test Item Selection Persistence (NEW)**
   - Open the modal
   - Uncheck some items
   - Switch between "Create New" and "Add to Existing" modes
   - Verify item selections remain the same

9. **Test Error Handling**
   - Test with network disconnected
   - Verify error message displays

### Automated Testing

```bash
# Run all tests
npm test

# Run specific test files
npm test GenerateGroceryListModal.test.tsx
npm test app/pantry/__tests__/page.test.tsx
```

## UI/UX Improvements

### Before (Original Implementation)

- Browser alert dialog (system native)
- No customization
- No item selection
- Items couldn't be pushed to actual grocery lists

### After V1 (Initial Modal)

- Beautiful in-app modal
- Modern, responsive design
- Item selection with checkboxes
- Category badges for visual organization
- Real-time feedback
- Proper error handling
- Success notifications
- Fully functional grocery list creation
- **Limitation**: Could only create new lists

### After V2 (Current - With Add to Existing)

- All features from V1, plus:
- **Choice between creating new or adding to existing lists**
- **Smart mode selection** - only shows when lists exist
- **Dropdown selector** with all available grocery lists
- **Context-aware UI** - shows appropriate controls based on mode
- **Dynamic button text** - changes based on selected mode
- **Better workflow** - avoid creating duplicate lists
- **List refresh** - automatically updates available lists after creation
- **Mode-specific validation** - ensures required fields for each mode

## Mobile Responsiveness

- Modal is responsive on all screen sizes
- Scrollable item list for many low-stock items
- Touch-friendly checkboxes and buttons
- Proper spacing on mobile devices

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Touch targets meet minimum size requirements

## Future Enhancements (Optional)

- [ ] Bulk quantity adjustment before adding to list
- [ ] Auto-suggested quantities based on usage patterns
- [ ] Quick add to existing list instead of creating new
- [ ] Email/share the generated list
- [ ] Recurring list generation (weekly automation)

## Related Files

- `lib/api/grocery.ts` - API functions for grocery lists
- `lib/types.ts` - TypeScript type definitions
- `components/ui/Modal.tsx` - Base modal component
- `components/ui/Checkbox.tsx` - Checkbox component
- `components/ui/Button.tsx` - Button component
- `components/ui/Badge.tsx` - Badge component

## Backend Requirements

- The backend API must support:
  - `POST /api/grocery-lists` - Create grocery list
  - `POST /api/grocery-lists/:id/items` - Add items to list
  - Both endpoints appear to be implemented in `backend/routes/grocery_lists.py`

## Notes

- All code follows TDD (Test-Driven Development) principles
- Tests were written before implementation
- Comprehensive test coverage for both unit and integration scenarios
- No linter errors
- No TypeScript errors
- Follows existing code patterns and conventions in the project

## V2 Update Summary (Add to Existing List Feature)

### What Was Added

This update enhances the pantry grocery list generation feature to support **adding items to existing grocery lists** in addition to creating new ones.

### Files Modified

1. **`components/pantry/GenerateGroceryListModal.tsx`**
   - Added `mode` state to track "create" vs "add" mode
   - Added `selectedListId` state for tracking selected list
   - Added `onAddToList` callback prop (optional)
   - Added `existingLists` prop to receive available lists
   - Implemented radio button mode selection UI
   - Implemented dropdown selector for existing lists
   - Updated submit handler to route to correct callback based on mode
   - Updated validation logic for each mode
   - Updated button text to reflect current mode
   - Updated info message based on mode

2. **`components/pantry/__tests__/GenerateGroceryListModal.test.tsx`**
   - Added 11 new test cases for the "Add to Existing" functionality
   - Tests cover mode selection, list selection, validation, and data flow
   - Tests verify UI changes based on mode
   - Tests verify behavior when no existing lists available

3. **`app/pantry/page.tsx`**
   - Added import for `getGroceryLists` and `GroceryListResponse`
   - Added `groceryLists` state to store available lists
   - Updated `useEffect` to fetch grocery lists on load
   - Implemented `handleAddToGroceryList` function
   - Updated `handleGenerateGroceryList` to refresh lists after creation
   - Passed new props to `GenerateGroceryListModal` component

### Key Features

- ✅ Mode selection between "Create New" and "Add to Existing"
- ✅ Fetches and displays all available grocery lists
- ✅ Smart UI - hides mode selection when no lists exist
- ✅ Maintains item selections when switching modes
- ✅ Different success messages for each mode
- ✅ Auto-refreshes list dropdown after creating new list
- ✅ Proper validation for each mode
- ✅ Backward compatible - works without existing lists

### Testing Approach

- **TDD (Test-Driven Development)**: Tests were written first, then implementation
- **11 new unit tests** covering all aspects of the new functionality
- **Zero TypeScript errors** in modified files
- **Zero linter errors** in modified files
- All existing tests continue to pass (backward compatible)

### User Benefits

1. **Avoid duplicate lists**: Users can add to existing shopping lists
2. **Better organization**: Consolidate items into appropriate lists
3. **Flexibility**: Choose the best option for their workflow
4. **Clear feedback**: Different success messages for each action
5. **Intuitive UI**: Mode selection only appears when relevant
