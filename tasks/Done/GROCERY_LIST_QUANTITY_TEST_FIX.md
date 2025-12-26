# Grocery List Quantity Display Test Fix

## Issue

Tests in `app/grocery-lists/[id]/__tests__/page.test.tsx` are failing because quantities aren't being found:

- "2.5 lbs" - not found in test "should display quantity correctly when quantity string contains number and unit"
- "12" - not found in test "should handle items with quantity but no unit"

## Current Status

- ✅ Fixed `extractUnit` regex in `lib/adapters/groceryAdapters.ts` to handle decimals (changed from `/\d+\s*(.+)/` to `/\d+(?:\.\d+)?\s*(.+)/`)
- ✅ Test "should display quantity correctly when quantity string contains number and unit" is now PASSING
- ❌ Test "should handle items with quantity but no unit" is still FAILING - cannot find "12" text

## Investigation Needed

### Test Data

The test uses:

```typescript
{
  id: 1,
  list_id: 1,
  name: 'Eggs',
  quantity: '12',  // No unit, just a number
  category: 'Dairy',
  checked: false,
  created_at: '2024-11-10T10:00:00Z',
}
```

### Data Flow

1. API returns `quantity: '12'` (string)
2. `transformGroceryItem` in `lib/adapters/groceryAdapters.ts`:
   - `extractQuantity('12')` should return `12` (number)
   - `extractUnit('12')` should return `undefined` (no unit)
3. Component receives `{ quantity: 12, unit: undefined }`
4. `GroceryListItem` calls `formatQuantity(12, undefined)`
5. `formatQuantity` in `lib/utils.ts` returns `quantity.toString()` when no unit → should return `"12"`

### Current Component Code

`components/grocery/GroceryListItem.tsx` line 86:

```tsx
<span>{formatQuantity(item.quantity, item.unit)}</span>
```

### Problem

The rendered HTML shows an empty `<span>` tag where the quantity should be. The quantity "12" is not appearing in the DOM.

### Possible Causes

1. **Quantity extraction issue**: `extractQuantity('12')` might not be working correctly
2. **Formatting issue**: `formatQuantity(12, undefined)` might return empty string
3. **Rendering issue**: The span might be conditionally hidden when quantity is 1 and no unit
4. **Test query issue**: "12" appears in multiple places (SVG paths, etc.) making it hard to find

### Next Steps

1. Verify `extractQuantity('12')` returns `12` (not `1`)
2. Verify `formatQuantity(12, undefined)` returns `"12"`
3. Check if there's any conditional rendering that hides quantity when it's 1
4. Use `screen.debug()` in test to see actual rendered output
5. Consider using `getByRole` or more specific queries to find the quantity
6. Check if quantity is being rendered but in a different format (e.g., "12 " with trailing space)

### Files to Check

- `lib/adapters/groceryAdapters.ts` - `extractQuantity` and `extractUnit` functions
- `lib/utils.ts` - `formatQuantity` function
- `components/grocery/GroceryListItem.tsx` - how quantity is rendered
- `app/grocery-lists/[id]/__tests__/page.test.tsx` - test queries

### Test Commands

```bash
# Run the specific failing test
npm test -- "app/grocery-lists/\[id\]/__tests__/page.test.tsx" --testNamePattern="should handle items with quantity but no unit"

# Run all quantity display tests
npm test -- "app/grocery-lists/\[id\]/__tests__/page.test.tsx" --testNamePattern="quantity"
```

## Related Files

- `app/grocery-lists/[id]/page.tsx` - Main component
- `lib/adapters/groceryAdapters.ts` - Data transformation
- `lib/utils.ts` - Utility functions
- `components/grocery/GroceryListItem.tsx` - Item display component
