import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
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

const mockGetWeeklyMeals = mealsApi.getWeeklyMeals as jest.MockedFunction<
  typeof mealsApi.getWeeklyMeals
>
const mockCreateMeal = mealsApi.createMeal as jest.MockedFunction<
  typeof mealsApi.createMeal
>
const mockGenerateGroceryList =
  mealsApi.generateGroceryList as jest.MockedFunction<
    typeof mealsApi.generateGroceryList
  >
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<
  typeof householdApi.getHouseholds
>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<
  typeof groceryApi.getGroceryLists
>
const mockSyncUser = clientApi.syncUser as jest.MockedFunction<
  typeof clientApi.syncUser
>

describe('MealPlannerPage - Generate List Button', () => {
  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsResponse = {
    week_start_date: '2024-01-01',
    household_id: 1,
    meals: [],
  }

  const mockUserSyncResponse = {
    id: 1,
    clerk_user_id: 'user_test123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsResponse)
    mockGetGroceryLists.mockResolvedValue([])
    mockGenerateGroceryList.mockResolvedValue({
      grocery_list_id: 1,
      items_count: 5,
      message: 'Successfully generated grocery list with 5 items from 3 meals',
    })
    mockSyncUser.mockResolvedValue(mockUserSyncResponse)
  })

  it('should have Generate List button with text-base size (same as other primary buttons)', async () => {
    render(<MealPlannerPage />)

    await waitFor(() => {
      // Find the desktop "Generate Grocery List" button
      const desktopButton = screen.getByRole('button', {
        name: /generate grocery list/i,
      })
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
      value: jest.fn().mockImplementation((query) => ({
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
      const mobileButton = screen.getByRole('button', {
        name: /generate list/i,
      })
      expect(mobileButton).toBeInTheDocument()

      // Check that it has text-base class (should match other primary buttons)
      // The button should NOT have text-sm class (which comes from size="sm")
      expect(mobileButton).toHaveClass('text-base')
      expect(mobileButton).not.toHaveClass('text-sm')
    })
  })
})

describe('MealPlannerPage - Meal Type Functionality', () => {
  // Calculate current week start (Monday) for test meals
  const getCurrentWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday)
    startDate.setHours(0, 0, 0, 0)
    return startDate
  }

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const currentWeekStart = getCurrentWeekStart()
  const weekStartDateStr = formatDateForAPI(currentWeekStart)

  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsWithIngredients = {
    week_start_date: weekStartDateStr,
    household_id: 1,
    meals: [
      {
        id: 1,
        household_id: 1,
        name: 'Pancakes',
        meal_type: 'breakfast' as const,
        day_of_week: 0,
        week_start_date: weekStartDateStr,
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
        week_start_date: weekStartDateStr,
        ingredients: 'pasta, ground beef, tomato sauce',
        notes: 'Family dinner',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  }

  const mockUserSyncResponse = {
    id: 1,
    clerk_user_id: 'user_test123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsWithIngredients)
    mockGetGroceryLists.mockResolvedValue([])
    mockGenerateGroceryList.mockResolvedValue({
      grocery_list_id: 1,
      items_count: 7,
      message: 'Successfully generated grocery list with 7 items from 2 meals',
    })
    mockSyncUser.mockResolvedValue(mockUserSyncResponse)
  })

  it.skip('should call generateGroceryList API with correct parameters when creating grocery list', async () => {
    const user = userEvent.setup()

    render(<MealPlannerPage />)

    // Wait for component to load and meals to be displayed
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Wait for component to fully initialize, including currentWeekStart and household selection
    // This ensures all state is set before we interact with the modal
    await waitFor(() => {
      expect(mockGetWeeklyMeals).toHaveBeenCalled()
      expect(mockGetHouseholds).toHaveBeenCalled()
    })

    // Wait for household to be selected (household selection happens after households are fetched)
    // Also wait for grocery lists to be fetched, which happens after household is selected
    await waitFor(
      () => {
        expect(mockGetHouseholds).toHaveBeenCalled()
        expect(mockGetGroceryLists).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Give time for state to settle
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    await user.click(generateButton)

    // Wait a bit for the modal to open
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Wait for modal to appear - use heading role to avoid matching button text
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Wait for modal to be fully rendered
    await waitFor(() => {
      const input = screen.getByLabelText(/list name/i) as HTMLInputElement
      expect(input).toBeInTheDocument()
    })

    // Get the input reference
    const nameInput = screen.getByLabelText(/list name/i) as HTMLInputElement

    // Change the input value within act to ensure state updates are processed
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })
      // Small delay to let React process the update
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Wait for button to be enabled (form validation) and get reference
    const createButton = await waitFor(
      () => {
        const btn = screen.getByRole('button', {
          name: /create grocery list/i,
        })
        expect(btn).not.toBeDisabled()
        return btn
      },
      { timeout: 3000 }
    )

    // Click the button using userEvent for better simulation
    await user.click(createButton)

    // Wait for the API call to be made
    // The handleCreateGroceryList function is async and may take time
    await waitFor(
      () => {
        expect(mockGenerateGroceryList).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )

    // Verify the call arguments
    expect(mockGenerateGroceryList).toHaveBeenCalledWith(
      expect.objectContaining({
        household_id: 1,
        grocery_list_name: 'Test Meal List',
        week_start_date: expect.any(String),
      }),
      'mock-token'
    )
  }, 20000) // Increase test timeout to 20 seconds

  it('should display success message after generating grocery list', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')

    // Mock window.alert
    const mockAlert = jest.fn()
    window.alert = mockAlert

    render(<MealPlannerPage />)

    // Wait for component to load and meals to be displayed
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Wait a bit for meals to be processed
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    // Wait for modal to appear - modal title is "Generate Grocery List"
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button - button text is "Create Grocery List"
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    // Verify success message is shown
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Successfully generated grocery list with 7 items from 2 meals'
      )
    })
  })

  it('should refresh grocery lists after generating from meals', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react')

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Clear previous calls
    mockGetGroceryLists.mockClear()

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    // Wait for modal to appear - modal title is "Generate Grocery List"
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button - button text is "Create Grocery List"
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
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
    const mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(<MealPlannerPage />)

    // Wait for component to load and meals to be displayed
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Wait a bit for meals to be processed
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Click the generate grocery list button
    const generateButton = screen.getByRole('button', {
      name: /generate grocery list/i,
    })
    fireEvent.click(generateButton)

    // Wait for modal to appear - modal title is "Generate Grocery List"
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /generate grocery list/i })
      ).toBeInTheDocument()
    })

    // Fill in the list name
    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Meal List' } })

    // Click create button - button text is "Create Grocery List"
    const createButton = screen.getByRole('button', {
      name: /create grocery list/i,
    })
    fireEvent.click(createButton)

    // Verify error is logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error creating grocery list:',
        expect.any(Error)
      )
    })

    // Cleanup
    mockConsoleError.mockRestore()
  })
})

describe('MealPlannerPage - Ingredient Normalization', () => {
  // Calculate current week start (Monday) for test meals
  const getCurrentWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday)
    startDate.setHours(0, 0, 0, 0)
    return startDate
  }

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const currentWeekStart = getCurrentWeekStart()
  const weekStartDateStr = formatDateForAPI(currentWeekStart)

  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsResponse = {
    week_start_date: weekStartDateStr,
    household_id: 1,
    meals: [],
  }

  const mockUserSyncResponse = {
    id: 1,
    clerk_user_id: 'user_test123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsResponse)
    mockGetGroceryLists.mockResolvedValue([])
    mockSyncUser.mockResolvedValue(mockUserSyncResponse)
    mockCreateMeal.mockResolvedValue({
      id: 1,
      household_id: 1,
      name: 'Test Meal',
      meal_type: 'dinner',
      day_of_week: 0,
      week_start_date: weekStartDateStr,
      ingredients: 'Eggs, Milk, Bread, Butter',
      notes: '',
      created_at: '2024-01-01T00:00:00Z',
    })
  })

  it('should normalize pasted bulleted ingredients when creating meal', async () => {
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(mockGetHouseholds).toHaveBeenCalled()
    })

    // Wait for household to be selected and calendar to render
    await waitFor(() => {
      expect(mockGetWeeklyMeals).toHaveBeenCalled()
    })

    // Wait for calendar to be visible (empty slot buttons should be present)
    await waitFor(() => {
      const emptySlotButtons = screen.getAllByLabelText(/add meal/i)
      expect(emptySlotButtons.length).toBeGreaterThan(0)
    })

    // Find an empty slot button to add a meal
    const emptySlotButtons = screen.getAllByLabelText(/add meal/i)
    fireEvent.click(emptySlotButtons[0])

    // Wait for modal to open - look for the heading (h2 element)
    await waitFor(
      () => {
        const headings = screen.getAllByText('Add Meal')
        const heading = headings.find((el) => el.tagName === 'H2')
        expect(heading).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Fill in meal name
    const nameInput = screen.getByLabelText(/meal name/i)
    fireEvent.change(nameInput, { target: { value: 'Pancakes' } })

    // Paste bulleted ingredients into ingredients textarea
    const ingredientsInput = screen.getByLabelText(/ingredients/i)
    const pastedIngredients = '1. Eggs\n- Milk\n* Bread\n• Butter'
    fireEvent.change(ingredientsInput, { target: { value: pastedIngredients } })

    // Submit the form - there may be multiple "Add Meal" buttons, get the one in the modal
    const addButtons = screen.getAllByRole('button', { name: /add meal/i })
    // The last one should be the submit button in the modal
    const addButton = addButtons[addButtons.length - 1]
    fireEvent.click(addButton)

    // Wait for createMeal to be called
    await waitFor(() => {
      expect(mockCreateMeal).toHaveBeenCalled()
    })

    // Verify that createMeal was called with normalized ingredients
    expect(mockCreateMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: 'Eggs, Milk, Bread, Butter',
      }),
      'mock-token'
    )
  })

  it('should normalize newline-separated ingredients when creating meal', async () => {
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(mockGetHouseholds).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockGetWeeklyMeals).toHaveBeenCalled()
    })

    // Wait for calendar to be visible (empty slot buttons should be present)
    await waitFor(() => {
      const emptySlotButtons = screen.getAllByLabelText(/add meal/i)
      expect(emptySlotButtons.length).toBeGreaterThan(0)
    })

    // Find an empty slot button to add a meal
    const emptySlotButtons = screen.getAllByLabelText(/add meal/i)
    fireEvent.click(emptySlotButtons[0])

    // Wait for modal to open - look for the heading (h2 element)
    await waitFor(
      () => {
        const headings = screen.getAllByText('Add Meal')
        const heading = headings.find((el) => el.tagName === 'H2')
        expect(heading).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Fill in meal name
    const nameInput = screen.getByLabelText(/meal name/i)
    fireEvent.change(nameInput, { target: { value: 'Soup' } })

    // Paste newline-separated ingredients
    const ingredientsInput = screen.getByLabelText(/ingredients/i)
    const pastedIngredients = 'Chicken\nCarrots\nOnions\nCelery'
    fireEvent.change(ingredientsInput, { target: { value: pastedIngredients } })

    // Submit the form - there may be multiple "Add Meal" buttons, get the one in the modal
    const addButtons = screen.getAllByRole('button', { name: /add meal/i })
    // The last one should be the submit button in the modal
    const addButton = addButtons[addButtons.length - 1]
    fireEvent.click(addButton)

    // Wait for createMeal to be called
    await waitFor(() => {
      expect(mockCreateMeal).toHaveBeenCalled()
    })

    // Verify that createMeal was called with normalized ingredients
    expect(mockCreateMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: 'Chicken, Carrots, Onions, Celery',
      }),
      'mock-token'
    )
  })
})
