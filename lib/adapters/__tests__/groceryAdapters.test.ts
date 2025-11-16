import { transformGroceryItem, transformGroceryList, transformGroceryLists } from '../groceryAdapters'
import { GroceryItemResponse, GroceryListWithItems } from '@/lib/api/grocery'
import { ItemCategory, MealType } from '@/lib/types'

describe('groceryAdapters', () => {
  describe('transformGroceryItem', () => {
    const mockApiItem: GroceryItemResponse = {
      id: 1,
      list_id: 1,
      name: 'Bananas',
      quantity: '6 pcs',
      category: 'produce',
      meal_type: 'breakfast',
      notes: 'Get ripe ones',
      checked: false,
      created_at: '2024-01-01T00:00:00Z',
    }

    it('should transform API grocery item to frontend grocery item', () => {
      const result = transformGroceryItem(mockApiItem)

      expect(result).toEqual({
        id: '1',
        name: 'Bananas',
        quantity: 6,
        unit: 'pcs',
        category: ItemCategory.PRODUCE,
        mealType: MealType.BREAKFAST,
        checked: false,
        notes: 'Get ripe ones',
        addedAt: new Date('2024-01-01T00:00:00Z'),
      })
    })

    it('should handle missing meal type', () => {
      const itemWithoutMealType = { ...mockApiItem, meal_type: undefined }
      const result = transformGroceryItem(itemWithoutMealType)

      expect(result.mealType).toBeUndefined()
    })

    it('should map all meal types correctly', () => {
      const mealTypeMappings = [
        { api: 'breakfast', expected: MealType.BREAKFAST },
        { api: 'lunch', expected: MealType.LUNCH },
        { api: 'dinner', expected: MealType.DINNER },
        { api: 'snack', expected: MealType.SNACK },
      ]

      mealTypeMappings.forEach(({ api, expected }) => {
        const item = { ...mockApiItem, meal_type: api }
        const result = transformGroceryItem(item)
        expect(result.mealType).toBe(expected)
      })
    })

    it('should handle unknown meal type', () => {
      const itemWithUnknownMealType = { ...mockApiItem, meal_type: 'unknown' }
      const result = transformGroceryItem(itemWithUnknownMealType)

      expect(result.mealType).toBeUndefined()
    })

    it('should handle case insensitive meal types', () => {
      const itemWithUpperCase = { ...mockApiItem, meal_type: 'BREAKFAST' }
      const result = transformGroceryItem(itemWithUpperCase)

      expect(result.mealType).toBe(MealType.BREAKFAST)
    })

    it('should handle missing quantity', () => {
      const itemWithoutQuantity = { ...mockApiItem, quantity: undefined }
      const result = transformGroceryItem(itemWithoutQuantity)

      expect(result.quantity).toBe(1)
      expect(result.unit).toBeUndefined()
    })

    it('should extract unit from quantity string', () => {
      const testCases = [
        { quantity: '2 gallons', expectedQuantity: 2, expectedUnit: 'gallons' },
        { quantity: '1 lb', expectedQuantity: 1, expectedUnit: 'lb' },
        { quantity: '5', expectedQuantity: 5, expectedUnit: undefined },
        { quantity: '4 kg', expectedQuantity: 4, expectedUnit: 'kg' }, // Use integer for cleaner test
      ]

      testCases.forEach(({ quantity, expectedQuantity, expectedUnit }) => {
        const item = { ...mockApiItem, quantity }
        const result = transformGroceryItem(item)
        expect(result.quantity).toBe(expectedQuantity)
        expect(result.unit).toBe(expectedUnit)
      })
    })

    it('should map categories correctly', () => {
      const categoryMappings = [
        { api: 'produce', expected: ItemCategory.PRODUCE },
        { api: 'dairy', expected: ItemCategory.DAIRY },
        { api: 'meat', expected: ItemCategory.MEAT },
        { api: 'bakery', expected: ItemCategory.BAKERY },
        { api: 'pantry', expected: ItemCategory.PANTRY },
        { api: 'frozen', expected: ItemCategory.FROZEN },
        { api: 'beverages', expected: ItemCategory.BEVERAGES },
        { api: 'snacks', expected: ItemCategory.SNACKS },
        { api: 'unknown', expected: ItemCategory.OTHER },
        { api: undefined, expected: ItemCategory.OTHER },
      ]

      categoryMappings.forEach(({ api, expected }) => {
        const item = { ...mockApiItem, category: api }
        const result = transformGroceryItem(item)
        expect(result.category).toBe(expected)
      })
    })
  })

  describe('transformGroceryList', () => {
    const mockApiList: GroceryListWithItems = {
      id: 1,
      household_id: 1,
      name: 'Weekly Groceries',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      items: [
        {
          id: 1,
          list_id: 1,
          name: 'Eggs',
          quantity: '12',
          category: 'dairy',
          meal_type: 'breakfast',
          notes: null,
          checked: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          list_id: 1,
          name: 'Pasta',
          quantity: '1 lb',
          category: 'pantry',
          meal_type: 'dinner',
          notes: 'Whole wheat',
          checked: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    }

    it('should transform API grocery list to frontend grocery list', () => {
      const result = transformGroceryList(mockApiList)

      expect(result.id).toBe('1')
      expect(result.name).toBe('Weekly Groceries')
      expect(result.createdBy).toBe('1')
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result.updatedAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result.items).toHaveLength(2)
      expect(result.items[0].mealType).toBe(MealType.BREAKFAST)
      expect(result.items[1].mealType).toBe(MealType.DINNER)
    })

    it('should handle empty items array', () => {
      const listWithNoItems = { ...mockApiList, items: [] }
      const result = transformGroceryList(listWithNoItems)

      expect(result.items).toEqual([])
    })

    it('should handle null items', () => {
      const listWithNullItems = { ...mockApiList, items: null as unknown as typeof mockApiList.items }
      const result = transformGroceryList(listWithNullItems)

      expect(result.items).toEqual([])
    })
  })

  describe('transformGroceryLists', () => {
    const mockApiLists: GroceryListWithItems[] = [
      {
        id: 1,
        household_id: 1,
        name: 'List 1',
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [],
      },
      {
        id: 2,
        household_id: 1,
        name: 'List 2',
        created_by: 1,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        items: [],
      },
    ]

    it('should transform array of API grocery lists', () => {
      const result = transformGroceryLists(mockApiLists)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
    })

    it('should handle empty array', () => {
      const result = transformGroceryLists([])

      expect(result).toEqual([])
    })

    it('should handle non-array input', () => {
      const result = transformGroceryLists(null as unknown as GroceryListWithItems[])

      expect(result).toEqual([])
    })
  })
})
