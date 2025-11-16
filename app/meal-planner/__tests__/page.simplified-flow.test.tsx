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
const mockUpdateMeal = mealsApi.updateMeal as jest.MockedFunction<typeof mealsApi.updateMeal>
const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<typeof householdApi.getHouseholds>
const mockGetGroceryLists = groceryApi.getGroceryLists as jest.MockedFunction<typeof groceryApi.getGroceryLists>
const mockSyncUser = clientApi.syncUser as jest.MockedFunction<typeof clientApi.syncUser>

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

describe('MealPlannerPage - Simplified Flow (Meal Plan > Edit Meal)', () => {
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
    mockUpdateMeal.mockResolvedValue(mockMealsResponse.meals[0])
    mockSyncUser.mockResolvedValue(undefined)
    mockConfirm.mockClear()
  })

  describe('Mobile Flow', () => {
    it('should open edit modal directly when mobile meal is clicked', async () => {
      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal (should open edit modal directly, not details modal)
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

      // Should open EditMealModal directly
      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
        expect(screen.queryByText('Meal Details')).not.toBeInTheDocument() // Should not open details modal
      })

      // Should show pre-populated meal data
      expect(screen.getByDisplayValue('Scrambled Eggs')).toBeInTheDocument()
      expect(screen.getByDisplayValue('eggs, butter, salt')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Quick breakfast')).toBeInTheDocument()

      // Should show delete button in edit modal
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Update Meal')).toBeInTheDocument()
    })

    it('should not render MealDetailsModal at all', async () => {
      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // MealDetailsModal should not exist in the DOM
      expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()
      
      // Click meal and verify no details modal appears
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
      })

      // Still no details modal
      expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()
    })
  })

  describe('Desktop Flow', () => {
    it('should open edit modal directly when desktop meal is clicked', async () => {
      // Mock desktop view
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(min-width: 768px)', // Desktop
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

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal card (should open edit modal directly)
      const mealCard = screen.getByText('Scrambled Eggs').closest('div')
      fireEvent.click(mealCard!)

      // Should open EditMealModal directly
      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
        expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()
      })

      // Should show pre-populated meal data
      expect(screen.getByDisplayValue('Scrambled Eggs')).toBeInTheDocument()
      expect(screen.getByDisplayValue('eggs, butter, salt')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Quick breakfast')).toBeInTheDocument()
    })
  })

  describe('Delete Functionality in Edit Modal', () => {
    it('should delete meal from edit modal', async () => {
      mockConfirm.mockReturnValue(true) // User confirms deletion

      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal to open edit modal
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

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

    it('should not delete when user cancels confirmation', async () => {
      mockConfirm.mockReturnValue(false) // User cancels

      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal to open edit modal
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

      // Wait for edit modal to open
      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Should show confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this meal?')

      // Should NOT call delete API
      expect(mockDeleteMeal).not.toHaveBeenCalled()

      // Modal should remain open
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    it('should handle delete errors gracefully', async () => {
      mockConfirm.mockReturnValue(true)
      mockDeleteMeal.mockRejectedValue(new Error('Network error'))

      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal to open edit modal
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

      // Wait for edit modal to open
      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Should handle error and show error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Modal should remain open
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })
  })

  describe('Update Functionality', () => {
    it('should update meal when form is submitted', async () => {
      render(<MealPlannerPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
      })

      // Click on the meal to open edit modal
      const mealButton = screen.getByText('Scrambled Eggs').closest('button')
      fireEvent.click(mealButton!)

      // Wait for edit modal to open
      await waitFor(() => {
        expect(screen.getByText('Edit Meal')).toBeInTheDocument()
      })

      // Update meal name
      const nameInput = screen.getByDisplayValue('Scrambled Eggs')
      fireEvent.change(nameInput, { target: { value: 'Updated Scrambled Eggs' } })

      // Submit form
      const updateButton = screen.getByText('Update Meal')
      fireEvent.click(updateButton)

      // Should call update API
      await waitFor(() => {
        expect(mockUpdateMeal).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Updated Scrambled Eggs',
            notes: 'Quick breakfast',
            ingredients: 'eggs, butter, salt',
          }),
          'mock-token'
        )
      })

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Edit Meal')).not.toBeInTheDocument()
      })
    })
  })
})


