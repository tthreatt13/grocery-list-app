# PRD: LLM-Powered Meal Planning Assistant

## Introduction/Overview

This feature integrates Anthropic's Claude LLM into the grocery app to provide intelligent meal planning assistance. Currently, users manually print their pantry page, meal planner page, grocery list page, and preferences to share with Claude for meal suggestions. This feature automates that workflow by providing an in-app chat interface that uses Claude to generate meal suggestions based on the user's full context (pantry inventory, existing meals, preferences, grocery lists, and weather).

**Problem:** Users currently have to manually export/print multiple pages and copy-paste information into external LLM tools to get meal planning help. This is time-consuming and error-prone.

**Goal:** Provide an integrated, context-aware AI assistant that helps users plan meals for the week using all available household data, with an interactive chat interface for refining suggestions before applying them to the meal planner.

## Goals

1. **Reduce manual data entry** - Eliminate the need to print/copy data from multiple pages
2. **Improve meal planning efficiency** - Help users create weekly meal plans in minutes instead of manually planning
3. **Leverage existing inventory** - Suggest meals that use pantry items to reduce waste and shopping
4. **Provide intelligent suggestions** - Use full context (pantry, preferences, weather, existing meals) to generate relevant meal ideas
5. **Enable iterative refinement** - Allow users to chat with the AI to refine suggestions before applying them
6. **Optional grocery list generation** - Allow users to optionally generate grocery lists from AI-suggested meals

## User Stories

1. **As a busy parent**, I want to see AI meal suggestions directly on my meal planner page, so I don't have to manually export data and use external tools.

2. **As a meal planner**, I want the AI to consider my pantry inventory, so I can use what I already have and reduce food waste.

3. **As a household manager**, I want the AI to consider my dietary preferences, cooking equipment, and weather, so meal suggestions are practical and relevant to my situation.

4. **As a user**, I want to chat with the AI to refine meal suggestions (e.g., "make Monday's dinner vegetarian" or "suggest something quick for Wednesday"), so I can get personalized recommendations.

5. **As a shopper**, I want to optionally generate a grocery list from AI-suggested meals, so I know what to buy for the week.

6. **As a user**, I want to see meal suggestions inline on the meal planner page, so I can easily review and apply them without switching contexts.

7. **As a user**, I want the AI to suggest meals that create leftovers for lunch, so I can plan efficiently for both dinner and lunch.

## Functional Requirements

### Core LLM Integration

1. The system must integrate with Anthropic's Claude API (using the `anthropic` Python SDK).
2. The system must securely store the Anthropic API key in environment variables (backend only, never exposed to frontend).
3. The system must provide a backend API endpoint (`POST /api/meals/ai-suggest`) that accepts meal planning requests and returns AI-generated suggestions.
4. The system must handle API rate limiting and errors gracefully, showing user-friendly error messages.
5. The system must include request timeout handling (suggest 30-60 seconds max for LLM responses).

### Context Gathering

6. The system must gather the following context data when generating meal suggestions:
   - Current pantry inventory (all items with quantities, categories, expiration dates, low stock status)
   - Current week's meal plan (existing meals with dates, meal types, ingredients, notes)
   - User preferences (diet types, cooking apparatus, previous meals, zip code)
   - Active grocery lists (list names and items)
   - Weather forecast (if zip code is available in preferences)
   - Household information (household name, member count)

7. The system must format context data in a clear, structured format for the LLM prompt (JSON or structured text).

8. The system must include the target week's date range in the context (Monday-Sunday).

### Chat Interface

9. The system must display an interactive chat interface on the meal planner page (inline, not in a separate modal).

10. The chat interface must show a conversation history between the user and the AI assistant.

11. The chat interface must allow users to send messages to refine suggestions (e.g., "make it vegetarian", "suggest something quick", "use more pantry items").

12. The chat interface must display AI responses with meal suggestions in a readable format.

13. The chat interface must show a loading indicator while waiting for AI responses.

14. The chat interface must allow users to clear the conversation and start fresh.

### Meal Suggestions

15. The system must generate meal suggestions that include:

- Meal name
- Meal type (breakfast, lunch, dinner, snack)
- Suggested date/day of week
- Ingredients list
- Optional notes/description
- Indication of which pantry items are used

16. The system must suggest meals that utilize existing pantry items when possible.

17. The system must suggest additional ingredients needed for meals that aren't in the pantry.

18. The system must consider user dietary preferences (diet types) when generating suggestions.

19. The system must consider available cooking equipment (cooking apparatus) when generating suggestions.

20. The system must consider weather forecasts (if available) to suggest appropriate meals (e.g., hot meals on cold days).

21. The system must avoid suggesting meals that were recently made (using previous_meals from preferences).

22. The system must suggest dinner meals that can create leftovers for lunch.

### Applying Suggestions

23. The system must display suggested meals in a reviewable format before applying them.

24. The system must allow users to select which suggested meals to apply to the planner.

25. The system must allow users to edit meal details (name, ingredients, notes) before applying.

26. The system must provide a "Apply Selected Meals" button that adds selected meals to the meal planner.

27. The system must show a confirmation message after successfully applying meals.

28. The system must handle errors gracefully if meal creation fails (show error message, don't lose user's selections).

### Grocery List Integration

29. The system must provide an optional "Generate Grocery List" feature after meals are suggested.

30. The "Generate Grocery List" feature must extract ingredients from suggested meals that aren't in the pantry.

31. The "Generate Grocery List" feature must allow users to create a new grocery list or add to an existing list.

32. The "Generate Grocery List" feature must only be available after meals have been suggested.

### UI/UX Requirements

33. The chat interface must be visible on the meal planner page without requiring navigation to a separate page.

34. The chat interface must be responsive and work on both desktop and mobile devices.

35. The chat interface must have a clear visual distinction between user messages and AI responses.

36. The chat interface must support scrolling to view conversation history.

37. The meal suggestions display must show meals in a card or list format that's easy to review.

38. The meal suggestions display must clearly indicate which meals use pantry items vs. require shopping.

39. The system must provide clear visual feedback for all user actions (loading states, success messages, error messages).

### Security & Privacy

40. The system must never expose the Anthropic API key to the frontend.

41. The system must authenticate users before allowing AI meal planning requests (use existing Clerk authentication).

42. The system must ensure users can only access meal planning for households they are members of.

43. The system must log API usage for monitoring and cost tracking (but not store full conversation history in logs).

### Performance

44. The system must respond to initial meal suggestion requests within 30 seconds (target: 10-15 seconds).

45. The system must cache context data appropriately to avoid redundant database queries.

46. The system must handle concurrent requests gracefully (rate limiting if needed).

## Non-Goals (Out of Scope)

1. **Recipe database integration** - The LLM will suggest meal names and ingredients, but won't provide full recipes (this is a future enhancement).

2. **Image generation** - No meal images or recipe photos will be generated.

3. **Nutritional analysis** - No calorie counting or nutritional information will be provided.

4. **Shopping list price estimation** - No cost calculations or price tracking.

5. **Multi-week planning** - Initial version focuses on single-week meal planning (current week view).

6. **Meal plan templates** - No pre-built meal plan templates, only AI-generated suggestions.

7. **Voice interface** - Text-based chat only, no voice input/output.

8. **Real-time collaboration** - AI suggestions are per-user, not shared in real-time with household members.

9. **Historical meal analysis** - No analysis of past meal plans for patterns (beyond avoiding recent meals from preferences).

10. **Automatic meal application** - Users must explicitly approve and apply suggestions (no auto-population).

## Design Considerations

### UI Placement

- The chat interface should be displayed as a collapsible panel or section on the meal planner page, positioned below the week navigation but above or beside the weekly calendar.
- On desktop: Consider a side panel or bottom section that doesn't obstruct the calendar view.
- On mobile: Consider a full-width section that can be expanded/collapsed, or a floating action button that opens a modal.

### Chat Interface Design

- Use a familiar chat UI pattern (messages in bubbles, user messages on right, AI on left).
- Use distinct colors for user vs. AI messages (e.g., user: blue/primary color, AI: gray/neutral).
- Include timestamps for messages (optional, can be hidden on mobile for space).
- Show typing indicators or loading states while AI is processing.
- Allow users to copy AI responses if needed.

### Meal Suggestions Display

- Show suggested meals in cards or a list format.
- Each meal card should display:
  - Meal name (prominent)
  - Meal type and suggested day
  - Ingredients list (with pantry items highlighted)
  - Checkbox for selection
  - Edit button to modify before applying
- Use visual indicators (icons or badges) to show:
  - Which meals use pantry items (green checkmark or badge)
  - Which meals require shopping (shopping cart icon)
  - Quick meals vs. normal meals

### Existing Components to Leverage

- Reuse existing `Modal` component for any confirmation dialogs.
- Reuse existing `Button` component for actions.
- Reuse existing meal card styling from `MealCard` component for consistency.
- Consider creating a new `ChatInterface` component for the chat UI.
- Consider creating a new `MealSuggestionCard` component for displaying suggestions.

### Error States

- Show clear error messages if API calls fail.
- Provide retry functionality for failed requests.
- Show helpful messages if context data is missing (e.g., "No pantry items found - add items to get better suggestions").

## Technical Considerations

### Backend Implementation

1. **New API Endpoint**: Create `POST /api/meals/ai-suggest` in `backend/routes/meals.py`
   - Accepts: `household_id`, `week_start_date`, optional `conversation_history`, optional `user_message`
   - Returns: `{ suggestions: MealSuggestion[], conversation_history: Message[] }`

2. **New Service Module**: Create `backend/services/meal_planning_ai.py`
   - Function to gather context data (pantry, meals, preferences, grocery lists, weather)
   - Function to format context into LLM prompt
   - Function to call Anthropic API
   - Function to parse LLM response into structured meal suggestions

3. **Dependencies**: Add `anthropic` Python package to `backend/requirements.txt`

4. **Environment Variables**: Add `ANTHROPIC_API_KEY` to backend environment configuration

5. **Data Models**: Create Pydantic schemas in `backend/schemas/meal.py`:
   - `MealSuggestion` - structured format for AI suggestions
   - `AISuggestRequest` - request body for the endpoint
   - `AISuggestResponse` - response with suggestions and conversation history

6. **Error Handling**: Implement proper error handling for:
   - API key missing or invalid
   - API rate limits
   - Network timeouts
   - Invalid responses from LLM
   - Database query failures

### Frontend Implementation

1. **New API Client Function**: Add to `lib/api/meals.ts`:
   - `getAIMealSuggestions()` - calls the new backend endpoint

2. **New Component**: Create `components/meal-planner/AIMealPlanningAssistant.tsx`
   - Chat interface UI
   - Meal suggestions display
   - Apply meals functionality
   - Integration with existing meal planner page

3. **State Management**:
   - Manage conversation history in component state
   - Manage selected meals for application
   - Handle loading and error states

4. **Integration Point**: Add the AI assistant component to `app/meal-planner/page.tsx`
   - Display inline on the meal planner page
   - Pass necessary props (householdId, weekStartDate, etc.)

### Prompt Engineering

The system prompt should instruct Claude to:

- Generate meal suggestions in a structured format (JSON or markdown)
- Consider all provided context (pantry, preferences, weather, etc.)
- Suggest meals that use pantry items when possible
- Suggest additional ingredients for meals that require shopping
- Focus on dinner meals that create leftovers for lunch
- Avoid recently made meals
- Consider dietary restrictions and cooking equipment
- Provide meal names, ingredients lists, and brief notes

Example prompt structure:

```
You are a meal planning assistant for a grocery list app. Help the user plan meals for the week.

Context:
- Pantry inventory: [list of items]
- Current meals: [existing meals for the week]
- User preferences: [diet types, cooking equipment, previous meals]
- Weather: [7-day forecast if available]
- Target week: [Monday date] to [Sunday date]

Generate meal suggestions that:
1. Use pantry items when possible
2. Suggest additional ingredients for shopping
3. Focus on dinners that create leftovers for lunch
4. Consider dietary preferences and available cooking equipment
5. Avoid recently made meals

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "meal_name": "string",
      "meal_type": "dinner",
      "day_of_week": 0-6,
      "ingredients": ["list"],
      "uses_pantry_items": ["list"],
      "notes": "string"
    }
  ]
}
```

### Cost Considerations

- Anthropic API pricing should be monitored (cost per token)
- Consider implementing usage limits per user/household if costs become significant
- Cache context data to reduce redundant API calls
- Consider implementing a "premium feature" flag if needed for cost control

### Testing Considerations

- Unit tests for context gathering functions
- Unit tests for prompt formatting
- Integration tests for the API endpoint (mock Anthropic API)
- Frontend component tests for chat interface
- E2E tests for the full flow (suggest → review → apply)

## Success Metrics

1. **Adoption Rate**: 30% of active meal planner users try the AI assistant within first month
2. **Completion Rate**: 60% of users who start a conversation with the AI complete the flow (suggest → apply meals)
3. **Time Savings**: Users report saving at least 10 minutes per week on meal planning
4. **User Satisfaction**: 70% of users rate the feature as "helpful" or "very helpful"
5. **Pantry Utilization**: Increase in meals that use pantry items (target: 40% of suggested meals use pantry items)
6. **Error Rate**: Less than 5% of API calls result in user-visible errors
7. **Response Time**: 90% of AI requests complete within 15 seconds

## Open Questions

1. **Rate Limiting**: Should there be limits on how many AI requests a user can make per day/week? (Cost control)

2. **Conversation Persistence**: Should conversation history be saved to the database, or only kept in session? (If saved, need to decide retention period)

3. **Multi-user Households**: Should AI suggestions be shared with all household members, or kept private per user? (Current assumption: per-user, but could be household-level)

4. **Model Selection**: Which Claude model to use? (Claude 3 Opus for best quality, Claude 3 Sonnet for cost/performance balance, Claude 3 Haiku for speed)

5. **Fallback Behavior**: What should happen if Anthropic API is down? (Show error message, or have a fallback to a simpler rule-based system?)

6. **Prompt Versioning**: Should prompts be versioned and A/B tested? (For future optimization)

7. **Context Size Limits**: What's the maximum context size we should send? (Anthropic has token limits - need to handle large pantries/long meal histories)

8. **Streaming Responses**: Should we implement streaming responses for better UX, or wait for full response? (Initial: full response, streaming can be future enhancement)
