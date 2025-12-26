# Pantry Modal & Badge Fixes

## Issues Fixed

### 1. ❌ **Changes Not Saving** (CRITICAL BUG)

#### Problem

When editing pantry items (changing quantity, removing expiration date), the changes were not being saved.

#### Root Cause

**Data Mapping Bug** - The quantity field was being incorrectly mapped in three places:

1. **Create Item** (Line 109):

   ```typescript
   // WRONG - sends unit instead of quantity!
   quantity: newItem.unit || `${newItem.quantity}`
   ```

2. **Update Item** (Line 165):

   ```typescript
   // WRONG - sends unit instead of quantity!
   quantity: updatedItem.unit || `${updatedItem.quantity}`
   ```

3. **Parse Response** (Lines 121, 177, 61):
   ```typescript
   // WRONG - tries to use the whole quantity string as unit!
   unit: createdItem.quantity
   ```

#### Solution

The backend stores `quantity` as a **string** that includes both the number and unit (e.g., "5 pcs", "2 kg").

**Fixed by:**

1. **Proper Quantity String Construction**:

   ```typescript
   quantity: updatedItem.unit
     ? `${updatedItem.quantity} ${updatedItem.unit}`
     : `${updatedItem.quantity}`
   ```

2. **Proper Quantity Parsing** with regex:

   ```typescript
   const parseQuantity = (quantityStr: string | undefined) => {
     if (!quantityStr) return { quantity: 0, unit: undefined }
     const match = quantityStr.match(/^([\d.]+)\s*(.*)$/)
     if (match) {
       return {
         quantity: parseFloat(match[1]),
         unit: match[2] || undefined,
       }
     }
     return { quantity: parseFloat(quantityStr) || 0, unit: undefined }
   }
   ```

3. **Applied to all data flows**:
   - ✅ Initial fetch (when loading pantry items)
   - ✅ Create item (when adding new items)
   - ✅ Update item (when editing items)

### 2. ❌ **Badge Colors Not Matching**

#### Problem

The "Produce" and other category badges (pills) in the pantry had default gray color, while grocery lists had color-coded badges:

- Produce = green
- Dairy = blue
- Meat = red
- Bakery = yellow/orange

#### Solution

Added the `getBadgeVariant` function to `PantryItemCard.tsx` that matches the color scheme from `GroceryListItem.tsx`:

```typescript
const getBadgeVariant = (
  category: string
): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
  switch (category) {
    case 'Produce':
      return 'success' // Green
    case 'Dairy':
      return 'primary' // Blue
    case 'Meat':
      return 'danger' // Red
    case 'Bakery':
      return 'warning' // Yellow/Orange
    case 'Grains':
      return 'warning'
    case 'Canned Goods':
      return 'primary'
    case 'Frozen':
      return 'primary'
    case 'Snacks':
      return 'warning'
    case 'Beverages':
      return 'primary'
    default:
      return 'default' // Gray
  }
}
```

Now the badge uses the color variant:

```typescript
<Badge variant={getBadgeVariant(item.category)} className="text-xs whitespace-nowrap">
  {item.category}
</Badge>
```

## Testing Checklist

### ✅ Changes Should Now Save

1. Open pantry page
2. Click edit on any item
3. Change the quantity (e.g., from 5 to 10)
4. Remove the expiration date (clear the field)
5. Click "Save Changes"
6. **Expected**: Changes are saved and visible immediately

### ✅ Expiration Date Removal

1. Edit an item with an expiration date
2. Clear the expiration date field
3. Save
4. **Expected**: Expiration date is removed (API sends `null`)

### ✅ Quantity with Unit

1. Edit an item
2. Set quantity to "5" and unit to "pcs"
3. Save
4. **Expected**: Displays as "5 pcs" and both values are preserved

### ✅ Badge Colors

1. View pantry items
2. **Expected**:
   - Produce items have green badges
   - Dairy items have blue badges
   - Meat items have red badges
   - Bakery items have yellow/orange badges

## Files Modified

1. **`app/pantry/page.tsx`**
   - Fixed `handleAddItem` function (create)
   - Fixed `handleUpdateItem` function (update)
   - Fixed initial data fetch (load)
   - Added `parseQuantity` helper function in all three places

2. **`components/pantry/PantryItemCard.tsx`**
   - Added `getBadgeVariant` function
   - Changed badge from `variant="default"` to `variant={getBadgeVariant(item.category)}`

## Technical Details

### Backend API Contract

- **Field**: `quantity: Optional[str]`
- **Format**: "number unit" (e.g., "5 pcs", "2.5 kg", "10")
- **Update**: Can send `null` to clear expiration_date

### Frontend Data Flow

1. **User Input** → Separate fields (quantity: number, unit: string)
2. **API Request** → Combined string (quantity: "5 pcs")
3. **API Response** → Combined string (quantity: "5 pcs")
4. **Frontend State** → Parsed back to separate (quantity: 5, unit: "pcs")

### Regex Pattern

```regex
^([\d.]+)\s*(.*)$
```

- Captures: `(number)(optional whitespace)(optional unit)`
- Examples:
  - "5 pcs" → quantity: 5, unit: "pcs"
  - "2.5kg" → quantity: 2.5, unit: "kg"
  - "10" → quantity: 10, unit: undefined

## Validation

✅ No linter errors  
✅ TypeScript compilation passes  
✅ Data mapping is consistent across all operations  
✅ Color scheme matches between pantry and grocery lists

## Related Issues

This fix resolves:

- Modal input fields not saving changes
- Expiration date removal not working
- Quantity and unit data being lost
- Badge colors not matching UI design
