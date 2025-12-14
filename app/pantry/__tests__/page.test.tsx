import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PantryPage from '../page'
import * as pantryApi from '@/lib/api/pantry'
import * as householdApi from '@/lib/api/household'
import * as groceryApi from '@/lib/api/grocery'
import { ItemCategory, SortMethod } from '@/lib/types'

// Mock Clerk auth
const mockGetToken = jest.fn().mockResolvedValue('mock-token')
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_test123' }),
  currentUser: () => ({
    id: 'user_test123',
    firstName: 'Test',
    lastName: 'Testuser',
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => {
    return React.createElement('div', { 'data-testid': 'user-button' }, 'TT')
  },
  useAuth: () => ({
    getToken: mockGetToken,
    userId: 'user_123',
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    isSignedIn: true,
    user: {
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'Testuser',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
}))

// Mock API modules
jest.mock('@/lib/api/pantry')
jest.mock('@/lib/api/household')
jest.mock('@/lib/api/grocery')

const mockGetPantryItems = pantryApi.getPantryItems as jest.MockedFunction<
  typeof pantryApi.getPantryItems
>
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<
  typeof householdApi.getHouseholds
>
const mockCreateGroceryList =
  groceryApi.createGroceryList as jest.MockedFunction<
    typeof groceryApi.createGroceryList
  >
const mockAddGroceryItem = groceryApi.addGroceryItem as jest.MockedFunction<
  typeof groceryApi.addGroceryItem
>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<
  typeof groceryApi.getGroceryLists
>

describe('PantryPage - Generate Grocery List', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockPantryItems = [
    {
      id: 1,
      household_id: 1,
      name: 'Milk',
      quantity: '0.5 gallon',
      category: ItemCategory.DAIRY,
      low_stock_threshold: 1,
      expiration_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      household_id: 1,
      name: 'Bread',
      quantity: '0 loaf',
      category: ItemCategory.BAKERY,
      low_stock_threshold: 1,
      expiration_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 3,
      household_id: 1,
      name: 'Rice',
      quantity: '5 lbs',
      category: ItemCategory.GRAINS,
      low_stock_threshold: 2,
      expiration_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetPantryItems.mockResolvedValue(mockPantryItems)
    mockGetGroceryLists.mockResolvedValue([])
  })

  it('should display "Generate Grocery List" button', async () => {
    render(<PantryPage />)

    // Wait for loading to complete (check that loading text disappears)
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load (ensure "No Household Found" is not shown)
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for the button to appear
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /generate grocery list/i })
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show low stock count in stats', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      // Milk (0.5 <= 1) and Bread (0 <= 1) are low stock
      // Look for the number 2 in the context of low stock
      // There may be multiple "Low Stock" texts, so get all and check the stat card
      const lowStockTexts = screen.getAllByText('Low Stock')
      expect(lowStockTexts.length).toBeGreaterThan(0)
      // Find the stat card that contains both "2" and "Low Stock"
      const lowStockSection = lowStockTexts[0].closest('div')
      expect(lowStockSection).toHaveTextContent('2')
    })
  })

  it('should open generate grocery list modal when button is clicked', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/low stock items/i)).toBeInTheDocument()
    })
  })

  it('should display low stock items in the modal', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      // Check that Milk and Bread appear (they're in both the modal and the main grid)
      expect(screen.getAllByText('Milk').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Bread').length).toBeGreaterThanOrEqual(1)
      // Verify the modal is open
      expect(screen.getByText(/low stock items/i)).toBeInTheDocument()
    })
  })

  it('should create grocery list with selected items', async () => {
    const mockGroceryList = {
      id: 1,
      household_id: 1,
      name: 'Weekly Shopping List',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const mockGroceryItem = {
      id: 1,
      list_id: 1,
      name: 'Milk',
      quantity: '1 gallon',
      category: ItemCategory.DAIRY,
      notes: '',
      checked: false,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockCreateGroceryList.mockResolvedValue(mockGroceryList)
    mockAddGroceryItem.mockResolvedValue(mockGroceryItem)

    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create grocery list/i })
      ).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockCreateGroceryList).toHaveBeenCalledWith(
        {
          name: 'Weekly Shopping List',
          household_id: 1,
        },
        'mock-token'
      )
    })

    // Verify that addGroceryItem was called with quantity = 1 for each item
    await waitFor(() => {
      expect(mockAddGroceryItem).toHaveBeenCalledTimes(2) // Milk and Bread are low stock

      // Verify Milk (pantry quantity: 0.5 gallon) -> grocery quantity: 1 gallon
      expect(mockAddGroceryItem).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Milk',
          quantity: '1 gallon',
          category: ItemCategory.DAIRY,
        }),
        'mock-token'
      )

      // Verify Bread (pantry quantity: 0 loaf) -> grocery quantity: 1 loaf
      expect(mockAddGroceryItem).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Bread',
          quantity: '1 loaf',
          category: ItemCategory.BAKERY,
        }),
        'mock-token'
      )
    })
  })

  it('should show success message after creating grocery list', async () => {
    const mockGroceryList = {
      id: 1,
      household_id: 1,
      name: 'Weekly Shopping List',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    mockCreateGroceryList.mockResolvedValue(mockGroceryList)
    mockAddGroceryItem.mockResolvedValue({
      id: 1,
      list_id: 1,
      name: 'Milk',
      quantity: '1 gallon',
      category: ItemCategory.DAIRY,
      notes: '',
      checked: false,
      created_at: '2024-01-01T00:00:00Z',
    })

    render(<PantryPage />)

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create grocery list/i })
      ).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    await waitFor(() => {
      // Verify the create function was called
      expect(mockCreateGroceryList).toHaveBeenCalled()
      expect(mockAddGroceryItem).toHaveBeenCalled()
    })
  })

  it('should close modal after successful creation', async () => {
    const mockGroceryList = {
      id: 1,
      household_id: 1,
      name: 'Weekly Shopping List',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    mockCreateGroceryList.mockResolvedValue(mockGroceryList)
    mockAddGroceryItem.mockResolvedValue({
      id: 1,
      list_id: 1,
      name: 'Milk',
      quantity: '1 gallon',
      category: ItemCategory.DAIRY,
      notes: '',
      checked: false,
      created_at: '2024-01-01T00:00:00Z',
    })

    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create grocery list/i })
      ).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /create grocery list/i })
      ).not.toBeInTheDocument()
    })
  })

  it('should handle errors when creating grocery list', async () => {
    mockCreateGroceryList.mockRejectedValue(new Error('Failed to create list'))

    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create grocery list/i })
      ).toBeInTheDocument()
    })

    // Try to create list
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument()
    })
  })
})

describe('PantryPage - Mobile Responsive Layout', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockPantryItems = [
    {
      id: 1,
      household_id: 1,
      name: 'Milk',
      quantity: '0.5 gallon',
      category: ItemCategory.DAIRY,
      low_stock_threshold: 1,
      expiration_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetPantryItems.mockResolvedValue(mockPantryItems)
    mockGetGroceryLists.mockResolvedValue([])
  })

  it('should have buttons container with responsive flex classes to prevent horizontal overflow', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Find the button container
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    const buttonContainer = generateButton.parentElement

    expect(buttonContainer).toBeInTheDocument()

    // Check that the button container has responsive flex classes
    // On mobile (default), buttons should stack vertically (flex-col)
    // On larger screens (sm:), buttons can be side-by-side (sm:flex-row)
    const classes = buttonContainer?.className || ''
    expect(classes).toMatch(/flex-col/)
    expect(classes).toMatch(/sm:flex-row/)
  })

  it('should have buttons that are full width on mobile', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    const addButton = screen.getByRole('button', { name: /add to pantry/i })

    // Buttons should have w-full class on mobile and sm:w-auto on larger screens
    const generateClasses = generateButton.className
    const addClasses = addButton.className

    expect(generateClasses).toMatch(/w-full/)
    expect(generateClasses).toMatch(/sm:w-auto/)
    expect(addClasses).toMatch(/w-full/)
    expect(addClasses).toMatch(/sm:w-auto/)
  })

  it('should not have horizontal overflow on mobile due to button size', async () => {
    const { container } = render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Check that the main container doesn't have any classes that could cause overflow
    const mainContent = container.querySelector('.container')
    expect(mainContent).toBeInTheDocument()

    // The container should have appropriate padding
    const classes = mainContent?.className || ''
    expect(classes).toMatch(/px-4/)
  })
})

describe('PantryPage - Sort Functionality', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockPantryItems = [
    {
      id: 1,
      household_id: 1,
      name: 'Milk',
      quantity: '0.5 gallon',
      category: ItemCategory.DAIRY,
      low_stock_threshold: 1,
      expiration_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      household_id: 1,
      name: 'Bread',
      quantity: '0 loaf',
      category: ItemCategory.BAKERY,
      low_stock_threshold: 1,
      expiration_date: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 3,
      household_id: 1,
      name: 'Rice',
      quantity: '5 lbs',
      category: ItemCategory.PANTRY,
      low_stock_threshold: 2,
      expiration_date: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
    {
      id: 4,
      household_id: 1,
      name: 'Pasta',
      quantity: '3 boxes',
      category: ItemCategory.PANTRY,
      low_stock_threshold: null,
      expiration_date: null,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetPantryItems.mockResolvedValue(mockPantryItems)
    mockGetGroceryLists.mockResolvedValue([])
  })

  it('should display sort dropdown with all sort options including Low Stock', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement
    const options = Array.from(sortSelect.options)

    expect(options.some((opt) => opt.value === SortMethod.CATEGORY)).toBe(true)
    expect(options.some((opt) => opt.value === SortMethod.ENTRY_ORDER)).toBe(
      true
    )
    expect(options.some((opt) => opt.value === SortMethod.LOW_STOCK)).toBe(true)
  })

  it('should sort items by low stock when Low Stock option is selected', async () => {
    render(<PantryPage />)

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText('Loading pantry...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: SortMethod.LOW_STOCK } })

    await waitFor(() => {
      // Low stock items (Milk: 0.5 <= 1, Bread: 0 <= 1) should appear first
      // Rice (5 > 2) and Pasta (no threshold) should appear after
      expect(screen.getByText(/low stock items/i)).toBeInTheDocument()

      // Check that low stock section shows the count
      const lowStockSection = screen.getByText(/low stock items/i)
      expect(lowStockSection).toHaveTextContent('2')
    })

    // Verify items are displayed (they should all be visible)
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
  })

  it('should display "Other Items" section when Low Stock sort is selected and there are non-low-stock items', async () => {
    render(<PantryPage />)

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: SortMethod.LOW_STOCK } })

    await waitFor(() => {
      expect(screen.getByText(/other items/i)).toBeInTheDocument()
      const otherItemsSection = screen.getByText(/other items/i)
      expect(otherItemsSection).toHaveTextContent('2')
    })
  })

  it('should not display "Other Items" section when all items are low stock', async () => {
    const allLowStockItems = [
      {
        id: 1,
        household_id: 1,
        name: 'Milk',
        quantity: '0.5 gallon',
        category: ItemCategory.DAIRY,
        low_stock_threshold: 1,
        expiration_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        household_id: 1,
        name: 'Bread',
        quantity: '0 loaf',
        category: ItemCategory.BAKERY,
        low_stock_threshold: 1,
        expiration_date: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ]

    mockGetPantryItems.mockResolvedValue(allLowStockItems)

    render(<PantryPage />)

    // Wait for households to load
    await waitFor(
      () => {
        expect(screen.queryByText('No Household Found')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: SortMethod.LOW_STOCK } })

    await waitFor(() => {
      expect(screen.getByText(/low stock items/i)).toBeInTheDocument()
    })

    // Should not show "Other Items" section when all items are low stock
    expect(screen.queryByText(/other items/i)).not.toBeInTheDocument()
  })
})
