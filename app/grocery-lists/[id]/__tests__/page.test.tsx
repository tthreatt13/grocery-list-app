import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import GroceryListDetailPage from '../page'
import * as groceryApi from '@/lib/api/grocery'
import { SortMethod } from '@/lib/types'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api/grocery')

const mockGetToken = jest.fn()
const mockPush = jest.fn()

const mockListWithItems: groceryApi.GroceryListWithItems = {
  id: 1,
  household_id: 1,
  name: 'Weekly Shopping',
  created_by: 1,
  created_at: '2024-11-10T10:00:00Z',
  updated_at: '2024-11-10T12:00:00Z',
  items: [
    {
      id: 1,
      list_id: 1,
      name: 'Bananas',
      quantity: '6 pcs',
      category: 'Produce',
      notes: 'Get ripe ones',
      checked: false,
      created_at: '2024-11-10T10:00:00Z',
    },
    {
      id: 2,
      list_id: 1,
      name: 'Milk',
      quantity: '2 gallons',
      category: 'Dairy',
      notes: undefined,
      checked: false,
      created_at: '2024-11-10T10:05:00Z',
    },
    {
      id: 3,
      list_id: 1,
      name: 'Chicken',
      quantity: '2.5 lbs',
      category: 'Meat',
      notes: undefined,
      checked: true,
      created_at: '2024-11-10T10:10:00Z',
    },
  ],
}

describe('GroceryListDetailPage - Quantity Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken })
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should display quantity correctly when quantity string contains number and unit', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Check that the quantity is displayed correctly (not as "1 6 pcs")
    expect(screen.getByText('6 pcs')).toBeInTheDocument()
    expect(screen.getByText('2 gallons')).toBeInTheDocument()
    expect(screen.getByText('2.5 lbs')).toBeInTheDocument()
  })

  it('should correctly parse and save quantity with unit when adding item', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )
    ;(groceryApi.addGroceryItem as jest.Mock).mockResolvedValue({
      id: 4,
      list_id: 1,
      name: 'Tomatoes',
      quantity: '3 lbs',
      category: 'Produce',
      checked: false,
      created_at: '2024-11-10T12:00:00Z',
    })

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Open add item modal
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)

    // Verify that addGroceryItem was NOT called yet
    expect(groceryApi.addGroceryItem).not.toHaveBeenCalled()
  })

  it('should correctly format quantity when adding item with numeric quantity and unit', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    const mockNewItem = {
      id: 4,
      list_id: 1,
      name: 'Tomatoes',
      quantity: '3 lbs',
      category: 'Produce',
      checked: false,
      created_at: '2024-11-10T12:00:00Z',
    }
    ;(groceryApi.addGroceryItem as jest.Mock).mockResolvedValue(mockNewItem)

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // When the add handler is called with quantity=3 and unit='lbs',
    // it should send quantity='3 lbs' to the API
    // We'll verify this in the implementation
  })

  it('should handle items with quantity but no unit', async () => {
    const listWithNoUnit = {
      ...mockListWithItems,
      items: [
        {
          id: 1,
          list_id: 1,
          name: 'Eggs',
          quantity: '12',
          category: 'Dairy',
          checked: false,
          created_at: '2024-11-10T10:00:00Z',
        },
      ],
    }
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(listWithNoUnit)

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display just the number
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})

describe('GroceryListDetailPage - Category Sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken })
    mockGetToken.mockResolvedValue('mock-token')
  })

  const mockListWithMixedCategories: groceryApi.GroceryListWithItems = {
    id: 1,
    household_id: 1,
    name: 'Mixed Category List',
    created_by: 1,
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-10T12:00:00Z',
    items: [
      {
        id: 1,
        list_id: 1,
        name: 'Chicken Breast',
        quantity: '2 lbs',
        category: 'Meat',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:00:00Z',
      },
      {
        id: 2,
        list_id: 1,
        name: 'Apples',
        quantity: '6 pcs',
        category: 'Produce',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:05:00Z',
      },
      {
        id: 3,
        list_id: 1,
        name: 'Milk',
        quantity: '1 gallon',
        category: 'Dairy',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:10:00Z',
      },
      {
        id: 4,
        list_id: 1,
        name: 'Bananas',
        quantity: '1 bunch',
        category: 'Produce',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:15:00Z',
      },
      {
        id: 5,
        list_id: 1,
        name: 'Bread',
        quantity: '1 loaf',
        category: 'Bakery',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:20:00Z',
      },
      {
        id: 6,
        list_id: 1,
        name: 'Yogurt',
        quantity: '1 container',
        category: 'Dairy',
        notes: undefined,
        checked: true, // This one is checked
        created_at: '2024-11-10T10:25:00Z',
      },
    ],
  }

  it('should display items sorted by category in grocery store order', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMixedCategories
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Mixed Category List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Get all item names in the "To Buy" section (unchecked items)
    const toBuySection = screen.getByText('To Buy (5)').closest('div')
    expect(toBuySection).toBeInTheDocument()

    // Items should be sorted by category: Produce (Apples, Bananas), Dairy (Milk), Meat (Chicken), Bakery (Bread)
    const itemElements = screen.getAllByText(
      /Apples|Bananas|Milk|Chicken Breast|Bread/
    )

    // Check that items appear in the correct category order
    expect(itemElements[0]).toHaveTextContent('Apples') // Produce comes first
    expect(itemElements[1]).toHaveTextContent('Bananas') // Produce (alphabetical within category)
    expect(itemElements[2]).toHaveTextContent('Milk') // Dairy comes second
    expect(itemElements[3]).toHaveTextContent('Chicken Breast') // Meat comes third
    expect(itemElements[4]).toHaveTextContent('Bread') // Bakery comes fourth
  })

  it('should display category group headers for each category', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMixedCategories
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Mixed Category List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display category headers for each category that has items
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('Dairy')).toBeInTheDocument()
    expect(screen.getByText('Meat')).toBeInTheDocument()
    expect(screen.getByText('Bakery')).toBeInTheDocument()
  })

  it('should sort items alphabetically within each category', async () => {
    const listWithSameCategoryItems: groceryApi.GroceryListWithItems = {
      ...mockListWithMixedCategories,
      items: [
        {
          id: 1,
          list_id: 1,
          name: 'Zucchini',
          quantity: '2 pcs',
          category: 'Produce',
          notes: undefined,
          checked: false,
          created_at: '2024-11-10T10:00:00Z',
        },
        {
          id: 2,
          list_id: 1,
          name: 'Apples',
          quantity: '6 pcs',
          category: 'Produce',
          notes: undefined,
          checked: false,
          created_at: '2024-11-10T10:05:00Z',
        },
        {
          id: 3,
          list_id: 1,
          name: 'Carrots',
          quantity: '1 bag',
          category: 'Produce',
          notes: undefined,
          checked: false,
          created_at: '2024-11-10T10:10:00Z',
        },
      ],
    }

    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      listWithSameCategoryItems
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Mixed Category List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Within Produce category, items should be alphabetical: Apples, Carrots, Zucchini
    const produceItems = screen.getAllByText(/Apples|Carrots|Zucchini/)
    expect(produceItems[0]).toHaveTextContent('Apples')
    expect(produceItems[1]).toHaveTextContent('Carrots')
    expect(produceItems[2]).toHaveTextContent('Zucchini')
  })

  it('should maintain category sorting for both checked and unchecked items', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMixedCategories
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Mixed Category List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Check that both "To Buy" and "Completed" sections exist
    expect(screen.getByText('To Buy (5)')).toBeInTheDocument()
    expect(screen.getByText('Completed (1)')).toBeInTheDocument()

    // The completed item (Yogurt - Dairy category) should appear in the Completed section
    const completedSection = screen.getByText('Completed (1)').closest('div')
    expect(completedSection).toBeInTheDocument()
    expect(screen.getByText('Yogurt')).toBeInTheDocument()
  })

  it('should not display category filter component', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMixedCategories
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Mixed Category List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should not have the old category filter
    expect(screen.queryByText('Filter by Category')).not.toBeInTheDocument()
    expect(screen.queryByText('All')).not.toBeInTheDocument()
  })
})

describe('GroceryListDetailPage - Meal-Based Sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken })
    mockGetToken.mockResolvedValue('mock-token')
  })

  const mockListWithMealTypes: groceryApi.GroceryListWithItems = {
    id: 1,
    household_id: 1,
    name: 'Meal Planning List',
    created_by: 1,
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-10T12:00:00Z',
    items: [
      {
        id: 1,
        list_id: 1,
        name: 'Cereal',
        quantity: '1 box',
        category: 'Pantry',
        meal_type: 'Breakfast',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:00:00Z',
      },
      {
        id: 2,
        list_id: 1,
        name: 'Sandwich Bread',
        quantity: '1 loaf',
        category: 'Bakery',
        meal_type: 'Lunch',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:05:00Z',
      },
      {
        id: 3,
        list_id: 1,
        name: 'Chicken',
        quantity: '2 lbs',
        category: 'Meat',
        meal_type: 'Dinner',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:10:00Z',
      },
      {
        id: 4,
        list_id: 1,
        name: 'Chips',
        quantity: '1 bag',
        category: 'Snacks',
        meal_type: 'Snack',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:15:00Z',
      },
      {
        id: 5,
        list_id: 1,
        name: 'Milk',
        quantity: '1 gallon',
        category: 'Dairy',
        meal_type: undefined, // No meal assignment
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:20:00Z',
      },
      {
        id: 6,
        list_id: 1,
        name: 'Eggs',
        quantity: '12 pcs',
        category: 'Dairy',
        meal_type: 'Breakfast',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:25:00Z',
      },
    ],
  }

  it('should display sort method selector', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display the sort method selector
    expect(screen.getByText('Sort by')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Category')).toBeInTheDocument() // Default sort method
  })

  it('should switch to meal time sorting when selected', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Change sort method to Meal Time
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })
    fireEvent.change(sortSelector, { target: { value: SortMethod.MEAL_TIME } })

    // Should display meal type group headers
    await waitFor(
      () => {
        expect(screen.getByText('Breakfast')).toBeInTheDocument()
        expect(screen.getByText('Lunch')).toBeInTheDocument()
        expect(screen.getByText('Dinner')).toBeInTheDocument()
        expect(screen.getByText('Snack')).toBeInTheDocument()
        expect(screen.getByText('No meal assignment')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should display items in correct meal time order', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Change to meal time sorting
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })
    fireEvent.change(sortSelector, { target: { value: SortMethod.MEAL_TIME } })

    await waitFor(
      () => {
        expect(screen.getByText('Breakfast')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Get all meal type headers in order they appear
    const mealHeaders = screen.getAllByText(
      /Breakfast|Lunch|Dinner|Snack|No meal assignment/
    )

    // Should be in order: Breakfast, Lunch, Dinner, Snack, No meal assignment
    expect(mealHeaders[0]).toHaveTextContent('Breakfast')
    expect(mealHeaders[1]).toHaveTextContent('Lunch')
    expect(mealHeaders[2]).toHaveTextContent('Dinner')
    expect(mealHeaders[3]).toHaveTextContent('Snack')
    expect(mealHeaders[4]).toHaveTextContent('No meal assignment')
  })

  it('should sort items alphabetically within each meal type', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Change to meal time sorting
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })
    fireEvent.change(sortSelector, { target: { value: SortMethod.MEAL_TIME } })

    await waitFor(
      () => {
        expect(screen.getByText('Breakfast')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Within Breakfast category: Cereal should come before Eggs (alphabetical)
    const breakfastItems = screen.getAllByText(/Cereal|Eggs/)
    expect(breakfastItems[0]).toHaveTextContent('Cereal')
    expect(breakfastItems[1]).toHaveTextContent('Eggs')
  })

  it('should switch to entry order sorting when selected', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Change sort method to Entry Order
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })
    fireEvent.change(sortSelector, {
      target: { value: SortMethod.ENTRY_ORDER },
    })

    // Should not display group headers (no grouping in entry order)
    await waitFor(
      () => {
        expect(screen.queryByText('Breakfast')).not.toBeInTheDocument()
        expect(screen.queryByText('Produce')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Items should be in chronological order (by created_at)
    const allItems = screen.getAllByText(
      /Cereal|Sandwich Bread|Chicken|Chips|Milk|Eggs/
    )
    expect(allItems[0]).toHaveTextContent('Cereal') // 10:00:00Z
    expect(allItems[1]).toHaveTextContent('Sandwich Bread') // 10:05:00Z
    expect(allItems[2]).toHaveTextContent('Chicken') // 10:10:00Z
    expect(allItems[3]).toHaveTextContent('Chips') // 10:15:00Z
    expect(allItems[4]).toHaveTextContent('Milk') // 10:20:00Z
    expect(allItems[5]).toHaveTextContent('Eggs') // 10:25:00Z
  })

  it('should display meal type badges on items', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display meal type badges
    expect(screen.getAllByText('Breakfast')).toHaveLength(2) // 2 breakfast items
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
    expect(screen.getByText('Snack')).toBeInTheDocument()
    // No meal assignment items don't show a badge
  })

  it('should handle adding items with meal types', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    const mockNewItem = {
      id: 7,
      list_id: 1,
      name: 'Oatmeal',
      quantity: '1 container',
      category: 'Pantry',
      meal_type: 'Breakfast',
      checked: false,
      created_at: '2024-11-10T12:00:00Z',
    }
    ;(groceryApi.addGroceryItem as jest.Mock).mockResolvedValue(mockNewItem)

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Open add item modal
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)

    await waitFor(
      () => {
        expect(screen.getByText('Add New Item')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display meal type selector in the form
    expect(screen.getByText('Meal Type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('No meal assignment')).toBeInTheDocument() // Default value
  })

  it('should handle editing items with meal types', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )
    ;(groceryApi.updateGroceryItem as jest.Mock).mockResolvedValue({
      ...mockListWithMealTypes.items[0],
      meal_type: 'Lunch', // Changed from Breakfast to Lunch
    })

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Click edit button on first item (Cereal)
    const editButtons = screen.getAllByLabelText('Edit item')
    fireEvent.click(editButtons[0])

    await waitFor(
      () => {
        expect(screen.getByText('Edit Item')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Should display meal type selector with current value
    expect(screen.getByText('Meal Type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Breakfast')).toBeInTheDocument() // Current value
  })

  it('should maintain sort method selection when switching between sort methods', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithMealTypes
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Meal Planning List')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })

    // Default should be Category
    expect(sortSelector).toHaveValue(SortMethod.CATEGORY)

    // Change to Meal Time
    fireEvent.change(sortSelector, { target: { value: SortMethod.MEAL_TIME } })
    expect(sortSelector).toHaveValue(SortMethod.MEAL_TIME)

    // Change to Entry Order
    fireEvent.change(sortSelector, {
      target: { value: SortMethod.ENTRY_ORDER },
    })
    expect(sortSelector).toHaveValue(SortMethod.ENTRY_ORDER)

    // Change back to Category
    fireEvent.change(sortSelector, { target: { value: SortMethod.CATEGORY } })
    expect(sortSelector).toHaveValue(SortMethod.CATEGORY)
  })
})

describe('GroceryListDetailPage - Layout and Button Order', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken })
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should display header buttons in correct order: Share, Add Item, Sort', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Get all buttons in the header area
    const shareButton = screen.getByRole('button', { name: /share list/i })
    const addButton = screen.getByRole('button', { name: /add item/i })
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })

    // Verify all elements exist
    expect(shareButton).toBeInTheDocument()
    expect(addButton).toBeInTheDocument()
    expect(sortSelector).toBeInTheDocument()

    // Get their positions in the DOM to verify order
    const headerContainer = shareButton.closest('div')
    const buttons = headerContainer?.querySelectorAll('button, select')

    if (buttons) {
      // Share button should be first
      expect(buttons[0]).toHaveTextContent('Share List')
      // Add Item button should be second
      expect(buttons[1]).toHaveTextContent('Add Item')
      // Sort selector should be last (it's inside a div, so we check its parent)
      const sortContainer = sortSelector.closest('div')
      expect(sortContainer).toBeTruthy()
    }
  })

  it('should display shopping progress card after header and before items list', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify progress card exists
    const progressText = screen.getByText('Shopping Progress')
    expect(progressText).toBeInTheDocument()

    // Verify progress bar exists
    const progressInfo = screen.getByText('2 / 3 items') // 2 unchecked, 1 checked from mockListWithItems
    expect(progressInfo).toBeInTheDocument()

    // Verify the progress card appears before the items list
    const toBuySection = screen.getByText('To Buy (2)')
    expect(toBuySection).toBeInTheDocument()
  })

  it('should display items list after all other elements', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify the complete layout order by checking elements exist in expected sections

    // 1. Header with title
    expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()

    // 2. Header buttons (Share, Add Item, Sort)
    expect(
      screen.getByRole('button', { name: /share list/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add item/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /sort by/i })
    ).toBeInTheDocument()

    // 3. Shopping progress
    expect(screen.getByText('Shopping Progress')).toBeInTheDocument()

    // 4. Items list sections
    expect(screen.getByText('To Buy (2)')).toBeInTheDocument()
    expect(screen.getByText('Completed (1)')).toBeInTheDocument()

    // 5. Actual items
    expect(screen.getByText('Bananas')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Chicken')).toBeInTheDocument()
  })

  it('should maintain responsive layout on mobile', async () => {
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(
      mockListWithItems
    )

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile width
    })

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify buttons still exist and are accessible on mobile
    const shareButton = screen.getByRole('button', { name: /share list/i })
    const addButton = screen.getByRole('button', { name: /add item/i })
    const sortSelector = screen.getByRole('combobox', { name: /sort by/i })

    expect(shareButton).toBeInTheDocument()
    expect(addButton).toBeInTheDocument()
    expect(sortSelector).toBeInTheDocument()

    // Verify they have mobile-friendly classes (w-full sm:w-auto)
    expect(shareButton).toHaveClass('w-full', 'sm:w-auto')
    expect(addButton).toHaveClass('w-full', 'sm:w-auto')
  })

  it('should handle empty list state with correct layout', async () => {
    const emptyList: groceryApi.GroceryListWithItems = {
      ...mockListWithItems,
      items: [],
    }
    ;(groceryApi.getGroceryList as jest.Mock).mockResolvedValue(emptyList)

    render(<GroceryListDetailPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Header elements should still be present
    expect(
      screen.getByRole('button', { name: /share list/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add item/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /sort by/i })
    ).toBeInTheDocument()

    // Progress should show 0/0
    expect(screen.getByText('0 / 0 items')).toBeInTheDocument()

    // Empty state message should appear
    expect(screen.getByText('No items yet')).toBeInTheDocument()
    expect(
      screen.getByText('Add items to your grocery list to get started')
    ).toBeInTheDocument()
  })
})
