# Tasks: Meal Planner Toggle for Quick Meal or Eat Out

## Relevant Files

- `lib/types.ts` - Added `mealCategory` to Meal interface
- `lib/api/meals.ts` - Added `meal_category` to MealResponse, CreateMealRequest, and UpdateMealRequest
- `components/meal-planner/AddMealModal.tsx` - Added category selection dropdown
- `app/meal-planner/page.tsx` - Updated handleAddMeal and convertMealResponse to handle meal categories
- `components/meal-planner/MealCard.tsx` - Added visual indicators for meal categories
- `components/meal-planner/MobileWeeklyCalendar.tsx` - Added visual indicators for meal categories

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
- [x] 1.0 Update Type Definitions and API Types
- [x] 2.0 Add Category Selection to AddMealModal Component
- [x] 3.0 Update Page Component to Handle Meal Categories
- [x] 4.0 Add Visual Indicators to Calendar Components
- [ ] 5.0 Update Grocery List Generation to Filter Eat Out Meals
- [ ] 6.0 Testing and Validation
