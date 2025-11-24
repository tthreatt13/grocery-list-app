import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

const mockGetWeeklyMeals = mealsApi.getWeeklyMeals as jest.MockedFunction<
  typeof mealsApi.getWeeklyMeals
>
const mockDeleteMeal = mealsApi.deleteMeal as jest.MockedFunction<
  typeof mealsApi.deleteMeal
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

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

describe('MealPlannerPage - Mobile Delete Flow', () => {
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
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockMealsResponse = {
    meals: [
      {
        id: 1,
        household_id: 1,
        name: 'Scrambled Eggs',
        meal_type: 'breakfast' as const,
        day_of_week: 0,
        week_start_date: weekStartDateStr,
        ingredients: 'eggs, butter, salt',
        notes: 'Quick breakfast',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        household_id: 1,
        name: 'Spaghetti',
        meal_type: 'dinner' as const,
        day_of_week: 0,
        week_start_date: weekStartDateStr,
        ingredients: 'pasta, tomato sauce',
        notes: 'Family dinner',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetWeeklyMeals.mockResolvedValue(mockMealsResponse)
    mockGetGroceryLists.mockResolvedValue([])
    mockDeleteMeal.mockResolvedValue(undefined)
    mockSyncUser.mockResolvedValue(undefined)
    mockConfirm.mockClear()
  })

  it('should open edit modal directly when mobile meal is clicked', async () => {
    render(<MealPlannerPage />)

    // Wait for component to load and meals to be displayed
    // Meals are converted from API response and need time to process
    // There are multiple "Scrambled Eggs" (desktop and mobile), so use getAllByText
    await waitFor(
      () => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )

    // Click on the meal in mobile view (h4 element in mobile calendar)
    // Mobile calendar uses h4, desktop uses h3
    const mobileMeal = screen
      .getAllByText('Scrambled Eggs')
      .find((el) => el.tagName === 'H4')
    expect(mobileMeal).toBeInTheDocument()
    const mealButton = mobileMeal!.closest('button')
    expect(mealButton).toBeInTheDocument()
    fireEvent.click(mealButton!)

    // Should open Edit Meal modal directly (current behavior)
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Should show meal information in edit modal
    expect(screen.getByDisplayValue('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByDisplayValue('eggs, butter, salt')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Quick breakfast')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Update Meal')).toBeInTheDocument()
  })

  it('should delete meal from edit modal', async () => {
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<MealPlannerPage />)

    // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
    await waitFor(() => {
      const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
      expect(scrambledEggsElements.length).toBeGreaterThan(0)
    })

    // Click on the meal in mobile view (h4 element in mobile calendar)
    const mobileMeal = screen
      .getAllByText('Scrambled Eggs')
      .find((el) => el.tagName === 'H4')
    expect(mobileMeal).toBeInTheDocument()
    const mealButton = mobileMeal!.closest('button')
    expect(mealButton).toBeInTheDocument()
    fireEvent.click(mealButton!)

    // Wait for edit modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Click delete button in edit modal
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this meal?'
    )

    // Should call delete API
    await waitFor(() => {
      expect(mockDeleteMeal).toHaveBeenCalledWith(1, 'mock-token')
    })

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Edit Meal')).not.toBeInTheDocument()
    })
  })

  it('should delete meal from edit modal', async () => {
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<MealPlannerPage />)

    // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
    await waitFor(() => {
      const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
      expect(scrambledEggsElements.length).toBeGreaterThan(0)
    })

    // Click on the meal in mobile view (h4 element in mobile calendar)
    const mobileMeal = screen
      .getAllByText('Scrambled Eggs')
      .find((el) => el.tagName === 'H4')
    expect(mobileMeal).toBeInTheDocument()
    const mealButton = mobileMeal!.closest('button')
    expect(mealButton).toBeInTheDocument()
    fireEvent.click(mealButton!)

    // Wait for edit modal to open directly
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Click delete button in edit modal
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this meal?'
    )

    // Should call delete API
    await waitFor(() => {
      expect(mockDeleteMeal).toHaveBeenCalledWith(1, 'mock-token')
    })

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Edit Meal')).not.toBeInTheDocument()
    })
  })

  it('should handle delete errors gracefully', async () => {
    mockConfirm.mockReturnValue(true)
    mockDeleteMeal.mockRejectedValue(new Error('Network error'))

    render(<MealPlannerPage />)

    // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
    await waitFor(() => {
      const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
      expect(scrambledEggsElements.length).toBeGreaterThan(0)
    })

    // Click on the meal in mobile view (h4 element in mobile calendar)
    const mobileMeal = screen
      .getAllByText('Scrambled Eggs')
      .find((el) => el.tagName === 'H4')
    expect(mobileMeal).toBeInTheDocument()
    const mealButton = mobileMeal!.closest('button')
    expect(mealButton).toBeInTheDocument()
    fireEvent.click(mealButton!)

    // Wait for edit modal to open directly
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Click delete button in edit modal
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show error message in the modal
    await waitFor(
      () => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Modal should remain open on error
    expect(screen.getByText('Edit Meal')).toBeInTheDocument()
  })

  it('should not delete when user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false) // User cancels

    render(<MealPlannerPage />)

    // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
    await waitFor(() => {
      const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
      expect(scrambledEggsElements.length).toBeGreaterThan(0)
    })

    // Click on the meal in mobile view (h4 element in mobile calendar)
    const mobileMeal = screen
      .getAllByText('Scrambled Eggs')
      .find((el) => el.tagName === 'H4')
    expect(mobileMeal).toBeInTheDocument()
    const mealButton = mobileMeal!.closest('button')
    expect(mealButton).toBeInTheDocument()
    fireEvent.click(mealButton!)

    // Wait for edit modal to open directly
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Click delete button in edit modal
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this meal?'
    )

    // Should NOT call delete API
    expect(mockDeleteMeal).not.toHaveBeenCalled()

    // Modal should remain open
    expect(screen.getByText('Edit Meal')).toBeInTheDocument()
  })
})
