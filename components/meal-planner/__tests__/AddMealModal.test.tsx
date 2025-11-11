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
    expect(screen.getByText('Add Meal')).toBeInTheDocument()
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
    const notesInput = screen.getByLabelText(/Notes/i)
    const addButton = screen.getByRole('button', { name: /add meal/i })
    
    fireEvent.change(nameInput, { target: { value: 'Spaghetti' } })
    fireEvent.change(notesInput, { target: { value: 'Kids favorite' } })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Spaghetti',
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

  it('closes modal on backdrop click', () => {
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
      expect(mockOnClose).toHaveBeenCalled()
    }
  })
})

