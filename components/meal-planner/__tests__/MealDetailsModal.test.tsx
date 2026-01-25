import { render, screen, fireEvent } from '@testing-library/react'
import MealDetailsModal from '../MealDetailsModal'
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

const mockOnClose = jest.fn()
const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn()

describe('MealDetailsModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders meal name', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('renders meal type badge', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('displays "Recipe Instructions" label instead of "Notes"', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Recipe Instructions')).toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
  })

  it('displays legacy plain text notes correctly', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Kids favorite!')).toBeInTheDocument()
  })

  it('parses and displays structured recipe instructions with cook time', () => {
    const mealWithStructuredNotes: Meal = {
      ...mockMeal,
      notes: `Cook Time: 30 minutes

Step 1: Whisk 2 cups flour and 3 eggs together in a large bowl
Step 2: Fold in 1 cup spinach and 1/2 cup grated cheese
Step 3: Pour into greased pan and bake for 20 minutes at 375°F`,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithStructuredNotes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Check cook time is displayed prominently
    expect(screen.getByText(/Cook Time: 30 minutes/i)).toBeInTheDocument()

    // Check steps are displayed
    expect(screen.getByText(/Step 1:/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Whisk 2 cups flour and 3 eggs together in a large bowl/i
      )
    ).toBeInTheDocument()

    expect(screen.getByText(/Step 2:/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Fold in 1 cup spinach and 1\/2 cup grated cheese/i)
    ).toBeInTheDocument()

    expect(screen.getByText(/Step 3:/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Pour into greased pan and bake for 20 minutes at 375°F/i
      )
    ).toBeInTheDocument()
  })

  it('displays cook time with hours', () => {
    const mealWithHours: Meal = {
      ...mockMeal,
      notes: `Cook Time: 1.5 hours

Step 1: Prepare ingredients`,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithHours}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText(/Cook Time: 1.5 hours/i)).toBeInTheDocument()
  })

  it('handles structured format without cook time', () => {
    const mealWithoutCookTime: Meal = {
      ...mockMeal,
      notes: `Step 1: Mix ingredients
Step 2: Bake for 30 minutes`,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithoutCookTime}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Should still display steps
    expect(screen.getByText(/Step 1:/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 2:/i)).toBeInTheDocument()
    // Should not display cook time section
    expect(screen.queryByText(/Cook Time:/i)).not.toBeInTheDocument()
  })

  it('handles steps out of order and displays them correctly', () => {
    const mealWithOutOfOrderSteps: Meal = {
      ...mockMeal,
      notes: `Cook Time: 20 minutes

Step 3: Final step
Step 1: First step
Step 2: Second step`,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithOutOfOrderSteps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Steps should be displayed in order
    const step1 = screen.getByText(/Step 1:/i)
    const step2 = screen.getByText(/Step 2:/i)
    const step3 = screen.getByText(/Step 3:/i)

    expect(step1).toBeInTheDocument()
    expect(step2).toBeInTheDocument()
    expect(step3).toBeInTheDocument()
  })

  it('renders ingredients list', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText(/Ingredients \(3\)/i)).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Ground Beef')).toBeInTheDocument()
    expect(screen.getByText('Tomato Sauce')).toBeInTheDocument()
  })

  it('renders created by information', () => {
    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText(/Created by John Parent/i)).toBeInTheDocument()
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

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockMeal)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onDelete when delete button is clicked', async () => {
    mockOnDelete.mockResolvedValue(undefined)

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mockMeal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await expect(mockOnDelete).toHaveBeenCalledWith(mockMeal.id)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles multi-line step instructions', () => {
    const mealWithMultiLineSteps: Meal = {
      ...mockMeal,
      notes: `Cook Time: 45 minutes

Step 1: This is a step
that spans multiple lines
Step 2: Another step`,
    }

    render(
      <MealDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        meal={mealWithMultiLineSteps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText(/Step 1:/i)).toBeInTheDocument()
    expect(screen.getByText(/spans multiple lines/i)).toBeInTheDocument()
  })

  it('does not render recipe instructions section when notes are not provided', () => {
    const mealWithoutNotes: Meal = {
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

    expect(screen.queryByText('Recipe Instructions')).not.toBeInTheDocument()
  })
})
