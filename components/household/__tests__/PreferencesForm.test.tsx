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
  cooking_apparatus: ['oven', 'slow_cooker'],
  previous_meals: ['Chicken Stir Fry', 'Pasta Carbonara'],
  zip_code: '12345',
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
})
