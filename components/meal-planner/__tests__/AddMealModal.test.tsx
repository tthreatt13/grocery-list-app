import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddMealModal from '../AddMealModal'
import { MealType } from '@/lib/types'

const mockOnClose = jest.fn()
const mockOnAdd = jest.fn()

describe('AddMealModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnAdd.mockClear()
  })

  it('renders when isOpen is true', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('Add Meal').length).toBeGreaterThan(0)
  })

  it('does not render when isOpen is false', () => {
    render(
      <AddMealModal
        isOpen={false}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )
    expect(screen.queryByText('Add Meal')).not.toBeInTheDocument()
  })

  it('displays meal type in subtitle', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.BREAKFAST}
        date={new Date('2024-11-10')}
      />
    )
    expect(screen.getByText(/Breakfast/i)).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )
    expect(screen.getByLabelText(/Meal Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ingredients/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onAdd with form data when add button is clicked', async () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )

    const nameInput = screen.getByLabelText(/Meal Name/i)
    const ingredientsInput = screen.getByLabelText(/Ingredients/i)
    const notesInput = screen.getByLabelText(/Notes/i)
    const addButton = screen.getByRole('button', { name: /add meal/i })

    fireEvent.change(nameInput, { target: { value: 'Spaghetti' } })
    fireEvent.change(ingredientsInput, {
      target: { value: 'pasta, tomato sauce, ground beef' },
    })
    fireEvent.change(notesInput, { target: { value: 'Kids favorite' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Spaghetti',
        ingredients: 'pasta, tomato sauce, ground beef',
        notes: 'Kids favorite',
      })
    })
  })

  it('does not call onAdd if meal name is empty', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )

    const addButton = screen.getByRole('button', { name: /add meal/i })
    fireEvent.click(addButton)

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('clears form after successful submission', async () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )

    const nameInput = screen.getByLabelText(/Meal Name/i) as HTMLInputElement
    const addButton = screen.getByRole('button', { name: /add meal/i })

    fireEvent.change(nameInput, { target: { value: 'Spaghetti' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(nameInput.value).toBe('')
    })
  })

  it('does not close modal on backdrop click (closeOnBackdropClick is false)', () => {
    render(
      <AddMealModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        mealType={MealType.DINNER}
        date={new Date('2024-11-10')}
      />
    )

    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).not.toHaveBeenCalled()
    }
  })

  describe('Edit Mode', () => {
    const mockMeal = {
      id: '1',
      name: 'Existing Meal',
      mealType: MealType.DINNER,
      date: new Date('2024-11-10'),
      ingredients: ['pasta', 'tomato sauce'],
      notes: 'Original notes',
      createdBy: 'User',
    }

    it('displays "Edit Meal" title when meal prop is provided', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
    })

    it('pre-populates form fields with meal data', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i) as HTMLInputElement
      const ingredientsInput = screen.getByLabelText(
        /Ingredients/i
      ) as HTMLTextAreaElement
      const notesInput = screen.getByLabelText(/Notes/i) as HTMLTextAreaElement

      expect(nameInput.value).toBe('Existing Meal')
      expect(ingredientsInput.value).toBe('pasta, tomato sauce')
      expect(notesInput.value).toBe('Original notes')
    })

    it('displays "Update Meal" button text in edit mode', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      expect(
        screen.getByRole('button', { name: /update meal/i })
      ).toBeInTheDocument()
    })

    it('calls onAdd with updated data when update button is clicked', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const updateButton = screen.getByRole('button', { name: /update meal/i })

      // Change the name
      fireEvent.change(nameInput, { target: { value: 'Updated Meal Name' } })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Updated Meal Name',
          ingredients: 'pasta, tomato sauce',
          notes: 'Original notes',
        })
      })
    })

    it('handles empty ingredients array correctly', () => {
      const mealWithoutIngredients = {
        ...mockMeal,
        ingredients: undefined,
      }

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
          meal={mealWithoutIngredients}
        />
      )

      const ingredientsInput = screen.getByLabelText(
        /Ingredients/i
      ) as HTMLTextAreaElement
      expect(ingredientsInput.value).toBe('')
    })
  })

  describe('Ingredient Normalization', () => {
    beforeEach(() => {
      mockOnAdd.mockResolvedValue(undefined)
    })

    it('normalizes bulleted list ingredients on submit', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Pancakes' } })
      fireEvent.change(ingredientsInput, {
        target: {
          value: '1. Eggs\n- Milk\n* Bread\n• Butter',
        },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Pancakes',
          ingredients: 'Eggs, Milk, Bread, Butter',
          notes: undefined,
        })
      })
    })

    it('normalizes numbered list ingredients on submit', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Pasta' } })
      fireEvent.change(ingredientsInput, {
        target: {
          value: '1. Pasta\n2. Tomato sauce\n3) Ground beef',
        },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Pasta',
          ingredients: 'Pasta, Tomato sauce, Ground beef',
          notes: undefined,
        })
      })
    })

    it('normalizes mixed commas and newlines', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Salad' } })
      fireEvent.change(ingredientsInput, {
        target: {
          value: 'Eggs,\nMilk',
        },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Salad',
          ingredients: 'Eggs, Milk',
          notes: undefined,
        })
      })
    })

    it('handles empty or whitespace-only ingredients', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Simple Meal' } })
      fireEvent.change(ingredientsInput, {
        target: { value: '   \n\n  ' },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Simple Meal',
          ingredients: undefined,
          notes: undefined,
        })
      })
    })

    it('preserves comma-separated format when no newlines present', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Spaghetti' } })
      fireEvent.change(ingredientsInput, {
        target: { value: 'pasta, tomato sauce, ground beef' },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Spaghetti',
          ingredients: 'pasta, tomato sauce, ground beef',
          notes: undefined,
        })
      })
    })

    it('handles newline-separated list without bullets', async () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.DINNER}
          date={new Date('2024-11-10')}
        />
      )

      const nameInput = screen.getByLabelText(/Meal Name/i)
      const ingredientsInput = screen.getByLabelText(/Ingredients/i)
      const addButton = screen.getByRole('button', { name: /add meal/i })

      fireEvent.change(nameInput, { target: { value: 'Soup' } })
      fireEvent.change(ingredientsInput, {
        target: {
          value: 'Chicken\nCarrots\nOnions\nCelery',
        },
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          name: 'Soup',
          ingredients: 'Chicken, Carrots, Onions, Celery',
          notes: undefined,
        })
      })
    })
  })
})
