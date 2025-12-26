import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PreferencesForm from '../PreferencesForm'
import { HouseholdPreferences } from '@/lib/api/household'
import { getWeeklyMeals, getWeekStartDate } from '@/lib/api/meals'
import { useAuth } from '@clerk/nextjs'

// Mock the API functions
jest.mock('@/lib/api/meals', () => ({
  getWeeklyMeals: jest.fn(),
  getWeekStartDate: jest.fn(),
}))

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

// Mock the API types
const mockPreferences: HouseholdPreferences = {
  household_id: 1,
  user_id: 1,
  diet_types: ['paleo', 'mediterranean'],
  cooking_apparatus: ['oven', 'slow_cooker'],
  previous_meals: ['Chicken Stir Fry', 'Pasta Carbonara'],
  zip_code: '12345',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('PreferencesForm', () => {
  const mockOnSubmit = jest.fn()
  const mockGetToken = jest.fn()
  const mockGetWeeklyMeals = getWeeklyMeals as jest.MockedFunction<
    typeof getWeeklyMeals
  >
  const mockGetWeekStartDate = getWeekStartDate as jest.MockedFunction<
    typeof getWeekStartDate
  >
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockGetToken.mockResolvedValue('mock-token')
    mockUseAuth.mockReturnValue({
      getToken: mockGetToken,
    } as ReturnType<typeof useAuth>)
    mockGetWeekStartDate.mockReturnValue('2025-01-06') // Mock current week Monday
    mockGetWeeklyMeals.mockResolvedValue({
      week_start_date: '2024-12-30',
      household_id: 1,
      meals: [],
    })
  })

  it('renders form fields correctly', () => {
    render(
      <PreferencesForm preferences={mockPreferences} onSubmit={mockOnSubmit} />
    )

    expect(screen.getByText('Diet Types')).toBeInTheDocument()
    expect(screen.getByText('Available Cooking Apparatus')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Previous Meals Made This Week/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Zip Code/i)).toBeInTheDocument()
  })

  it('initializes form with existing preferences', () => {
    render(
      <PreferencesForm preferences={mockPreferences} onSubmit={mockOnSubmit} />
    )

    // Check that checkboxes are checked for existing diet types
    const paleoCheckbox = screen.getByLabelText('Paleo')
    const mediterraneanCheckbox = screen.getByLabelText('Mediterranean')
    expect(paleoCheckbox).toBeChecked()
    expect(mediterraneanCheckbox).toBeChecked()

    // Check cooking apparatus checkboxes
    const ovenCheckbox = screen.getByLabelText('Oven')
    const slowCookerCheckbox = screen.getByLabelText('Slow Cooker')
    expect(ovenCheckbox).toBeChecked()
    expect(slowCookerCheckbox).toBeChecked()

    // Check previous meals input
    const previousMealsInput = screen.getByLabelText(
      /Previous Meals Made This Week/i
    )
    expect(previousMealsInput).toHaveValue('Chicken Stir Fry, Pasta Carbonara')

    // Check zip code input
    const zipCodeInput = screen.getByLabelText(/Zip Code/i)
    expect(zipCodeInput).toHaveValue('12345')
  })

  it('handles diet type selection', async () => {
    const user = userEvent.setup()
    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const ketoCheckbox = screen.getByLabelText('Keto')
    await user.click(ketoCheckbox)

    expect(ketoCheckbox).toBeChecked()
  })

  it('handles "none" diet type clearing others', async () => {
    const user = userEvent.setup()
    render(
      <PreferencesForm preferences={mockPreferences} onSubmit={mockOnSubmit} />
    )

    const noneCheckbox = screen.getByLabelText('None')
    await user.click(noneCheckbox)

    // "None" should be checked, others should be unchecked
    expect(noneCheckbox).toBeChecked()
    const paleoCheckbox = screen.getByLabelText('Paleo')
    expect(paleoCheckbox).not.toBeChecked()
  })

  it('handles cooking apparatus selection', async () => {
    const user = userEvent.setup()
    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const instantPotCheckbox = screen.getByLabelText('Instant Pot')
    await user.click(instantPotCheckbox)

    expect(instantPotCheckbox).toBeChecked()
  })

  it('handles form submission with correct data', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    // Select diet types
    await user.click(screen.getByLabelText('Vegetarian'))
    await user.click(screen.getByLabelText('Vegan'))

    // Select cooking apparatus
    await user.click(screen.getByLabelText('Oven'))
    await user.click(screen.getByLabelText('Grill'))

    // Enter previous meals
    const previousMealsInput = screen.getByLabelText(
      /Previous Meals Made This Week/i
    )
    await user.type(previousMealsInput, 'Tofu Scramble, Veggie Burger')

    // Enter zip code
    const zipCodeInput = screen.getByLabelText(/Zip Code/i)
    await user.type(zipCodeInput, '90210')

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        diet_types: ['vegetarian', 'vegan'],
        cooking_apparatus: ['oven', 'grill'],
        previous_meals: ['Tofu Scramble', 'Veggie Burger'],
        zip_code: '90210',
      })
    })
  })

  it('handles empty form submission', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        diet_types: null,
        cooking_apparatus: null,
        previous_meals: null,
        zip_code: null,
      })
    })
  })

  it('shows loading state when saving', () => {
    render(
      <PreferencesForm
        preferences={mockPreferences}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Saving.../i })
    expect(submitButton).toBeDisabled()
  })

  it('disables form when loading', () => {
    render(
      <PreferencesForm
        preferences={mockPreferences}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Saving.../i })
    expect(submitButton).toBeDisabled()
  })

  it('handles cancel button when provided', async () => {
    const user = userEvent.setup()
    const mockOnCancel = jest.fn()

    render(
      <PreferencesForm
        preferences={mockPreferences}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('handles zip code input and validation', async () => {
    const user = userEvent.setup()
    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const zipCodeInput = screen.getByLabelText(/Zip Code/i)

    // Test valid 5-digit zip code
    await user.type(zipCodeInput, '12345')
    await user.tab() // Trigger blur event
    expect(zipCodeInput).toHaveValue('12345')
    expect(screen.queryByText(/valid US zip code/i)).not.toBeInTheDocument()

    // Test valid 5+4 format
    await user.clear(zipCodeInput)
    await user.type(zipCodeInput, '12345-6789')
    await user.tab()
    expect(zipCodeInput).toHaveValue('12345-6789')
    expect(screen.queryByText(/valid US zip code/i)).not.toBeInTheDocument()

    // Test invalid format
    await user.clear(zipCodeInput)
    await user.type(zipCodeInput, '1234')
    await user.tab()
    expect(
      screen.getByText(/Please enter a valid US zip code/i)
    ).toBeInTheDocument()

    // Test invalid format with letters
    await user.clear(zipCodeInput)
    await user.type(zipCodeInput, 'abcde')
    await user.tab()
    expect(
      screen.getByText(/Please enter a valid US zip code/i)
    ).toBeInTheDocument()
  })

  it('prevents form submission with invalid zip code', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const zipCodeInput = screen.getByLabelText(/Zip Code/i)
    await user.type(zipCodeInput, '1234') // Invalid zip code

    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    // Form should not submit, error should be shown
    expect(
      screen.getByText(/Please enter a valid US zip code/i)
    ).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid zip code in 5+4 format', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const zipCodeInput = screen.getByLabelText(/Zip Code/i)
    await user.type(zipCodeInput, '12345-6789')

    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        diet_types: null,
        cooking_apparatus: null,
        previous_meals: null,
        zip_code: '12345-6789',
      })
    })
  })

  it('submits form with empty zip code', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        diet_types: null,
        cooking_apparatus: null,
        previous_meals: null,
        zip_code: null,
      })
    })
  })

  it('clears zip code error when user starts typing', async () => {
    const user = userEvent.setup()
    render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

    const zipCodeInput = screen.getByLabelText(/Zip Code/i)

    // Enter invalid zip code and trigger blur
    await user.type(zipCodeInput, '1234')
    await user.tab()
    expect(
      screen.getByText(/Please enter a valid US zip code/i)
    ).toBeInTheDocument()

    // Start typing again - error should clear
    await user.type(zipCodeInput, '5')
    expect(
      screen.queryByText(/Please enter a valid US zip code/i)
    ).not.toBeInTheDocument()
  })

  describe('Meal fetching from meal planner', () => {
    it('fetches meals when form loads in edit mode', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: 'Pasta Carbonara',
            meal_type: 'dinner',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      await waitFor(() => {
        expect(mockGetWeeklyMeals).toHaveBeenCalledWith(
          '2024-12-30', // Previous week Monday (2025-01-06 - 7 days)
          1,
          'mock-token'
        )
      })
    })

    it('auto-populates meals when fetched successfully', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: 'Pasta Carbonara',
            meal_type: 'dinner',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        expect(previousMealsInput).toHaveValue(
          'Chicken Stir Fry, Pasta Carbonara'
        )
      })
    })

    it('auto-populates from meal planner even if preferences already have previous_meals', async () => {
      const preferencesWithMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: ['Existing Meal'],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      // Initially shows existing meals from preferences
      expect(previousMealsInput).toHaveValue('Existing Meal')

      await waitFor(() => {
        expect(mockGetWeeklyMeals).toHaveBeenCalled()
      })

      // After meal planner data loads, it should append to existing meals (not replace)
      await waitFor(() => {
        expect(previousMealsInput).toHaveValue(
          'Existing Meal, Chicken Stir Fry'
        )
      })
    })

    it('deduplicates meal names correctly', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: 'Chicken Stir Fry', // Duplicate
            meal_type: 'lunch',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 3,
            household_id: 1,
            name: 'Pasta Carbonara',
            meal_type: 'dinner',
            day_of_week: 2,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        // Should only have one instance of "Chicken Stir Fry"
        expect(previousMealsInput).toHaveValue(
          'Chicken Stir Fry, Pasta Carbonara'
        )
      })
    })

    it('preserves original capitalization of meal names', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: 'pasta carbonara', // Lowercase
            meal_type: 'dinner',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        // Should preserve original capitalization
        expect(previousMealsInput).toHaveValue(
          'Chicken Stir Fry, pasta carbonara'
        )
      })
    })

    it('sorts meal names alphabetically', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Zucchini Pasta',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: 'Apple Pie',
            meal_type: 'dessert',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 3,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 2,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        // Should be sorted alphabetically
        expect(previousMealsInput).toHaveValue(
          'Apple Pie, Chicken Stir Fry, Zucchini Pasta'
        )
      })
    })

    it('allows user to edit auto-populated meals', async () => {
      const user = userEvent.setup()
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        expect(previousMealsInput).toHaveValue('Chicken Stir Fry')
      })

      // User should be able to edit
      await user.clear(previousMealsInput)
      await user.type(previousMealsInput, 'Edited Meal')

      expect(previousMealsInput).toHaveValue('Edited Meal')
    })

    it('shows loading indicator while fetching meals', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      // Delay the response to test loading state
      mockGetWeeklyMeals.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                week_start_date: '2024-12-30',
                household_id: 1,
                meals: [],
              })
            }, 100)
          })
      )

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      // Should show loading indicator
      const loadingIndicator = screen.getByRole('status', {
        name: /Loading meals/i,
      })
      expect(loadingIndicator).toBeInTheDocument()

      // Input should be disabled during loading
      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )
      expect(previousMealsInput).toBeDisabled()

      await waitFor(
        () => {
          expect(loadingIndicator).not.toBeInTheDocument()
        },
        { timeout: 200 }
      )
    })

    it('handles empty meals array gracefully', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      await waitFor(() => {
        expect(mockGetWeeklyMeals).toHaveBeenCalled()
      })

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      // Should remain empty, not crash
      expect(previousMealsInput).toHaveValue('')
    })

    it('does not fetch meals when no household ID is available', () => {
      const preferencesWithoutHousehold: HouseholdPreferences = {
        ...mockPreferences,
        household_id: 0, // Invalid household ID
      }

      render(
        <PreferencesForm
          preferences={preferencesWithoutHousehold}
          onSubmit={mockOnSubmit}
        />
      )

      // Should not call getWeeklyMeals
      expect(mockGetWeeklyMeals).not.toHaveBeenCalled()
    })

    it('handles API errors gracefully without blocking form', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockRejectedValue(new Error('API Error'))

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      await waitFor(() => {
        expect(mockGetWeeklyMeals).toHaveBeenCalled()
      })

      // Form should still be functional
      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )
      expect(previousMealsInput).not.toBeDisabled()

      // Error should be logged but not shown to user
      expect(consoleErrorSpy).toHaveBeenCalled()

      // User should be able to manually enter meals
      const user = userEvent.setup()
      await user.type(previousMealsInput, 'Manual Entry')
      expect(previousMealsInput).toHaveValue('Manual Entry')

      consoleErrorSpy.mockRestore()
    })

    it('does not fetch meals when preferences is null', () => {
      render(<PreferencesForm preferences={null} onSubmit={mockOnSubmit} />)

      expect(mockGetWeeklyMeals).not.toHaveBeenCalled()
    })

    it('filters out empty meal names', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            name: '', // Empty name
            meal_type: 'dinner',
            day_of_week: 1,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
          {
            id: 3,
            household_id: 1,
            name: '   ', // Whitespace only
            meal_type: 'dinner',
            day_of_week: 2,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      const previousMealsInput = screen.getByLabelText(
        /Previous Meals Made This Week/i
      )

      await waitFor(() => {
        // Should only have the valid meal name
        expect(previousMealsInput).toHaveValue('Chicken Stir Fry')
      })
    })

    it('shows auto-populated badge when meals are fetched', async () => {
      const preferencesWithoutMeals: HouseholdPreferences = {
        ...mockPreferences,
        previous_meals: [],
      }

      mockGetWeeklyMeals.mockResolvedValue({
        week_start_date: '2024-12-30',
        household_id: 1,
        meals: [
          {
            id: 1,
            household_id: 1,
            name: 'Chicken Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            week_start_date: '2024-12-30',
            created_at: '2024-12-30T00:00:00Z',
          },
        ],
      })

      render(
        <PreferencesForm
          preferences={preferencesWithoutMeals}
          onSubmit={mockOnSubmit}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByText('Auto-populated', { exact: false })
        ).toBeInTheDocument()
      })
    })

    describe('Date calculation edge cases', () => {
      it('calculates previous week Monday correctly when current date is Monday', async () => {
        // Mock current week Monday as 2025-01-06 (Monday)
        mockGetWeekStartDate.mockReturnValue('2025-01-06')

        const preferencesWithoutMeals: HouseholdPreferences = {
          ...mockPreferences,
          previous_meals: [],
        }

        mockGetWeeklyMeals.mockResolvedValue({
          week_start_date: '2024-12-30',
          household_id: 1,
          meals: [],
        })

        render(
          <PreferencesForm
            preferences={preferencesWithoutMeals}
            onSubmit={mockOnSubmit}
          />
        )

        await waitFor(() => {
          // Should calculate previous week Monday (2025-01-06 - 7 days = 2024-12-30)
          expect(mockGetWeeklyMeals).toHaveBeenCalledWith(
            '2024-12-30',
            1,
            'mock-token'
          )
        })
      })

      it('calculates previous week Monday correctly when current date is Sunday', async () => {
        // Mock current week Monday as 2025-01-06 (Monday)
        // Even if today is Sunday, getWeekStartDate should return Monday
        mockGetWeekStartDate.mockReturnValue('2025-01-06')

        const preferencesWithoutMeals: HouseholdPreferences = {
          ...mockPreferences,
          previous_meals: [],
        }

        mockGetWeeklyMeals.mockResolvedValue({
          week_start_date: '2024-12-30',
          household_id: 1,
          meals: [],
        })

        render(
          <PreferencesForm
            preferences={preferencesWithoutMeals}
            onSubmit={mockOnSubmit}
          />
        )

        await waitFor(() => {
          expect(mockGetWeeklyMeals).toHaveBeenCalledWith(
            '2024-12-30',
            1,
            'mock-token'
          )
        })
      })

      it('handles month boundary correctly', async () => {
        // Test crossing from January to December
        mockGetWeekStartDate.mockReturnValue('2025-01-06') // January 6, 2025

        const preferencesWithoutMeals: HouseholdPreferences = {
          ...mockPreferences,
          previous_meals: [],
        }

        mockGetWeeklyMeals.mockResolvedValue({
          week_start_date: '2024-12-30',
          household_id: 1,
          meals: [],
        })

        render(
          <PreferencesForm
            preferences={preferencesWithoutMeals}
            onSubmit={mockOnSubmit}
          />
        )

        await waitFor(() => {
          // Should correctly calculate December 30, 2024 (previous week)
          expect(mockGetWeeklyMeals).toHaveBeenCalledWith(
            '2024-12-30',
            1,
            'mock-token'
          )
        })
      })

      it('handles year boundary correctly', async () => {
        // Test crossing from 2025 to 2024
        mockGetWeekStartDate.mockReturnValue('2025-01-06') // January 6, 2025

        const preferencesWithoutMeals: HouseholdPreferences = {
          ...mockPreferences,
          previous_meals: [],
        }

        mockGetWeeklyMeals.mockResolvedValue({
          week_start_date: '2024-12-30',
          household_id: 1,
          meals: [],
        })

        render(
          <PreferencesForm
            preferences={preferencesWithoutMeals}
            onSubmit={mockOnSubmit}
          />
        )

        await waitFor(() => {
          // Should correctly calculate date in previous year
          expect(mockGetWeeklyMeals).toHaveBeenCalledWith(
            '2024-12-30',
            1,
            'mock-token'
          )
        })
      })

      it('returns date in YYYY-MM-DD format', async () => {
        mockGetWeekStartDate.mockReturnValue('2025-01-06')

        const preferencesWithoutMeals: HouseholdPreferences = {
          ...mockPreferences,
          previous_meals: [],
        }

        mockGetWeeklyMeals.mockResolvedValue({
          week_start_date: '2024-12-30',
          household_id: 1,
          meals: [],
        })

        render(
          <PreferencesForm
            preferences={preferencesWithoutMeals}
            onSubmit={mockOnSubmit}
          />
        )

        await waitFor(() => {
          const callArgs = mockGetWeeklyMeals.mock.calls[0]
          const dateArg = callArgs[0]
          // Verify date format is YYYY-MM-DD
          expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
      })
    })
  })
})
