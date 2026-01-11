# Guide to Increasing Jest Test Coverage

## Current Coverage Status

**Overall Coverage:**

- Statements: 72.65% (2155/2966)
- Branches: 64.4% (921/1430)
- Functions: 73.28% (469/640)
- Lines: 73.64% (2076/2819)

## File Structure and Test Placement

### Test File Naming Convention

Tests follow this pattern:

- **Component/Page tests:** `*.test.tsx` or `*.test.ts`
- **Test location:** Place in `__tests__` directory adjacent to the source file

### Project Structure

```
grocery-list-app/
├── app/
│   ├── __tests__/
│   │   ├── page.test.tsx                    ✅ EXISTS
│   │   ├── layout.test.tsx                  ❌ NEEDS CREATION
│   │   └── providers.test.tsx               ❌ NEEDS CREATION
│   ├── layout.tsx                           📝 Source file
│   ├── providers.tsx                        📝 Source file
│   ├── page.tsx                             📝 Source file
│   │
│   ├── grocery-lists/
│   │   ├── __tests__/
│   │   │   └── page.test.tsx                ✅ EXISTS
│   │   ├── page.tsx                         📝 Source file
│   │   │
│   │   └── [id]/
│   │       ├── __tests__/
│   │       │   └── page.test.tsx            ✅ EXISTS (needs enhancement)
│   │       └── page.tsx                     📝 Source file (42.19% coverage)
│   │
│   ├── household/
│   │   ├── __tests__/
│   │   │   └── page.test.tsx                ✅ EXISTS (needs enhancement)
│   │   ├── page.tsx                         📝 Source file (53.36% coverage)
│   │   └── page-simple.tsx                  📝 Source file (0% coverage)
│   │
│   ├── meal-planner/
│   │   ├── __tests__/
│   │   │   ├── page.test.tsx                ✅ EXISTS
│   │   │   ├── page.simplified-flow.test.tsx ✅ EXISTS
│   │   │   └── page.mobile-delete.test.tsx  ✅ EXISTS
│   │   └── page.tsx                         📝 Source file
│   │
│   ├── pantry/
│   │   ├── __tests__/
│   │   │   └── page.test.tsx                ✅ EXISTS (needs enhancement)
│   │   └── page.tsx                         📝 Source file (53.78% coverage)
│   │
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       ├── __tests__/
│   │       │   └── page.test.tsx            ❌ NEEDS CREATION
│   │       └── page.tsx                     📝 Source file (0% coverage)
│   │
│   └── sign-up/
│       └── [[...sign-up]]/
│           ├── __tests__/
│           │   └── page.test.tsx            ❌ NEEDS CREATION
│           └── page.tsx                     📝 Source file (0% coverage)
│
├── components/
│   ├── dashboard/
│   │   ├── __tests__/
│   │   │   ├── DashboardLayout.test.tsx     ✅ EXISTS
│   │   │   ├── InsightsDisplay.test.tsx    ✅ EXISTS
│   │   │   ├── SmartSuggestions.test.tsx   ✅ EXISTS
│   │   │   └── UrgentActionItems.test.tsx  ✅ EXISTS
│   │   └── DashboardLayout.tsx              📝 Source file
│   │
│   ├── grocery/
│   │   ├── __tests__/
│   │   │   ├── AddItemForm.test.tsx         ✅ EXISTS
│   │   │   ├── EditItemForm.test.tsx        ✅ EXISTS
│   │   │   ├── GroceryListCard.test.tsx     ✅ EXISTS
│   │   │   ├── GroceryListItem.test.tsx     ✅ EXISTS
│   │   │   ├── ReuseListModal.test.tsx      ✅ EXISTS
│   │   │   └── SortMethodSelector.test.tsx  ✅ EXISTS
│   │   └── AddItemForm.tsx                  📝 Source file
│   │
│   ├── household/
│   │   ├── __tests__/
│   │   │   ├── EditMemberForm.test.tsx      ✅ EXISTS
│   │   │   ├── InviteMemberForm.test.tsx    ✅ EXISTS
│   │   │   ├── MemberCard.test.tsx          ✅ EXISTS
│   │   │   ├── PreferencesDisplay.test.tsx  ✅ EXISTS
│   │   │   ├── PreferencesForm.test.tsx     ✅ EXISTS
│   │   │   ├── SharedListsView.test.tsx     ✅ EXISTS
│   │   │   └── WeatherForecast.test.tsx     ✅ EXISTS
│   │   └── PreferencesForm.tsx              📝 Source file
│   │
│   ├── meal-planner/
│   │   ├── __tests__/
│   │   │   ├── AddMealModal.test.tsx        ✅ EXISTS
│   │   │   ├── AddMealModal.delete.test.tsx ✅ EXISTS
│   │   │   ├── MealCard.test.tsx            ✅ EXISTS
│   │   │   ├── MealDetailsModal.delete.test.tsx ✅ EXISTS
│   │   │   ├── MobileWeeklyCalendar.test.tsx ✅ EXISTS
│   │   │   └── WeeklyCalendar.test.tsx      ✅ EXISTS
│   │   └── AddMealModal.tsx                 📝 Source file
│   │
│   ├── pantry/
│   │   ├── __tests__/
│   │   │   ├── AddPantryItemForm.test.tsx   ✅ EXISTS
│   │   │   ├── EditPantryItemForm.test.tsx  ✅ EXISTS
│   │   │   ├── GenerateGroceryListModal.test.tsx ✅ EXISTS
│   │   │   ├── PantryGrid.test.tsx         ✅ EXISTS
│   │   │   └── PantryItemCard.test.tsx     ✅ EXISTS
│   │   └── AddPantryItemForm.tsx            📝 Source file
│   │
│   ├── layout/
│   │   ├── __tests__/
│   │   │   ├── MobileNav.test.tsx           ✅ EXISTS
│   │   │   └── Navbar.test.tsx              ✅ EXISTS
│   │   └── Navbar.tsx                       📝 Source file
│   │
│   └── ui/
│       ├── __tests__/
│       │   ├── Badge.test.tsx               ✅ EXISTS
│       │   ├── Button.test.tsx              ✅ EXISTS
│       │   ├── Card.test.tsx                ✅ EXISTS
│       │   ├── Checkbox.test.tsx            ✅ EXISTS
│       │   ├── ConfirmDeleteModal.test.tsx  ✅ EXISTS
│       │   ├── Input.test.tsx               ✅ EXISTS
│       │   ├── Modal.test.tsx               ✅ EXISTS
│       │   └── Select.test.tsx              ✅ EXISTS
│       └── Button.tsx                       📝 Source file
│
└── lib/
    ├── __tests__/
    │   └── utils.test.ts                    ✅ EXISTS
    │
    ├── api/
    │   ├── __tests__/
    │   │   ├── client.test.ts               ❌ NEEDS CREATION (HIGH PRIORITY)
    │   │   ├── dashboard.test.ts            ✅ EXISTS
    │   │   ├── pantry.test.ts               ❌ NEEDS CREATION
    │   │   └── weather.test.ts              ❌ NEEDS CREATION
    │   ├── client.ts                        📝 Source file (22.5% coverage)
    │   ├── dashboard.ts                     📝 Source file
    │   ├── grocery.ts                       📝 Source file
    │   ├── household.ts                     📝 Source file
    │   ├── meals.ts                         📝 Source file
    │   ├── pantry.ts                        📝 Source file (36.36% coverage)
    │   └── weather.ts                       📝 Source file (0% coverage)
    │
    ├── adapters/
    │   ├── __tests__/
    │   │   └── groceryAdapters.test.ts      ✅ EXISTS
    │   └── groceryAdapters.ts               📝 Source file
    │
    ├── utils/
    │   ├── __tests__/
    │   │   └── contextDetection.test.ts      ✅ EXISTS
    │   └── contextDetection.ts              📝 Source file
    │
    ├── mockData.ts                          📝 Source file (0% coverage - optional)
    ├── types.ts                             📝 Source file
    └── utils.ts                             📝 Source file
```

### Key Patterns

#### Pattern 1: App Directory Tests

```
app/
├── layout.tsx                    → app/__tests__/layout.test.tsx
├── providers.tsx                 → app/__tests__/providers.test.tsx
└── page.tsx                      → app/__tests__/page.test.tsx
```

#### Pattern 2: Nested Route Tests

```
app/
└── grocery-lists/
    ├── page.tsx                  → app/grocery-lists/__tests__/page.test.tsx
    └── [id]/
        └── page.tsx              → app/grocery-lists/[id]/__tests__/page.test.tsx
```

#### Pattern 3: Component Tests

```
components/
└── grocery/
    ├── AddItemForm.tsx           → components/grocery/__tests__/AddItemForm.test.tsx
    └── GroceryListItem.tsx       → components/grocery/__tests__/GroceryListItem.test.tsx
```

#### Pattern 4: Library/API Tests

```
lib/
└── api/
    ├── client.ts                 → lib/api/__tests__/client.test.ts
    ├── weather.ts                → lib/api/__tests__/weather.test.ts
    └── pantry.ts                 → lib/api/__tests__/pantry.test.ts
```

### Files That Need Test Creation

#### 🔴 Critical Priority (0% Coverage)

1. `app/__tests__/layout.test.tsx` - Test `app/layout.tsx`
2. `app/__tests__/providers.test.tsx` - Test `app/providers.tsx`
3. `lib/api/__tests__/client.test.ts` - Test `lib/api/client.ts` ⭐ **HIGHEST IMPACT**
4. `lib/api/__tests__/weather.test.ts` - Test `lib/api/weather.ts`
5. `app/sign-in/[[...sign-in]]/__tests__/page.test.tsx` - Test sign-in page
6. `app/sign-up/[[...sign-up]]/__tests__/page.test.tsx` - Test sign-up page

#### 🟡 High Priority (Low Coverage)

1. `lib/api/__tests__/pantry.test.ts` - Test `lib/api/pantry.ts` (36.36% coverage)
2. Enhance `app/grocery-lists/[id]/__tests__/page.test.tsx` (42.19% coverage)
3. Enhance `app/household/__tests__/page.test.tsx` (53.36% coverage)
4. Enhance `app/pantry/__tests__/page.test.tsx` (53.78% coverage)

### Quick Reference: Where to Create New Tests

| Source File                           | Test File Location                                   |
| ------------------------------------- | ---------------------------------------------------- |
| `app/layout.tsx`                      | `app/__tests__/layout.test.tsx`                      |
| `app/providers.tsx`                   | `app/__tests__/providers.test.tsx`                   |
| `lib/api/client.ts`                   | `lib/api/__tests__/client.test.ts`                   |
| `lib/api/weather.ts`                  | `lib/api/__tests__/weather.test.ts`                  |
| `lib/api/pantry.ts`                   | `lib/api/__tests__/pantry.test.ts`                   |
| `app/sign-in/[[...sign-in]]/page.tsx` | `app/sign-in/[[...sign-in]]/__tests__/page.test.tsx` |
| `app/sign-up/[[...sign-up]]/page.tsx` | `app/sign-up/[[...sign-up]]/__tests__/page.test.tsx` |

## Priority Areas for Improvement

### 🔴 Critical: 0% Coverage Files

These files have no test coverage and should be prioritized:

#### 1. `app/layout.tsx` (0% coverage)

**What to test:**

- Root layout renders correctly
- Metadata is set properly
- Providers wrapper is included
- Navbar and MobileNav are rendered
- Children are rendered in main element

**Test file to create:** `app/__tests__/layout.test.tsx`

```typescript
// Example test structure
describe('RootLayout', () => {
  it('renders metadata correctly', () => {
    // Test metadata export
  })

  it('renders navbar and mobile nav', () => {
    // Test layout structure
  })

  it('renders children in main element', () => {
    // Test children rendering
  })
})
```

#### 2. `app/providers.tsx` (0% coverage)

**What to test:**

- ClerkProvider wraps children correctly
- Children are rendered inside provider

**Test file to create:** `app/__tests__/providers.test.tsx`

#### 3. `lib/api/client.ts` (22.5% coverage)

**What to test:**

- `get()`, `post()`, `put()`, `patch()`, `del()` functions
- Error handling (network errors, API errors)
- Token authentication
- 204 No Content responses
- JSON parsing
- ApiClientError class

**Test file to create:** `lib/api/__tests__/client.test.ts`

**Key test cases:**

- Successful GET request
- Successful POST/PUT/PATCH/DELETE requests
- Error handling (4xx, 5xx responses)
- Network errors
- Missing token vs token provided
- 204 No Content response handling
- Invalid JSON responses

#### 4. `lib/api/weather.ts` (0% coverage)

**What to test:**

- `getWeatherForecast()` function
- `getMyWeatherForecast()` function
- Error handling

**Test file to create:** `lib/api/__tests__/weather.test.ts`

#### 5. `lib/api/pantry.ts` (36.36% coverage)

**What to test:**

- All CRUD operations
- Query parameter handling
- Error cases

**Test file to create:** `lib/api/__tests__/pantry.test.ts`

#### 6. `app/sign-in/[[...sign-in]]/page.tsx` (0% coverage)

**What to test:**

- SignIn component renders
- Clerk sign-in integration

#### 7. `app/sign-up/[[...sign-up]]/page.tsx` (0% coverage)

**What to test:**

- SignUp component renders
- Clerk sign-up integration

#### 8. `lib/mockData.ts` (0% coverage)

**What to test:**

- Mock data structure
- Data validity (if applicable)

**Note:** This might be intentionally excluded from coverage if it's only used for development.

### 🟡 High Priority: Low Coverage Files (<50%)

#### 1. `app/grocery-lists/[id]/page.tsx` (42.19% coverage)

**What to test:**

- List fetching and loading states
- Adding items
- Editing items
- Deleting items
- Sorting functionality
- Error handling
- Modal interactions
- Title editing
- Reuse list functionality

**Existing test file:** `app/grocery-lists/[id]/__tests__/page.test.tsx`

**Improvements needed:**

- Add tests for error states
- Add tests for edge cases (empty list, network failures)
- Add tests for all sorting methods
- Add tests for modal interactions
- Add tests for reuse list flow

#### 2. `app/household/page.tsx` (53.36% coverage)

**What to test:**

- All user interactions
- Error handling
- Loading states
- Form submissions
- Modal interactions

**Existing test file:** `app/household/__tests__/page.test.tsx`

**Improvements needed:**

- Test error scenarios
- Test edge cases
- Test all form interactions
- Test API failure scenarios

#### 3. `app/pantry/page.tsx` (53.78% coverage)

**What to test:**

- All CRUD operations
- Error handling
- Filtering and searching
- Generate grocery list flow

**Existing test file:** `app/pantry/__tests__/page.test.tsx`

**Improvements needed:**

- Test error scenarios
- Test filtering functionality
- Test edge cases

## Step-by-Step Action Plan

### Phase 1: Critical API Client Testing (Highest Impact)

1. **Create `lib/api/__tests__/client.test.ts`**
   - This will significantly increase coverage since `client.ts` is used by all API modules
   - Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Test error handling scenarios
   - Test authentication flow

2. **Create `lib/api/__tests__/weather.test.ts`**
   - Test weather API functions
   - Mock API responses

3. **Create `lib/api/__tests__/pantry.test.ts`**
   - Test all pantry API functions
   - Test query parameter handling

### Phase 2: Layout and Provider Testing

1. **Create `app/__tests__/layout.test.tsx`**
   - Test root layout structure
   - Test metadata

2. **Create `app/__tests__/providers.test.tsx`**
   - Test ClerkProvider wrapper

### Phase 3: Improve Existing Test Coverage

1. **Enhance `app/grocery-lists/[id]/__tests__/page.test.tsx`**
   - Add missing test cases
   - Test error scenarios
   - Test edge cases

2. **Enhance `app/household/__tests__/page.test.tsx`**
   - Add missing test cases
   - Test error scenarios

3. **Enhance `app/pantry/__tests__/page.test.tsx`**
   - Add missing test cases
   - Test error scenarios

### Phase 4: Authentication Pages

1. **Create tests for sign-in and sign-up pages**
   - These are likely simple Clerk wrapper components
   - Test that they render correctly

## Testing Best Practices

### 1. Test User Interactions, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.isLoading).toBe(true)

// ✅ Good: Testing user-visible behavior
expect(screen.getByText('Loading...')).toBeInTheDocument()
```

### 2. Test Error Scenarios

```typescript
it('displays error message when API call fails', async () => {
  // Mock API failure
  // Test error handling
})
```

### 3. Test Edge Cases

```typescript
it('handles empty list gracefully', () => {
  // Test with empty data
})

it('handles missing token', async () => {
  // Test authentication edge cases
})
```

### 4. Use Proper Mocking

```typescript
// Mock API calls
jest.mock('@/lib/api/grocery', () => ({
  getGroceryList: jest.fn(),
  // ...
}))
```

### 5. Test All Code Paths

- Happy paths
- Error paths
- Edge cases
- Loading states
- Empty states

## Quick Wins

### 1. Test API Client Functions

The `lib/api/client.ts` file has only 22.5% coverage but is used everywhere. Testing this will have a huge impact.

### 2. Test Simple Components

Files like `app/layout.tsx` and `app/providers.tsx` are simple and should be quick to test.

### 3. Add Error Handling Tests

Many components have error handling code that isn't tested. Add tests for error scenarios.

## Running Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom='lib/api/client.ts'
```

## Coverage Goals

- **Short-term goal:** 80% overall coverage
- **Medium-term goal:** 85% overall coverage
- **Long-term goal:** 90%+ overall coverage

Focus on:

1. **Statements:** Currently 72.65% → Target 80%+
2. **Branches:** Currently 64.4% → Target 75%+ (most important for quality)
3. **Functions:** Currently 73.28% → Target 80%+
4. **Lines:** Currently 73.64% → Target 80%+

## Files to Exclude from Coverage (Optional)

If certain files don't need coverage, you can exclude them in `jest.config.js`:

```javascript
collectCoverageFrom: [
  'app/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/.next/**',
  '!lib/mockData.ts', // Example: exclude mock data
],
```

## Next Steps

1. Start with `lib/api/client.test.ts` - highest impact
2. Then test layout and providers - quick wins
3. Enhance existing test files with missing scenarios
4. Add tests for authentication pages
5. Continuously run coverage reports to track progress

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
