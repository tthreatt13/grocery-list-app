import { render, screen, fireEvent } from '@testing-library/react'
import MealDetailsModal from '../MealDetailsModal'
import { Meal, MealType } from '@/lib/types'

const mockMeal: Meal = {
  id: 'm1',
  name: 'Scrambled Eggs',
  mealType: MealType.BREAKFAST,
  date: new Date('2024-11-10'),
  createdBy: 'John',
  ingredients: ['eggs', 'butter', 'salt'],
  notes: 'Quick breakfast',
}

const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn().mockResolvedValue(undefined)
const mockOnClose = jest.fn()

describe('MealDetailsModal - Delete Functionality', () => {
  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear().mockResolvedValue(undefined)
    mockOnClose.mockClear()
  })

  it('renders meal details correctly', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Quick breakfast')).toBeInTheDocument()
    expect(screen.getByText('Ingredients (3)')).toBeInTheDocument()
    expect(screen.getByText('eggs')).toBeInTheDocument()
    expect(screen.getByText('butter')).toBeInTheDocument()
    expect(screen.getByText('salt')).toBeInTheDocument()
    expect(screen.getByText('Created by John')).toBeInTheDocument()
  })

  it('shows edit and delete buttons', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockMeal)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onDelete and closes modal when delete button is clicked', async () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Wait for async onDelete to complete
    await expect(mockOnDelete).resolves

    expect(mockOnDelete).toHaveBeenCalledWith('m1')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal even if onDelete throws an error', async () => {
    const mockOnDeleteWithError = jest
      .fn()
      .mockRejectedValue(new Error('Delete failed'))

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDeleteWithError}
      />
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockOnDeleteWithError).toHaveBeenCalledWith('m1')
    // Modal should still close even on error (error handling is in parent)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('does not render when meal is null', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={null}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <MealDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText('Scrambled Eggs')).not.toBeInTheDocument()
  })

  it('handles meal without ingredients', () => {
    const mealWithoutIngredients = {
      ...mockMeal,
      ingredients: undefined,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithoutIngredients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText(/Ingredients/)).not.toBeInTheDocument()
  })

  it('handles meal without notes', () => {
    const mealWithoutNotes = {
      ...mockMeal,
      notes: undefined,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithoutNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByText('Quick breakfast')).not.toBeInTheDocument()
  })

  it('handles meal without createdBy', () => {
    const mealWithoutCreatedBy = {
      ...mockMeal,
      createdBy: undefined,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithoutCreatedBy}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.queryByText(/Created by/)).not.toBeInTheDocument()
  })

  it('displays correct meal type colors', () => {
    const lunchMeal = {
      ...mockMeal,
      mealType: MealType.LUNCH,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={lunchMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const mealTypeBadge = screen.getByText('Lunch')
    expect(mealTypeBadge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('formats date correctly', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // The date should be formatted - exact format depends on formatDate implementation
    expect(screen.getByText(/Nov/)).toBeInTheDocument()
  })
})
