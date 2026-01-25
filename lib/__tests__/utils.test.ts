import {
  cn,
  formatDate,
  formatRelativeTime,
  isWithinDays,
  isPastDate,
  formatQuantity,
  generateId,
  sortItemsByCategory,
  sortPantryItemsByCategory,
  getCategoryOrder,
  sortItemsByMealTime,
  sortItemsByEntryOrder,
  getMealOrder,
  normalizeIngredientsInput,
  parseRecipeInstructions,
} from '../utils'
import { ItemCategory, MealType } from '../types'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('handles conditional classes', () => {
      const condition = false
      expect(cn('px-2', condition && 'py-1')).toBe('px-2')
    })

    it('merges Tailwind classes without conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-01-15')
      expect(formatDate(date)).toMatch(/Jan 1[45], 2025/)
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "just now" for recent times', () => {
      const date = new Date()
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('returns minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago')
    })

    it('returns hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      expect(formatRelativeTime(date)).toBe('2 hours ago')
    })
  })

  describe('isWithinDays', () => {
    it('returns true for dates within specified days', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      expect(isWithinDays(tomorrow, 7)).toBe(true)
    })

    it('returns false for dates beyond specified days', () => {
      const nextMonth = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
      expect(isWithinDays(nextMonth, 7)).toBe(false)
    })
  })

  describe('isPastDate', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(isPastDate(yesterday)).toBe(true)
    })

    it('returns false for future dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      expect(isPastDate(tomorrow)).toBe(false)
    })
  })

  describe('formatQuantity', () => {
    it('formats quantity with unit', () => {
      expect(formatQuantity(2, 'lbs')).toBe('2 lbs')
    })

    it('formats quantity without unit', () => {
      expect(formatQuantity(5)).toBe('5')
    })
  })

  describe('generateId', () => {
    it('generates a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('getCategoryOrder', () => {
    it('returns correct order for grocery store categories', () => {
      expect(getCategoryOrder(ItemCategory.PRODUCE)).toBe(0)
      expect(getCategoryOrder(ItemCategory.DAIRY)).toBe(1)
      expect(getCategoryOrder(ItemCategory.MEAT)).toBe(2)
      expect(getCategoryOrder(ItemCategory.BAKERY)).toBe(3)
      expect(getCategoryOrder(ItemCategory.PANTRY)).toBe(4)
      expect(getCategoryOrder(ItemCategory.FROZEN)).toBe(5)
      expect(getCategoryOrder(ItemCategory.BEVERAGES)).toBe(6)
      expect(getCategoryOrder(ItemCategory.SNACKS)).toBe(7)
      expect(getCategoryOrder(ItemCategory.OTHER)).toBe(8)
    })

    it('returns high number for unknown categories', () => {
      expect(getCategoryOrder('Unknown' as ItemCategory)).toBe(999)
    })
  })

  describe('sortItemsByCategory', () => {
    const mockItems = [
      {
        id: '1',
        name: 'Chicken Breast',
        quantity: 2,
        unit: 'lbs',
        category: ItemCategory.MEAT,
        checked: false,
        addedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Apples',
        quantity: 6,
        category: ItemCategory.PRODUCE,
        checked: false,
        addedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: ItemCategory.DAIRY,
        checked: false,
        addedAt: new Date('2024-01-03'),
      },
      {
        id: '4',
        name: 'Bananas',
        quantity: 1,
        unit: 'bunch',
        category: ItemCategory.PRODUCE,
        checked: false,
        addedAt: new Date('2024-01-04'),
      },
      {
        id: '5',
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: ItemCategory.BAKERY,
        checked: false,
        addedAt: new Date('2024-01-05'),
      },
    ]

    it('sorts items by category order first', () => {
      const sorted = sortItemsByCategory(mockItems)

      // Should be: Produce (Apples, Bananas), Dairy (Milk), Meat (Chicken), Bakery (Bread)
      expect(sorted[0].category).toBe(ItemCategory.PRODUCE)
      expect(sorted[1].category).toBe(ItemCategory.PRODUCE)
      expect(sorted[2].category).toBe(ItemCategory.DAIRY)
      expect(sorted[3].category).toBe(ItemCategory.MEAT)
      expect(sorted[4].category).toBe(ItemCategory.BAKERY)
    })

    it('sorts items alphabetically within each category', () => {
      const sorted = sortItemsByCategory(mockItems)

      // Within Produce category: Apples should come before Bananas
      const produceItems = sorted.filter(
        (item) => item.category === ItemCategory.PRODUCE
      )
      expect(produceItems[0].name).toBe('Apples')
      expect(produceItems[1].name).toBe('Bananas')
    })

    it('handles empty array', () => {
      const sorted = sortItemsByCategory([])
      expect(sorted).toEqual([])
    })

    it('handles items without categories', () => {
      const itemsWithoutCategory = [
        {
          id: '1',
          name: 'Mystery Item',
          quantity: 1,
          category: undefined as unknown as ItemCategory,
          checked: false,
          addedAt: new Date(),
        },
        {
          id: '2',
          name: 'Apples',
          quantity: 1,
          category: ItemCategory.PRODUCE,
          checked: false,
          addedAt: new Date(),
        },
      ]

      const sorted = sortItemsByCategory(itemsWithoutCategory)

      // Produce should come first, undefined category should be treated as OTHER (last)
      expect(sorted[0].name).toBe('Apples')
      expect(sorted[1].name).toBe('Mystery Item')
    })

    it('maintains original order for items with same category and name', () => {
      const duplicateItems = [
        {
          id: '1',
          name: 'Apples',
          quantity: 1,
          category: ItemCategory.PRODUCE,
          checked: false,
          addedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Apples',
          quantity: 2,
          category: ItemCategory.PRODUCE,
          checked: false,
          addedAt: new Date('2024-01-02'),
        },
      ]

      const sorted = sortItemsByCategory(duplicateItems)

      // Should maintain original order for same name/category
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
    })
  })

  describe('sortPantryItemsByCategory', () => {
    const mockPantryItems = [
      {
        id: '1',
        name: 'Chicken Breast',
        quantity: 2,
        unit: 'lbs',
        category: ItemCategory.MEAT,
        addedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Apples',
        quantity: 6,
        category: ItemCategory.PRODUCE,
        addedAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: ItemCategory.DAIRY,
        addedAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
      {
        id: '4',
        name: 'Bananas',
        quantity: 1,
        unit: 'bunch',
        category: ItemCategory.PRODUCE,
        addedAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
      },
      {
        id: '5',
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: ItemCategory.BAKERY,
        addedAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      },
    ]

    it('sorts pantry items by category order first', () => {
      const sorted = sortPantryItemsByCategory(mockPantryItems)

      // Should be: Produce (Apples, Bananas), Dairy (Milk), Meat (Chicken), Bakery (Bread)
      expect(sorted[0].category).toBe(ItemCategory.PRODUCE)
      expect(sorted[1].category).toBe(ItemCategory.PRODUCE)
      expect(sorted[2].category).toBe(ItemCategory.DAIRY)
      expect(sorted[3].category).toBe(ItemCategory.MEAT)
      expect(sorted[4].category).toBe(ItemCategory.BAKERY)
    })

    it('sorts pantry items alphabetically within each category', () => {
      const sorted = sortPantryItemsByCategory(mockPantryItems)

      // Within Produce category: Apples should come before Bananas
      const produceItems = sorted.filter(
        (item) => item.category === ItemCategory.PRODUCE
      )
      expect(produceItems[0].name).toBe('Apples')
      expect(produceItems[1].name).toBe('Bananas')
    })

    it('handles empty array', () => {
      const sorted = sortPantryItemsByCategory([])
      expect(sorted).toEqual([])
    })

    it('does not mutate original array', () => {
      const originalItems = [...mockPantryItems]
      sortPantryItemsByCategory(mockPantryItems)
      expect(mockPantryItems).toEqual(originalItems)
    })
  })

  describe('getMealOrder', () => {
    it('returns correct order for meal types', () => {
      expect(getMealOrder(MealType.BREAKFAST)).toBe(0)
      expect(getMealOrder(MealType.LUNCH)).toBe(1)
      expect(getMealOrder(MealType.DINNER)).toBe(2)
      expect(getMealOrder(MealType.SNACK)).toBe(3)
    })

    it('returns high number for no meal assignment', () => {
      expect(getMealOrder(undefined)).toBe(999)
    })

    it('returns high number for unknown meal types', () => {
      expect(getMealOrder('Unknown' as MealType)).toBe(999)
    })
  })

  describe('sortItemsByMealTime', () => {
    const mockMealItems = [
      {
        id: '1',
        name: 'Cereal',
        quantity: 1,
        unit: 'box',
        category: ItemCategory.PANTRY,
        mealType: MealType.BREAKFAST,
        checked: false,
        addedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Sandwich Bread',
        quantity: 1,
        unit: 'loaf',
        category: ItemCategory.BAKERY,
        mealType: MealType.LUNCH,
        checked: false,
        addedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        name: 'Chicken',
        quantity: 2,
        unit: 'lbs',
        category: ItemCategory.MEAT,
        mealType: MealType.DINNER,
        checked: false,
        addedAt: new Date('2024-01-03'),
      },
      {
        id: '4',
        name: 'Chips',
        quantity: 1,
        unit: 'bag',
        category: ItemCategory.SNACKS,
        mealType: MealType.SNACK,
        checked: false,
        addedAt: new Date('2024-01-04'),
      },
      {
        id: '5',
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: ItemCategory.DAIRY,
        mealType: undefined, // No meal assignment
        checked: false,
        addedAt: new Date('2024-01-05'),
      },
      {
        id: '6',
        name: 'Eggs',
        quantity: 12,
        category: ItemCategory.DAIRY,
        mealType: MealType.BREAKFAST,
        checked: false,
        addedAt: new Date('2024-01-06'),
      },
    ]

    it('sorts items by meal time order first', () => {
      const sorted = sortItemsByMealTime(mockMealItems)

      // Should be: Breakfast items, Lunch items, Dinner items, Snack items, No meal items
      expect(sorted[0].mealType).toBe(MealType.BREAKFAST)
      expect(sorted[1].mealType).toBe(MealType.BREAKFAST)
      expect(sorted[2].mealType).toBe(MealType.LUNCH)
      expect(sorted[3].mealType).toBe(MealType.DINNER)
      expect(sorted[4].mealType).toBe(MealType.SNACK)
      expect(sorted[5].mealType).toBeUndefined()
    })

    it('sorts items alphabetically within each meal type', () => {
      const sorted = sortItemsByMealTime(mockMealItems)

      // Within Breakfast: Cereal should come before Eggs
      const breakfastItems = sorted.filter(
        (item) => item.mealType === MealType.BREAKFAST
      )
      expect(breakfastItems[0].name).toBe('Cereal')
      expect(breakfastItems[1].name).toBe('Eggs')
    })

    it('handles empty array', () => {
      const sorted = sortItemsByMealTime([])
      expect(sorted).toEqual([])
    })

    it('handles items without meal types', () => {
      const itemsWithoutMealType = [
        {
          id: '1',
          name: 'Random Item',
          quantity: 1,
          category: ItemCategory.OTHER,
          mealType: undefined,
          checked: false,
          addedAt: new Date(),
        },
        {
          id: '2',
          name: 'Cereal',
          quantity: 1,
          category: ItemCategory.PANTRY,
          mealType: MealType.BREAKFAST,
          checked: false,
          addedAt: new Date(),
        },
      ]

      const sorted = sortItemsByMealTime(itemsWithoutMealType)

      // Breakfast should come first, undefined meal type should come last
      expect(sorted[0].name).toBe('Cereal')
      expect(sorted[1].name).toBe('Random Item')
    })

    it('maintains original order for items with same meal type and name', () => {
      const duplicateItems = [
        {
          id: '1',
          name: 'Cereal',
          quantity: 1,
          category: ItemCategory.PANTRY,
          mealType: MealType.BREAKFAST,
          checked: false,
          addedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Cereal',
          quantity: 2,
          category: ItemCategory.PANTRY,
          mealType: MealType.BREAKFAST,
          checked: false,
          addedAt: new Date('2024-01-02'),
        },
      ]

      const sorted = sortItemsByMealTime(duplicateItems)

      // Should maintain original order for same name/meal type
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
    })
  })

  describe('sortItemsByEntryOrder', () => {
    const mockTimestampItems = [
      {
        id: '1',
        name: 'Third Item',
        quantity: 1,
        category: ItemCategory.OTHER,
        checked: false,
        addedAt: new Date('2024-01-03T10:00:00Z'),
      },
      {
        id: '2',
        name: 'First Item',
        quantity: 1,
        category: ItemCategory.OTHER,
        checked: false,
        addedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '3',
        name: 'Second Item',
        quantity: 1,
        category: ItemCategory.OTHER,
        checked: false,
        addedAt: new Date('2024-01-02T10:00:00Z'),
      },
    ]

    it('sorts items by addedAt timestamp (earliest first)', () => {
      const sorted = sortItemsByEntryOrder(mockTimestampItems)

      // Should be ordered by addedAt timestamp
      expect(sorted[0].name).toBe('First Item')
      expect(sorted[1].name).toBe('Second Item')
      expect(sorted[2].name).toBe('Third Item')
    })

    it('handles empty array', () => {
      const sorted = sortItemsByEntryOrder([])
      expect(sorted).toEqual([])
    })

    it('handles items with same timestamp', () => {
      const sameTimestampItems = [
        {
          id: '1',
          name: 'Item A',
          quantity: 1,
          category: ItemCategory.OTHER,
          checked: false,
          addedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          name: 'Item B',
          quantity: 1,
          category: ItemCategory.OTHER,
          checked: false,
          addedAt: new Date('2024-01-01T10:00:00Z'),
        },
      ]

      const sorted = sortItemsByEntryOrder(sameTimestampItems)

      // Should maintain original order for same timestamp
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
    })

    it('sorts correctly with millisecond precision', () => {
      const preciseTimestampItems = [
        {
          id: '1',
          name: 'Later Item',
          quantity: 1,
          category: ItemCategory.OTHER,
          checked: false,
          addedAt: new Date('2024-01-01T10:00:00.500Z'),
        },
        {
          id: '2',
          name: 'Earlier Item',
          quantity: 1,
          category: ItemCategory.OTHER,
          checked: false,
          addedAt: new Date('2024-01-01T10:00:00.100Z'),
        },
      ]

      const sorted = sortItemsByEntryOrder(preciseTimestampItems)

      // Should sort by precise timestamp
      expect(sorted[0].name).toBe('Earlier Item')
      expect(sorted[1].name).toBe('Later Item')
    })
  })

  describe('normalizeIngredientsInput', () => {
    it('normalizes bulleted list with newlines', () => {
      const input = '1. Eggs\n- Milk\n* Bread\n• Butter'
      expect(normalizeIngredientsInput(input)).toBe('Eggs, Milk, Bread, Butter')
    })

    it('normalizes numbered list with newlines', () => {
      const input = '1. Pasta\n2. Tomato sauce\n3) Ground beef'
      expect(normalizeIngredientsInput(input)).toBe(
        'Pasta, Tomato sauce, Ground beef'
      )
    })

    it('handles comma-separated input without newlines', () => {
      const input = 'pasta, tomato sauce, ground beef'
      expect(normalizeIngredientsInput(input)).toBe(
        'pasta, tomato sauce, ground beef'
      )
    })

    it('handles newline-separated list without bullets', () => {
      const input = 'Chicken\nCarrots\nOnions\nCelery'
      expect(normalizeIngredientsInput(input)).toBe(
        'Chicken, Carrots, Onions, Celery'
      )
    })

    it('handles mixed commas and newlines', () => {
      const input = 'Eggs,\nMilk'
      expect(normalizeIngredientsInput(input)).toBe('Eggs, Milk')
    })

    it('handles empty string', () => {
      expect(normalizeIngredientsInput('')).toBe('')
    })

    it('handles whitespace-only string', () => {
      expect(normalizeIngredientsInput('   \n\n  ')).toBe('')
    })

    it('handles string with only bullets and numbers', () => {
      expect(normalizeIngredientsInput('- \n* \n1. ')).toBe('')
    })

    it('trims whitespace from each ingredient', () => {
      const input = '  Eggs  \n  Milk  \n  Bread  '
      expect(normalizeIngredientsInput(input)).toBe('Eggs, Milk, Bread')
    })

    it('handles numbered list with different formats', () => {
      const input = '1. First\n2) Second\n3 - Third'
      expect(normalizeIngredientsInput(input)).toBe('First, Second, Third')
    })

    it('handles bullet characters', () => {
      const input = '- Item 1\n* Item 2\n• Item 3'
      expect(normalizeIngredientsInput(input)).toBe('Item 1, Item 2, Item 3')
    })

    it('handles single ingredient', () => {
      expect(normalizeIngredientsInput('Eggs')).toBe('Eggs')
    })

    it('handles single ingredient with bullet', () => {
      expect(normalizeIngredientsInput('- Eggs')).toBe('Eggs')
    })

    it('handles single ingredient with number', () => {
      expect(normalizeIngredientsInput('1. Eggs')).toBe('Eggs')
    })

    it('preserves ingredient names with numbers in them', () => {
      const input = '2 cups flour\n1/2 cup sugar'
      expect(normalizeIngredientsInput(input)).toBe(
        '2 cups flour, 1/2 cup sugar'
      )
    })
  })

  describe('parseRecipeInstructions', () => {
    it('parses structured recipe with cook time and steps', () => {
      const notes = `Cook Time: 30 minutes

Step 1: Whisk 2 cups flour and 3 eggs together in a large bowl
Step 2: Fold in 1 cup spinach and 1/2 cup grated cheese
Step 3: Pour into greased pan and bake for 20 minutes at 375°F`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.cookTime).toBe('30 minutes')
      expect(result?.isStructured).toBe(true)
      expect(result?.steps).toHaveLength(3)
      expect(result?.steps[0]).toEqual({
        number: 1,
        instruction: 'Whisk 2 cups flour and 3 eggs together in a large bowl',
      })
      expect(result?.steps[1]).toEqual({
        number: 2,
        instruction: 'Fold in 1 cup spinach and 1/2 cup grated cheese',
      })
      expect(result?.steps[2]).toEqual({
        number: 3,
        instruction: 'Pour into greased pan and bake for 20 minutes at 375°F',
      })
    })

    it('parses cook time with hours', () => {
      const notes = `Cook Time: 1.5 hours

Step 1: Prepare ingredients`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.cookTime).toBe('1.5 hours')
      expect(result?.isStructured).toBe(true)
    })

    it('handles missing cook time but has steps', () => {
      const notes = `Step 1: Mix ingredients
Step 2: Bake for 30 minutes`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.cookTime).toBeUndefined()
      expect(result?.isStructured).toBe(true)
      expect(result?.steps).toHaveLength(2)
    })

    it('handles steps out of order and sorts them', () => {
      const notes = `Cook Time: 20 minutes

Step 3: Final step
Step 1: First step
Step 2: Second step`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.steps).toHaveLength(3)
      expect(result?.steps[0].number).toBe(1)
      expect(result?.steps[1].number).toBe(2)
      expect(result?.steps[2].number).toBe(3)
    })

    it('handles legacy plain text notes', () => {
      const notes = 'This is just a simple note without structured format'

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.isStructured).toBe(false)
      expect(result?.steps).toHaveLength(1)
      expect(result?.steps[0].number).toBe(1)
      expect(result?.steps[0].instruction).toBe(notes)
      expect(result?.cookTime).toBeUndefined()
    })

    it('handles empty string', () => {
      const result = parseRecipeInstructions('')
      expect(result).toBeNull()
    })

    it('handles undefined', () => {
      const result = parseRecipeInstructions(undefined)
      expect(result).toBeNull()
    })

    it('handles whitespace-only string', () => {
      const result = parseRecipeInstructions('   \n\n  ')
      expect(result).toBeNull()
    })

    it('handles multi-line step instructions', () => {
      const notes = `Cook Time: 45 minutes

Step 1: This is a step
that spans multiple lines
Step 2: Another step`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.steps).toHaveLength(2)
      expect(result?.steps[0].instruction).toContain('spans multiple lines')
    })

    it('handles case-insensitive cook time and step markers', () => {
      const notes = `cook time: 30 minutes

step 1: First instruction
STEP 2: Second instruction`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.cookTime).toBe('30 minutes')
      expect(result?.steps).toHaveLength(2)
    })

    it('handles malformed format with only cook time', () => {
      const notes = 'Cook Time: 30 minutes'

      const result = parseRecipeInstructions(notes)

      // Should fall back to legacy format
      expect(result).not.toBeNull()
      expect(result?.isStructured).toBe(false)
    })

    it('handles malformed format with only steps', () => {
      const notes = `Step 1: First step
Step 2: Second step`

      const result = parseRecipeInstructions(notes)

      expect(result).not.toBeNull()
      expect(result?.isStructured).toBe(true)
      expect(result?.cookTime).toBeUndefined()
      expect(result?.steps).toHaveLength(2)
    })
  })
})
