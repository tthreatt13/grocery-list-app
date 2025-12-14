import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PreferencesForm from '../PreferencesForm'
import { HouseholdPreferences } from '@/lib/api/household'

// Mock the API types
const mockPreferences: HouseholdPreferences = {
  household_id: 1,
  user_id: 1,
  diet_types: ['paleo', 'mediterranean'],
  weekly_weather: 'cold',
  cooking_apparatus: ['oven', 'slow_cooker'],
  previous_meals: ['Chicken Stir Fry', 'Pasta Carbonara'],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('PreferencesForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders form fields correctly', () => {
    render(
      <PreferencesForm preferences={mockPreferences} onSubmit={mockOnSubmit} />
    )

    expect(screen.getByText('Diet Types')).toBeInTheDocument()
    expect(screen.getByText('Weekly Weather')).toBeInTheDocument()
    expect(screen.getByText('Available Cooking Apparatus')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Previous Meals Made This Week/i)
    ).toBeInTheDocument()
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

    // Check weather select
    const weatherSelect = screen.getByLabelText('Weekly Weather')
    expect(weatherSelect).toHaveValue('cold')

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

    // Select weather
    const weatherSelect = screen.getByLabelText('Weekly Weather')
    await user.selectOptions(weatherSelect, 'hot')

    // Select cooking apparatus
    await user.click(screen.getByLabelText('Oven'))
    await user.click(screen.getByLabelText('Grill'))

    // Enter previous meals
    const previousMealsInput = screen.getByLabelText(
      /Previous Meals Made This Week/i
    )
    await user.type(previousMealsInput, 'Tofu Scramble, Veggie Burger')

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /Save Preferences/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        diet_types: ['vegetarian', 'vegan'],
        weekly_weather: 'hot',
        cooking_apparatus: ['oven', 'grill'],
        previous_meals: ['Tofu Scramble', 'Veggie Burger'],
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
        weekly_weather: null,
        cooking_apparatus: null,
        previous_meals: null,
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
})
