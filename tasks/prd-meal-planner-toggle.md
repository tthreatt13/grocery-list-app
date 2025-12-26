# PRD: Meal Planner Toggle for Quick Meal or Eat Out

## Introduction/Overview

This feature adds the ability to categorize meals in the meal planner as "Normal", "Quick Meal", or "Eat Out" to help users better organize their weekly meal planning. The feature addresses the need to distinguish between meals that require full cooking preparation, quick/easy meals, and meals eaten at restaurants or takeout, which helps with more accurate grocery list generation and meal planning visualization.

**Problem Statement:** Users currently cannot differentiate between different types of meals in their meal planner, making it difficult to plan grocery shopping (since "eat out" meals don't require ingredients) and to quickly identify meal preparation complexity.

**Goal:** Enable users to categorize meals and automatically exclude "eat out" meals from grocery list generation while providing visual indicators in the calendar view.

## Goals

1. Allow users to select meal category (Normal, Quick Meal, or Eat Out) when creating or editing meals
2. Automatically exclude "eat out" meals from grocery list generation
3. Display visual indicators (badges/icons) in the calendar view to distinguish meal categories
4. Maintain backward compatibility with existing meals (default to "Normal" category)
5. Ensure the feature works seamlessly on both desktop and mobile views

## User Stories

1. **As a meal planner user**, I want to mark meals as "Quick Meal" or "Eat Out" so that I can quickly see which meals require minimal preparation or no grocery shopping.

2. **As a meal planner user**, I want "Eat Out" meals to be automatically excluded from grocery list generation so that I don't accidentally include ingredients for meals I'm not cooking.

3. **As a meal planner user**, I want to see visual indicators (like icons) on meals in my calendar so that I can quickly identify meal categories at a glance.

4. **As a meal planner user**, I want to change the meal category when editing an existing meal so that I can update my meal plan as my schedule changes.

5. **As a meal planner user**, I want the meal category selector to be easy to use (dropdown) so that I can quickly categorize meals without cluttering the form.

## Functional Requirements

### FR1: Meal Category Selection in Add/Edit Modal

1.1. The AddMealModal component must include a dropdown/select menu for meal category selection
1.2. The dropdown must have three options: "Normal", "Quick Meal", and "Eat Out"
1.3. The default selection must be "Normal" when creating a new meal
1.4. When editing an existing meal, the dropdown must display the current meal's category
1.5. The meal category must be saved when creating or updating a meal

### FR2: Backend Integration

2.1. The frontend must send `meal_category` field in create and update meal API requests
2.2. The frontend must receive and handle `meal_category` field in meal API responses
3.3. The Meal type in `lib/types.ts` must include an optional `mealCategory` field
2.4. The API response types in `lib/api/meals.ts` must include `meal_category` field

### FR3: Visual Indicators in Calendar

3.1. Meal cards in WeeklyCalendar must display a badge/icon indicating the meal category
3.2. "Quick Meal" meals must display a lightning bolt icon (⚡) or similar quick/prep indicator
3.3. "Eat Out" meals must display a restaurant/fork-knife icon (🍴) or similar dining indicator
3.4. "Normal" meals may display no icon or a subtle indicator (optional)
3.5. Visual indicators must be visible in both desktop (WeeklyCalendar) and mobile (MobileWeeklyCalendar) views
3.6. MealCard component must accept and display meal category information

### FR4: Grocery List Generation

4.1. When generating a grocery list from meals, "Eat Out" meals must be automatically excluded
4.2. "Normal" and "Quick Meal" meals must be included in grocery list generation
4.3. The backend grocery list generation endpoint must filter out meals with `meal_category = "eat_out"`
4.4. The frontend grocery list generation modal must reflect the exclusion of "Eat Out" meals

### FR5: Data Migration and Backward Compatibility

5.1. Existing meals without a category must default to "Normal" when displayed
5.2. The `convertMealResponse` function must handle missing `meal_category` fields gracefully
5.3. The backend must return "normal" as the default value for meals without a category

## Non-Goals (Out of Scope)

1. **Filtering/Sorting by Category:** Users cannot filter or sort the calendar view by meal category (this may be a future enhancement)
2. **Category Statistics:** No statistics dashboard showing counts of each meal category type
3. **Custom Categories:** Users cannot create custom meal categories beyond the three predefined options
4. **Category-Based Meal Suggestions:** No automatic meal suggestions based on category
5. **Bulk Category Updates:** Users cannot change categories for multiple meals at once
6. **Category History:** No tracking of category changes over time
7. **Category-Based Notifications:** No reminders or notifications based on meal category

## Design Considerations

### UI Components

**AddMealModal Updates:**

- Add a new form field below "Meal Name" and above "Ingredients"
- Use a Select/Dropdown component (from `@/components/ui/Select`) for category selection
- Label: "Meal Category" or "Category"
- Placeholder: "Select category" (though default will be "Normal")
- Options:
  - Normal (default)
  - Quick Meal
  - Eat Out

**Calendar Visual Indicators:**

- Use small badge icons positioned on meal cards (top-right corner or next to meal name)
- Icons should be subtle but visible (consider using existing Badge component)
- Suggested icons:
  - Quick Meal: Lightning bolt icon (⚡) or clock icon
  - Eat Out: Restaurant/fork-knife icon (🍴) or external link icon
  - Normal: No icon (or optional checkmark/home icon)

**Styling:**

- Icons should use appropriate colors:
  - Quick Meal: Orange/amber to indicate speed
  - Eat Out: Blue/purple to distinguish from cooking meals
- Icons should be small (16-20px) to not overwhelm the meal card
- Consider tooltips on hover to show category name

### Mobile Considerations

- Ensure dropdown is touch-friendly on mobile devices
- Icons should remain visible and appropriately sized on mobile calendar view
- Modal layout should accommodate the new field without feeling cramped

## Technical Considerations

### Frontend Changes

**Files to Modify:**

1. `lib/types.ts` - Add `mealCategory?: 'normal' | 'quick_meal' | 'eat_out'` to Meal interface
2. `lib/api/meals.ts` - Add `meal_category` to MealResponse, CreateMealRequest, and UpdateMealRequest interfaces
3. `components/meal-planner/AddMealModal.tsx` - Add category dropdown field
4. `app/meal-planner/page.tsx` - Update `handleAddMeal` to include meal_category, update `convertMealResponse` to map meal_category
5. `components/meal-planner/MealCard.tsx` - Add visual indicators for meal categories
6. `components/meal-planner/WeeklyCalendar.tsx` - Pass meal category to MealCard
7. `components/meal-planner/MobileWeeklyCalendar.tsx` - Ensure meal category is displayed

**New Dependencies:**

- May need to add icon library (if not already present) for lightning bolt and restaurant icons
- Consider using react-icons or similar if project doesn't have icon system

### Backend Changes

**Files Already Modified (from git diff):**

1. `backend/models/meal.py` - Already has `meal_category` field
2. `backend/schemas/meal.py` - Already has `meal_category` validation
3. `backend/routes/meals.py` - Already handles `meal_category` in create

**Additional Backend Work:**

1. Update grocery list generation endpoint (`/api/meals/generate-grocery-list`) to filter out meals with `meal_category = "eat_out"`
2. Ensure update meal endpoint properly handles `meal_category` changes
3. Verify database migration exists for `meal_category` field (or create one if needed)

### Data Flow

```
User selects category in AddMealModal
  ↓
handleAddMeal in page.tsx includes meal_category in API request
  ↓
Backend saves meal_category to database
  ↓
API response includes meal_category
  ↓
convertMealResponse maps meal_category to Meal.mealCategory
  ↓
MealCard receives mealCategory prop
  ↓
MealCard displays appropriate icon/badge
  ↓
Grocery list generation filters out "eat_out" meals
```

### Testing Considerations

1. Test creating meals with each category option
2. Test editing meals to change category
3. Test that "Eat Out" meals are excluded from grocery list generation
4. Test visual indicators appear correctly in both desktop and mobile views
5. Test backward compatibility with existing meals (no category = "Normal")
6. Test that default value is "Normal" when creating new meals

## Success Metrics

1. **Adoption Rate:** Percentage of new meals created with a category other than "Normal"
2. **Grocery List Accuracy:** Reduction in incorrect ingredients added to grocery lists (meals marked as "Eat Out" should not generate ingredients)
3. **User Engagement:** Users successfully categorize at least 50% of their meals within the first week of feature release
4. **Visual Clarity:** User feedback indicates the icons/badges help them quickly identify meal types
5. **Error Rate:** Zero errors related to missing meal_category fields in existing meals

## Open Questions

1. Should "Quick Meal" meals also be excluded from grocery list generation, or only "Eat Out"?
   - **Answer:** Only "Eat Out" meals are excluded (per user selection)

2. Should there be any restrictions on which meal types (breakfast, lunch, dinner, snack) can have which categories?
   - **Assumption:** No restrictions - any meal type can be any category

3. Should the category be searchable or filterable in future iterations?
   - **Answer:** Out of scope for this feature, but noted for future consideration

4. Do we need analytics tracking for category usage?
   - **Assumption:** Basic metrics are sufficient (see Success Metrics)

5. Should category changes be logged for audit purposes?
   - **Assumption:** Not required for MVP, but database timestamps will track updates
