import { render, screen, fireEvent } from '@testing-library/react'
import MealCard from '../MealCard'
import { Meal, MealType } from '@/lib/types'

const mockMeal: Meal = {
  id: 'm1',
  name: 'Spaghetti Bolognese',
  mealType: MealType.DINNER,
  date: new Date('2024-11-10'),
  notes: 'Kids favorite!',
  ingredients: ['Pasta', 'Ground Beef', 'Tomato Sauce'],
  createdBy: 'John Parent',
}

const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn()

describe('MealCard', () => {
  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
  })

  it('renders meal name', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('renders meal type badge', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('Kids favorite!')).toBeInTheDocument()
  })

  it('does not render notes section when notes are not provided', () => {
    const mealWithoutNotes = { ...mockMeal, notes: undefined }
    render(
      <MealCard
        meal={mealWithoutNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.queryByText('Kids favorite!')).not.toBeInTheDocument()
  })

  it('renders image placeholder when no image URL is provided', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    const placeholderImage = screen.getByLabelText('Meal placeholder')
    expect(placeholderImage).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    const editButton = screen.getByLabelText('Edit meal')
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalledWith(mockMeal)
  })

  it('calls onDelete when delete button is clicked', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    const deleteButton = screen.getByLabelText('Delete meal')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith(mockMeal.id)
  })

  it('renders ingredient count', () => {
    render(
      <MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )
    expect(screen.getByText('3 ingredients')).toBeInTheDocument()
  })

  it('handles meal with no ingredients', () => {
    const mealWithoutIngredients = { ...mockMeal, ingredients: undefined }
    render(
      <MealCard
        meal={mealWithoutIngredients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.queryByText(/ingredients/)).not.toBeInTheDocument()
  })

  describe('Meal Category Indicators', () => {
    it('displays quick meal indicator (⚡) for quick_meal category', () => {
      const quickMeal = { ...mockMeal, mealCategory: 'quick_meal' as const }
      render(
        <MealCard
          meal={quickMeal}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      const quickMealIndicator = screen.getByLabelText('Quick Meal')
      expect(quickMealIndicator).toBeInTheDocument()
      expect(quickMealIndicator).toHaveTextContent('⚡')
    })

    it('displays eat out indicator (🍴) for eat_out category', () => {
      const eatOutMeal = { ...mockMeal, mealCategory: 'eat_out' as const }
      render(
        <MealCard
          meal={eatOutMeal}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      const eatOutIndicator = screen.getByLabelText('Eat Out')
      expect(eatOutIndicator).toBeInTheDocument()
      expect(eatOutIndicator).toHaveTextContent('🍴')
    })

    it('does not display indicator for normal category', () => {
      const normalMeal = { ...mockMeal, mealCategory: 'normal' as const }
      render(
        <MealCard
          meal={normalMeal}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.queryByLabelText('Quick Meal')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Eat Out')).not.toBeInTheDocument()
    })

    it('does not display indicator when mealCategory is undefined', () => {
      const mealWithoutCategory = { ...mockMeal, mealCategory: undefined }
      render(
        <MealCard
          meal={mealWithoutCategory}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.queryByLabelText('Quick Meal')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Eat Out')).not.toBeInTheDocument()
    })

    it('displays correct indicator when switching categories', () => {
      const quickMeal = { ...mockMeal, mealCategory: 'quick_meal' as const }
      const { rerender } = render(
        <MealCard
          meal={quickMeal}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByLabelText('Quick Meal')).toBeInTheDocument()
      expect(screen.queryByLabelText('Eat Out')).not.toBeInTheDocument()

      // Change to eat_out
      const eatOutMeal = { ...mockMeal, mealCategory: 'eat_out' as const }
      rerender(
        <MealCard
          meal={eatOutMeal}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByLabelText('Quick Meal')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Eat Out')).toBeInTheDocument()
    })
  })
})
