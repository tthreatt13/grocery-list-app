import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MealPlannerPage from '../page'
import * as mealsApi from '@/lib/api/meals'
import * as householdApi from '@/lib/api/household'
import * as groceryApi from '@/lib/api/grocery'
import * as clientApi from '@/lib/api/client'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    userId: 'user_123',
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    user: {
      id: 'user_123',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
    },
  }),
}))

// Mock API modules
jest.mock('@/lib/api/meals')
jest.mock('@/lib/api/household')
jest.mock('@/lib/api/grocery')
jest.mock('@/lib/api/client')

const mockGetWeeklyMeals = mealsApi.getWeeklyMeals as jest.MockedFunction<typeof mealsApi.getWeeklyMeals>
const mockGenerateGroceryList = mealsApi.generateGroceryList as jest.MockedFunction<typeof mealsApi.generateGroceryList>
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<typeof householdApi.getHouseholds>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<typeof groceryApi.getGroceryLists>
const mockSyncUser = clientApi.syncUser as jest.MockedFunction<typeof clientApi.syncUser>

describe('MealPlannerPage - Generate List Button', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsResponse = {
    meals: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsResponse)
    mockGetGroceryLists.mockResolvedValue([])
    mockGenerateGroceryList.mockResolvedValue({
      grocery_list_id: 1,
      items_count: 5,
      message: 'Successfully generated grocery list with 5 items from 3 meals'
    })
    mockSyncUser.mockResolvedValue(undefined)
  })

  it('should have Generate List button with text-base size (same as other primary buttons)', async () => {
    render(<MealPlannerPage />)

    await waitFor(() => {
      // Find the desktop "Generate Grocery List" button
      const desktopButton = screen.getByRole('button', { name: /generate grocery list/i })
      expect(desktopButton).toBeInTheDocument()
      
      // Check that it has text-base class (from size="md" or default)
      // The button should NOT have text-sm class (which comes from size="sm")
      expect(desktopButton).toHaveClass('text-base')
      expect(desktopButton).not.toHaveClass('text-sm')
    })
  })

  it('should have mobile Generate List button with text-base size (same as other primary buttons)', async () => {
    // Mock window.matchMedia to simulate mobile view
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    render(<MealPlannerPage />)

    await waitFor(() => {
      // Find the mobile "Generate List" button
      const mobileButton = screen.getByRole('button', { name: /generate list/i })
      expect(mobileButton).toBeInTheDocument()
      
      // Check that it has text-base class (should match other primary buttons)
      // The button should NOT have text-sm class (which comes from size="sm")
      expect(mobileButton).toHaveClass('text-base')
      expect(mobileButton).not.toHaveClass('text-sm')
    })
  })
})

describe('MealPlannerPage - Meal Type Functionality', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsWithIngredients = {
    meals: [
      {
        id: 1,
        household_id: 1,
        name: 'Pancakes',
        meal_type: 'breakfast' as const,
        day_of_week: 0,
        week_start_date: '2024-01-01',
        ingredients: 'flour, eggs, milk, butter',
        notes: 'Kids favorite',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        household_id: 1,
        name: 'Spaghetti',
        meal_type: 'dinner' as const,
        day_of_week: 0,
        week_start_date: '2024-01-01',
        ingredients: 'pasta, ground beef, tomato sauce',
        notes: 'Family dinner',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsWithIngredients)
    mockGetGroceryLists.mockResolvedValue([])
    mockGenerateGroceryList.mockResolvedValue({
      grocery_list_id: 1,
      items_count: 7,
      message: 'Successfully generated grocery list with 7 items from 2 meals'
    })
    mockSyncUser.mockResolvedValue(undefined)
  })

  it('should call generateGroceryList API with correct parameters when creating grocery list', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/generate grocery list/i)).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByDisplayValue(/weekly meal plan/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button
    const createButton = screen.getByRole('button', { name: /create list/i })
    fireEvent.click(createButton)

    // Verify generateGroceryList was called with correct parameters
    await waitFor(() => {
      expect(mockGenerateGroceryList).toHaveBeenCalledWith(
        expect.objectContaining({
          household_id: 1,
          grocery_list_name: 'Test Meal List',
          week_start_date: expect.any(String),
        }),
        'mock-token'
      )
    })
  })

  it('should display success message after generating grocery list', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    
    // Mock window.alert
    const mockAlert = jest.fn()
    window.alert = mockAlert

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/generate grocery list from meals/i)).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button
    const createButton = screen.getByRole('button', { name: /create list/i })
    fireEvent.click(createButton)

    // Verify success message is shown
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Successfully generated grocery list with 7 items from 2 meals')
    })
  })

  it('should refresh grocery lists after generating from meals', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Clear previous calls
    mockGetGroceryLists.mockClear()

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/generate grocery list from meals/i)).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button
    const createButton = screen.getByRole('button', { name: /create list/i })
    fireEvent.click(createButton)

    // Verify grocery lists are refreshed
    await waitFor(() => {
      expect(mockGetGroceryLists).toHaveBeenCalledWith('mock-token')
    })
  })

  it('should handle errors when generating grocery list fails', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')
    
    // Mock generateGroceryList to throw an error
    mockGenerateGroceryList.mockRejectedValueOnce(new Error('API Error'))
    
    // Mock console.error to avoid noise in test output
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate grocery list/i })).toBeInTheDocument()
    })

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', { name: /generate grocery list/i })
    fireEvent.click(generateButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/generate grocery list from meals/i)).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button
    const createButton = screen.getByRole('button', { name: /create list/i })
    fireEvent.click(createButton)

    // Verify error is logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating grocery list:', expect.any(Error))
    })

    // Cleanup
    mockConsoleError.mockRestore()
  })
})

