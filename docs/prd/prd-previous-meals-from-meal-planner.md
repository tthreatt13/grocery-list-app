# PRD: Auto-Populate Previous Meals from Meal Planner

## Introduction/Overview

Currently, users must manually enter meals they've made this week in the Household Preferences form. This is time-consuming and error-prone, especially when users have already planned and tracked meals in the Meal Planner feature.

This feature will automatically pull meal names from the previous completed week (last Monday through last Sunday) in the Meal Planner and populate them in the "Previous Meals Made This Week" field in the Preferences form. Users can then review, edit, add, or remove meals as needed before saving their preferences.

**Goal:** Reduce manual data entry and improve data consistency by automatically syncing meals from the Meal Planner into Household Preferences.

## Goals

1. **Eliminate redundant data entry** - Users should not have to manually re-enter meal names they've already entered in the Meal Planner
2. **Improve data accuracy** - Ensure meal names match exactly between Meal Planner and Preferences
3. **Enhance user experience** - Reduce time spent on preferences management by at least 50%
4. **Maintain user control** - Users can still manually add, remove, or edit meals as needed

## User Stories

1. **As a user who plans meals weekly**, I want my meals from last week to automatically appear in my preferences, so I don't have to manually type them again.

2. **As a user**, I want to be able to add meals that weren't in my meal planner (e.g., meals I made but didn't plan), so my preferences remain accurate.

3. **As a user**, I want to remove meals from the auto-populated list if I didn't actually make them, so my preferences reflect reality.

4. **As a user**, I want the meal list to update when I load the preferences page, so I always see the most recent data from my meal planner.

5. **As a user**, I want to see which meals came from the meal planner vs. which I added manually, so I understand what's being synced.

## Functional Requirements

1. **Meal Retrieval**
   - When the Preferences page loads, the system must fetch meals from the previous completed week (last Monday through last Sunday) for the selected household
   - The system must use the existing `getWeeklyMeals` API endpoint with the appropriate date range
   - Only meal names (not ingredients or notes) should be extracted from the meal planner data

2. **Auto-Population**
   - When the PreferencesForm component loads in edit mode, it must automatically populate the "Previous Meals Made This Week" field with meal names from the previous week
   - Meal names should be displayed as a comma-separated list (matching current format)
   - If no meals exist for the previous week, the field should remain empty (no error)

3. **Manual Editing**
   - Users must be able to manually add meals to the list (meals not in the meal planner)
   - Users must be able to remove meals from the list
   - Users must be able to edit meal names in the list
   - The input field must continue to accept comma-separated meal names as it currently does

4. **Data Synchronization**
   - The meal list must be refreshed when the preferences page loads (not on every keystroke)
   - The meal list must be a snapshot at page load time (not real-time synced)
   - If a user saves preferences and then re-opens the form, the saved preferences (not meal planner data) should be shown

5. **Display**
   - The PreferencesDisplay component must continue to show meals as badges (no changes needed)
   - The PreferencesForm component must continue to use the text input field for editing

6. **Error Handling**
   - If the meal planner API call fails, the form should still function (allow manual entry only)
   - If no household is selected, the meal list should remain empty
   - If the previous week has no meals, the field should be empty (not an error state)

## Non-Goals (Out of Scope)

1. **Real-time synchronization** - Meals will not update automatically when the meal planner changes while the preferences page is open
2. **Meal deduplication logic** - If the same meal appears multiple times in the week, all instances will be included (users can manually remove duplicates)
3. **Meal type filtering** - All meal types (breakfast, lunch, dinner, snack) will be included
4. **Historical meal suggestions** - Only the previous completed week will be used, not multiple weeks or frequently used meals
5. **Backend changes** - No changes to the backend API or database schema are required
6. **Meal planner integration** - This feature does not modify the meal planner itself, only reads from it

## Design Considerations

### UI/UX Requirements

1. **PreferencesForm Component** (`components/household/PreferencesForm.tsx`)
   - The "Previous Meals Made This Week" input field should remain as a text input
   - When the form loads in edit mode, the field should be auto-populated with meal names from the previous week
   - Users can still manually edit the comma-separated list
   - Add a small helper text or icon indicating that meals are auto-populated from the meal planner

2. **Loading States**
   - While fetching meals from the meal planner, show a subtle loading indicator (e.g., spinner in the input field or disabled state)
   - If meals are successfully loaded, populate the field immediately
   - If loading fails, silently continue (allow manual entry)

3. **Visual Indicators** (Optional Enhancement)
   - Consider adding a small badge or icon next to the input field label indicating "Auto-populated from meal planner"
   - This helps users understand where the data came from

4. **PreferencesDisplay Component** (`components/household/PreferencesDisplay.tsx`)
   - No changes required - continues to display meals as badges
   - The display format remains unchanged

### Component Integration

- The PreferencesForm receives `preferences` and `onSubmit` props from the parent page (`app/household/page.tsx`)
- The parent page must fetch meals from the meal planner API when loading preferences
- The meal data should be passed to PreferencesForm or fetched within the form component

## Technical Considerations

### Frontend Changes

1. **API Integration**
   - Use existing `getWeeklyMeals` function from `lib/api/meals.ts`
   - Use existing `getWeekStartDate` helper function to calculate the previous week's Monday
   - Calculate previous week: current week's Monday minus 7 days

2. **Component Updates**
   - **PreferencesForm.tsx**: Add useEffect to fetch meals when component mounts in edit mode
   - **PreferencesForm.tsx**: Merge meal planner meals with existing preferences.previous_meals (if any)
   - **app/household/page.tsx**: Optionally fetch meals at page level and pass to form, or let form handle it

3. **State Management**
   - Use React useState to manage the fetched meals
   - Merge fetched meals with any existing preferences.previous_meals
   - Handle loading and error states gracefully

4. **Date Calculations**
   - Previous week = current week's Monday minus 7 days
   - Use the same week calculation logic as the meal planner (Monday-based weeks)
   - Format dates as YYYY-MM-DD for API calls

### Backend Considerations

- **No backend changes required** - The existing `/api/meals/week` endpoint already supports fetching meals by week
- The endpoint accepts a date and household_id, and returns all meals for that week
- No new database queries or schema changes needed

### Dependencies

- Existing meal planner API (`lib/api/meals.ts`)
- Existing household preferences API (`lib/api/household.ts`)
- React hooks (useState, useEffect)
- Authentication token (from useAuth hook)

### Potential Challenges

1. **Week Calculation Edge Cases**
   - Ensure consistent week calculation (Monday-based) between meal planner and preferences
   - Handle timezone differences if any

2. **Data Merging**
   - If preferences already have previous_meals saved, decide whether to:
     - Replace with meal planner data (overwrite)
     - Merge meal planner data with existing preferences (append)
     - Use meal planner data only if preferences.previous_meals is empty
   - **Decision**: Use meal planner data as the source of truth when form loads, but allow manual edits

3. **Performance**
   - Fetch meals only when needed (when form enters edit mode)
   - Cache meal data if user toggles between edit/view modes

4. **Error Handling**
   - Gracefully handle API failures
   - Don't block form functionality if meal planner data is unavailable

## Success Metrics

1. **User Engagement**
   - 80% of users who have meals in the previous week see auto-populated meals in preferences
   - Reduction in time spent on preferences page (target: 50% reduction)

2. **Data Quality**
   - Increase in consistency between meal planner and preferences data
   - Reduction in manual meal name entry errors

3. **Feature Adoption**
   - Track how many users utilize the auto-populated meals vs. manually entering
   - Monitor how often users edit the auto-populated list

4. **Technical Metrics**
   - API call success rate for meal fetching (target: >95%)
   - Page load time impact (target: <200ms additional load time)

## Open Questions

1. **Data Merging Strategy**: If a user has previously saved preferences with previous_meals, should we:
   - A. Replace with meal planner data (overwrite existing)
   - B. Merge both lists (combine meal planner + saved preferences)
   - C. Only use meal planner if saved preferences are empty
   - **Recommendation**: Option A (replace) - meal planner is source of truth

2. **Duplicate Handling**: If the same meal appears multiple times in the previous week (e.g., "Pasta" on Monday and Friday), should we:
   - A. Include all instances (user can manually deduplicate)
   - B. Automatically deduplicate (show unique meal names only)
   - **Recommendation**: Option B (deduplicate) - cleaner user experience

3. **Meal Name Formatting**: Should meal names be:
   - A. Exactly as stored in meal planner (preserve capitalization, etc.)
   - B. Normalized (title case, trimmed)
   - **Recommendation**: Option A (preserve) - maintain user's original input

4. **Empty State Messaging**: When no meals exist for the previous week, should we:
   - A. Show no message (field remains empty)
   - B. Show helper text: "No meals found in meal planner for last week"
   - **Recommendation**: Option A (no message) - keep UI clean, users can still manually enter
