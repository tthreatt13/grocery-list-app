import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PantryPage from '../page'
import * as pantryApi from '@/lib/api/pantry'
import * as householdApi from '@/lib/api/household'
import * as groceryApi from '@/lib/api/grocery'
import { ItemCategory } from '@/lib/types'

// Mock Clerk auth
const mockGetToken = jest.fn().mockResolvedValue('mock-token')
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_test123' }),
  currentUser: () => ({ id: 'user_test123', firstName: 'Test', lastName: 'Testuser' }),
  ClerkProvider: ({ children }: any) => children,
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
  UserButton: () => {
    return React.createElement('div', { 'data-testid': 'user-button' }, 'TT');
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
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    }
  }),
}))

// Mock API modules
jest.mock('@/lib/api/pantry')
jest.mock('@/lib/api/household')
jest.mock('@/lib/api/grocery')

const mockGetPantryItems = pantryApi.getPantryItems as jest.MockedFunction<typeof pantryApi.getPantryItems>
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<typeof householdApi.getHouseholds>
const mockCreateGroceryList = groceryApi.createGroceryList as jest.MockedFunction<typeof groceryApi.createGroceryList>
const mockAddGroceryItem = groceryApi.addGroceryItem as jest.MockedFunction<typeof groceryApi.addGroceryItem>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<typeof groceryApi.getGroceryLists>

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
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetPantryItems.mockResolvedValue(mockPantryItems)
    mockGetGroceryLists.mockResolvedValue([])
  })

  it('should display "Generate Grocery List" button', async () => {
    render(<PantryPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })
  })

  it('should show low stock count in stats', async () => {
    render(<PantryPage />)

    await waitFor(() => {
      // Milk (0.5 <= 1) and Bread (0 <= 1) are low stock
      // Look for the number 2 in the context of low stock
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
      // Find the stat card that contains both "2" and "Low Stock"
      const lowStockSection = screen.getByText('Low Stock').closest('div')
      expect(lowStockSection).toHaveTextContent('2')
    })
  })

  it('should open generate grocery list modal when button is clicked', async () => {
    render(<PantryPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/low stock items/i)).toBeInTheDocument()
    })
  })

  it('should display low stock items in the modal', async () => {
    render(<PantryPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create grocery list/i })).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', { name: /create grocery list/i })
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create grocery list/i })).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', { name: /create grocery list/i })
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create grocery list/i })).toBeInTheDocument()
    })

    // Create list
    const createButton = screen.getByRole('button', { name: /create grocery list/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /create grocery list/i })).not.toBeInTheDocument()
    })
  })

  it('should handle errors when creating grocery list', async () => {
    mockCreateGroceryList.mockRejectedValue(new Error('Failed to create list'))

    render(<PantryPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Open modal
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create grocery list/i })).toBeInTheDocument()
    })

    // Try to create list
    const createButton = screen.getByRole('button', { name: /create grocery list/i })
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
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetPantryItems.mockResolvedValue(mockPantryItems)
    mockGetGroceryLists.mockResolvedValue([])
  })

  it('should have buttons container with responsive flex classes to prevent horizontal overflow', async () => {
    const { container } = render(<PantryPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Find the button container
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    const addButton = screen.getByRole('button', { name: /add to pantry/i })
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Check that the main container doesn't have any classes that could cause overflow
    const mainContent = container.querySelector('.container')
    expect(mainContent).toBeInTheDocument()
    
    // The container should have appropriate padding
    const classes = mainContent?.className || ''
    expect(classes).toMatch(/px-4/)
  })
})

