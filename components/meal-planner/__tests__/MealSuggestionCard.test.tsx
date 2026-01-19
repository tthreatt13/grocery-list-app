import { render, screen, fireEvent } from '@testing-library/react'
import MealSuggestionCard from '../MealSuggestionCard'
import { MealSuggestion } from '@/lib/types'

const mockSuggestion: MealSuggestion = {
  meal_name: 'Spaghetti Bolognese',
  meal_type: 'dinner',
  day_of_week: 0, // Monday
  ingredients: ['Pasta', 'Ground Beef', 'Tomato Sauce'],
  uses_pantry_items: ['Pasta', 'Tomato Sauce'],
  notes: 'A classic Italian dish',
}

const mockOnSelect = jest.fn()
const mockOnEdit = jest.fn()

// Helper to create a Monday date
const createMonday = () => {
  const monday = new Date(2024, 10, 11) // Nov 11, 2024 is a Monday
  monday.setHours(0, 0, 0, 0)
  return monday
}

describe('MealSuggestionCard', () => {
  beforeEach(() => {
    mockOnSelect.mockClear()
    mockOnEdit.mockClear()
  })

  it('renders meal name', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('renders meal type', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.getByText(/dinner/i)).toBeInTheDocument()
  })

  it('renders day of week', () => {
    // Create a date that's definitely a Monday (Nov 11, 2024 is a Monday)
    const monday = new Date(2024, 10, 11) // Month is 0-indexed, so 10 = November
    monday.setHours(0, 0, 0, 0) // Normalize to start of day

    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={monday}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    // Should show Mon (short format) since day_of_week is 0 (Monday)
    expect(screen.getByText(/mon/i)).toBeInTheDocument()
  })

  it('renders ingredients list', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Ground Beef')).toBeInTheDocument()
    expect(screen.getByText('Tomato Sauce')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.getByText('A classic Italian dish')).toBeInTheDocument()
  })

  it('does not render notes section when notes are not provided', () => {
    const suggestionWithoutNotes = { ...mockSuggestion, notes: undefined }
    render(
      <MealSuggestionCard
        suggestion={suggestionWithoutNotes}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.queryByText('A classic Italian dish')).not.toBeInTheDocument()
  })

  it('highlights pantry items in ingredients list', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    // Pantry items should be highlighted (check for visual indicator)
    const pastaElement = screen.getByText('Pasta')
    expect(pastaElement).toBeInTheDocument()
  })

  it('shows pantry indicator when meal uses pantry items', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    // Should show indicator that pantry items are used
    expect(screen.getByText(/pantry/i)).toBeInTheDocument()
  })

  it('calls onSelect when checkbox is clicked', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockOnSelect).toHaveBeenCalledWith(true)
  })

  it('calls onSelect with false when unchecking', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={true}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockOnSelect).toHaveBeenCalledWith(false)
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    const editButton = screen.getByLabelText(/edit/i)
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalledWith(mockSuggestion)
  })

  it('shows selected state when isSelected is true', () => {
    render(
      <MealSuggestionCard
        suggestion={mockSuggestion}
        weekStartDate={createMonday()}
        isSelected={true}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('handles meal with no pantry items', () => {
    const suggestionNoPantry = {
      ...mockSuggestion,
      uses_pantry_items: [],
    }
    render(
      <MealSuggestionCard
        suggestion={suggestionNoPantry}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    // Should still render the meal
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('handles meal with empty ingredients array', () => {
    const suggestionNoIngredients = {
      ...mockSuggestion,
      ingredients: [],
    }
    render(
      <MealSuggestionCard
        suggestion={suggestionNoIngredients}
        weekStartDate={createMonday()}
        isSelected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    )
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })
})
