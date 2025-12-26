import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddMealModal from '../AddMealModal'
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

const mockOnAdd = jest.fn()
const mockOnDelete = jest.fn()
const mockOnClose = jest.fn()

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

describe('AddMealModal - Delete Functionality', () => {
  beforeEach(() => {
    mockOnAdd.mockClear()
    mockOnDelete.mockClear()
    mockOnClose.mockClear()
    mockConfirm.mockClear()
  })

  describe('Add Mode (no meal provided)', () => {
    it('does not show delete button in add mode', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
        />
      )

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      // There are multiple "Add Meal" elements (heading and button), check for heading
      expect(
        screen.getByRole('heading', { name: 'Add Meal' })
      ).toBeInTheDocument()
    })
  })

  describe('Edit Mode (meal provided)', () => {
    it('shows delete button in edit mode when onDelete is provided', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Edit Meal')).toBeInTheDocument()
      expect(screen.getByText('Update Meal')).toBeInTheDocument()
    })

    it('does not show delete button when onDelete is not provided', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })

    it('pre-populates form with meal data', () => {
      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      expect(screen.getByDisplayValue('Scrambled Eggs')).toBeInTheDocument()
      expect(screen.getByDisplayValue('eggs, butter, salt')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Quick breakfast')).toBeInTheDocument()
    })

    it('calls onDelete when delete is clicked', async () => {
      mockOnDelete.mockResolvedValue(undefined)

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Modal calls onDelete directly - confirmation is handled in page component
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockMeal.id)
      })
      // window.confirm is not called by the modal
      expect(mockConfirm).not.toHaveBeenCalled()
    })

    it('calls onDelete but does not close modal immediately (confirmation handled by page)', async () => {
      mockOnDelete.mockResolvedValue(undefined)

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Modal calls onDelete - this opens confirmation modal in page component
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('m1')
      })

      // Modal should NOT close immediately - page component handles closing after confirmation
      expect(mockOnClose).not.toHaveBeenCalled()

      // window.confirm is not called by the modal
      expect(mockConfirm).not.toHaveBeenCalled()
    })

    it('shows loading state during deletion', async () => {
      mockConfirm.mockReturnValue(true)

      // Mock a delayed delete operation
      mockOnDelete.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument()
      })

      // Should disable other buttons during deletion
      expect(screen.getByText('Cancel')).toBeDisabled()
      expect(screen.getByText('Update Meal')).toBeDisabled()
    })

    it('handles delete errors gracefully', async () => {
      mockConfirm.mockReturnValue(true)
      mockOnDelete.mockRejectedValue(new Error('Network error'))

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Should not close modal on error
      expect(mockOnClose).not.toHaveBeenCalled()

      // Should re-enable buttons after error
      expect(screen.getByText('Delete')).not.toBeDisabled()
      expect(screen.getByText('Cancel')).not.toBeDisabled()
      expect(screen.getByText('Update Meal')).not.toBeDisabled()
    })

    it('handles generic delete errors', async () => {
      mockConfirm.mockReturnValue(true)
      mockOnDelete.mockRejectedValue('Unknown error')

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete meal')).toBeInTheDocument()
      })
    })

    it('disables delete button during form submission', async () => {
      mockOnAdd.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <AddMealModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          onDelete={mockOnDelete}
          mealType={MealType.BREAKFAST}
          date={new Date('2024-11-10')}
          meal={mockMeal}
        />
      )

      // Start form submission
      const updateButton = screen.getByText('Update Meal')
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeDisabled()
      })
    })
  })
})
