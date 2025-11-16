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

const mockGetWeeklyMeals = mealsApi.getWeeklyMeals as jest.MockedFunction<typeof mealsApi.getWeeklyMeals>
const mockDeleteMeal = mealsApi.deleteMeal as jest.MockedFunction<typeof mealsApi.deleteMeal>
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<typeof householdApi.getHouseholds>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<typeof groceryApi.getGroceryLists>
const mockSyncUser = clientApi.syncUser as jest.MockedFunction<typeof clientApi.syncUser>

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

describe('MealPlannerPage - Mobile Delete Flow', () => {
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
        week_start_date: '2024-11-10',
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
        week_start_date: '2024-11-10',
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

  it('should open MealDetailsModal when mobile meal is clicked', async () => {
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal (should open details modal, not edit modal)
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Should open MealDetailsModal, not AddMealModal
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
      expect(screen.queryByText('Edit Meal')).not.toBeInTheDocument() // Should not open edit modal directly
    })

    // Should show meal information in details modal
    expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByText('Quick breakfast')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should delete meal from MealDetailsModal', async () => {
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal to open details modal
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Wait for details modal to open
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this meal?')

    // Should call delete API
    await waitFor(() => {
      expect(mockDeleteMeal).toHaveBeenCalledWith(1, 'mock-token')
    })

    // Modal should close and meal should be removed from UI
    await waitFor(() => {
      expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()
    })
  })

  it('should open edit modal from MealDetailsModal', async () => {
    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal to open details modal
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Wait for details modal to open
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Should close details modal and open edit modal
    await waitFor(() => {
      expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Edit modal should have pre-populated data
    expect(screen.getByDisplayValue('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByDisplayValue('eggs, butter, salt')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Quick breakfast')).toBeInTheDocument()
  })

  it('should delete meal from edit modal', async () => {
    mockConfirm.mockReturnValue(true) // User confirms deletion

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal to open details modal
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Wait for details modal to open
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
    })

    // Click edit button to open edit modal
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Wait for edit modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    // Click delete button in edit modal
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this meal?')

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

    // Mock console.error to avoid noise in test output
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal to open details modal
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Wait for details modal to open
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should handle error
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting meal:', expect.any(Error))
    })

    // Should show error message
    expect(screen.getByText('Network error')).toBeInTheDocument()

    // Cleanup
    mockConsoleError.mockRestore()
  })

  it('should not delete when user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false) // User cancels

    render(<MealPlannerPage />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    })

    // Click on the meal to open details modal
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    fireEvent.click(mealButton!)

    // Wait for details modal to open
    await waitFor(() => {
      expect(screen.getByText('Meal Details')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this meal?')

    // Should NOT call delete API
    expect(mockDeleteMeal).not.toHaveBeenCalled()

    // Modal should remain open
    expect(screen.getByText('Meal Details')).toBeInTheDocument()
  })
})
