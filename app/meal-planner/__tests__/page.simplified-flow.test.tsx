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
const mockUpdateMeal = mealsApi.updateMeal as jest.MockedFunction<
  typeof mealsApi.updateMeal
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

// Note: window.confirm is no longer used - we use ConfirmDeleteModal instead

describe('MealPlannerPage - Simplified Flow (Meal Plan > Edit Meal)', () => {
  // Calculate current week start (Monday) for test meals - matching component logic
  const getCurrentWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Convert to Monday-based week (0=Monday, 6=Sunday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday) // Start on Monday
    // Normalize to start of day (midnight) to avoid time comparison issues
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
    mockUpdateMeal.mockResolvedValue(mockMealsResponse.meals[0])
    mockSyncUser.mockResolvedValue(undefined)
  })

  describe('Mobile Flow', () => {
    it('should open edit modal directly when mobile meal is clicked', async () => {
      render(<MealPlannerPage />)

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in mobile view (h4 element in mobile calendar)
      // Mobile calendar uses h4, desktop uses h3
      const mobileMeal = screen
        .getAllByText('Scrambled Eggs')
        .find((el) => el.tagName === 'H4')
      expect(mobileMeal).toBeInTheDocument()
      const mealButton = mobileMeal!.closest('button')
      expect(mealButton).toBeInTheDocument()
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

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // MealDetailsModal should not exist in the DOM
      expect(screen.queryByText('Meal Details')).not.toBeInTheDocument()

      // Click meal in mobile view and verify no details modal appears
      const mobileMeal = screen
        .getAllByText('Scrambled Eggs')
        .find((el) => el.tagName === 'H4')
      expect(mobileMeal).toBeInTheDocument()
      const mealButton = mobileMeal!.closest('button')
      expect(mealButton).toBeInTheDocument()
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
        value: jest.fn().mockImplementation((query) => ({
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

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in desktop view (h3 element in desktop calendar)
      const desktopMeal = screen
        .getAllByText('Scrambled Eggs')
        .find((el) => el.tagName === 'H3')
      expect(desktopMeal).toBeInTheDocument()
      const mealCard = desktopMeal!.closest('div')
      expect(mealCard).toBeInTheDocument()
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
      render(<MealPlannerPage />)

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in mobile view to open edit modal
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

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Delete Meal?')).toBeInTheDocument()
      })

      // Click confirm button in confirmation modal (find it within the confirmation modal context)
      const confirmationModal = screen
        .getByText('Delete Meal?')
        .closest('[role="dialog"]')
      expect(confirmationModal).toBeInTheDocument()
      const allDeleteButtons = screen.getAllByRole('button', {
        name: /^Delete$/i,
      })
      const confirmButton = allDeleteButtons.find((btn) =>
        confirmationModal!.contains(btn)
      )
      expect(confirmButton).toBeInTheDocument()
      fireEvent.click(confirmButton!)

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
      render(<MealPlannerPage />)

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in mobile view to open edit modal
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

      // Click delete button
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Delete Meal?')).toBeInTheDocument()
      })

      // Click cancel button in confirmation modal (find it within the confirmation modal context)
      const confirmationModal = screen
        .getByText('Delete Meal?')
        .closest('[role="dialog"]')
      expect(confirmationModal).toBeInTheDocument()
      const allCancelButtons = screen.getAllByRole('button', {
        name: /^Cancel$/i,
      })
      const cancelButton = allCancelButtons.find((btn) =>
        confirmationModal!.contains(btn)
      )
      expect(cancelButton).toBeInTheDocument()
      fireEvent.click(cancelButton!)

      // Should NOT call delete API
      expect(mockDeleteMeal).not.toHaveBeenCalled()

      // Confirmation modal should close, but edit modal should remain open
      await waitFor(() => {
        expect(screen.queryByText('Delete Meal?')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    it('should handle delete errors gracefully', async () => {
      mockDeleteMeal.mockRejectedValue(new Error('Network error'))

      render(<MealPlannerPage />)

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in mobile view to open edit modal
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

      // Click delete button
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Delete Meal?')).toBeInTheDocument()
      })

      // Click confirm button in confirmation modal (find it within the confirmation modal context)
      const confirmationModal = screen
        .getByText('Delete Meal?')
        .closest('[role="dialog"]')
      expect(confirmationModal).toBeInTheDocument()
      const allDeleteButtons = screen.getAllByRole('button', {
        name: /^Delete$/i,
      })
      const confirmButton = allDeleteButtons.find((btn) =>
        confirmationModal!.contains(btn)
      )
      expect(confirmButton).toBeInTheDocument()
      fireEvent.click(confirmButton!)

      // Wait for delete API to be called
      await waitFor(() => {
        expect(mockDeleteMeal).toHaveBeenCalledWith(1, 'mock-token')
      })

      // Should handle error and show error message in the page (error state is set in page component)
      // Wait for error message to appear - it's set in the catch block after API call fails
      // Wait for the error banner to appear using testid for reliable querying
      const errorBanner = await screen.findByTestId(
        'error-banner',
        {},
        { timeout: 3000 }
      )
      expect(errorBanner).toBeInTheDocument()
      expect(errorBanner).toHaveTextContent('Network error')

      // Confirmation modal should close on error, but edit modal should remain open
      await waitFor(() => {
        expect(screen.queryByText('Delete Meal?')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })
  })

  describe('Update Functionality', () => {
    it('should update meal when form is submitted', async () => {
      render(<MealPlannerPage />)

      // Wait for component to load - there are multiple "Scrambled Eggs" (desktop and mobile)
      await waitFor(() => {
        const scrambledEggsElements = screen.getAllByText('Scrambled Eggs')
        expect(scrambledEggsElements.length).toBeGreaterThan(0)
      })

      // Click on the meal in mobile view to open edit modal
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

      // Update meal name
      const nameInput = screen.getByDisplayValue('Scrambled Eggs')
      fireEvent.change(nameInput, {
        target: { value: 'Updated Scrambled Eggs' },
      })

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
