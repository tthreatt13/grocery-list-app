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
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('renders meal type badge', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('Kids favorite!')).toBeInTheDocument()
  })

  it('does not render notes section when notes are not provided', () => {
    const mealWithoutNotes = { ...mockMeal, notes: undefined }
    render(<MealCard meal={mealWithoutNotes} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.queryByText('Kids favorite!')).not.toBeInTheDocument()
  })

  it('renders image placeholder when no image URL is provided', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const placeholderImage = screen.getByRole('img')
    expect(placeholderImage).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const editButton = screen.getByLabelText('Edit meal')
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalledWith(mockMeal)
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete meal')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith(mockMeal.id)
  })

  it('renders ingredient count', () => {
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('3 ingredients')).toBeInTheDocument()
  })

  it('handles meal with no ingredients', () => {
    const mealWithoutIngredients = { ...mockMeal, ingredients: undefined }
    render(<MealCard meal={mealWithoutIngredients} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.queryByText(/ingredients/)).not.toBeInTheDocument()
  })
})

