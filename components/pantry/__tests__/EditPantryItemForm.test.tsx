import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPantryItemForm from '../EditPantryItemForm'
import { ItemCategory, PantryItem } from '@/lib/types'

describe('EditPantryItemForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  const mockItem: PantryItem = {
    id: '1',
    name: 'Test Item',
    quantity: 5,
    unit: 'pcs',
    category: ItemCategory.PRODUCE,
    expirationDate: new Date('2025-12-31'),
    lowStockThreshold: 2,
    addedAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields with item data', () => {
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByLabelText(/item name/i)).toHaveValue('Test Item')
    expect(screen.getByLabelText(/quantity/i)).toHaveValue(5)
    expect(screen.getByLabelText(/unit/i)).toHaveValue('pcs')
    expect(screen.getByLabelText(/category/i)).toHaveValue(ItemCategory.PRODUCE)
    expect(screen.getByLabelText(/low stock threshold/i)).toHaveValue(2)
  })

  it('renders save and cancel buttons', () => {
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('shows error when name is cleared', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const nameInput = screen.getByLabelText(/item name/i)
    await user.clear(nameInput)
    
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates quantity cannot be zero or negative', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement
    
    // Clear the input to make it empty, which should trigger validation
    await user.clear(quantityInput)
    
    // Submit the form with empty quantity
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/quantity must be greater than 0/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('allows user to edit name field', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const nameInput = screen.getByLabelText(/item name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Item Name')
    
    expect(nameInput).toHaveValue('Updated Item Name')
  })

  it('allows user to edit quantity field', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const quantityInput = screen.getByLabelText(/quantity/i)
    await user.clear(quantityInput)
    await user.type(quantityInput, '10')
    
    expect(quantityInput).toHaveValue(10)
  })

  it('allows user to edit unit field', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const unitInput = screen.getByLabelText(/unit/i)
    await user.clear(unitInput)
    await user.type(unitInput, 'kg')
    
    expect(unitInput).toHaveValue('kg')
  })

  it('allows user to change category', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, ItemCategory.DAIRY)
    
    expect(categorySelect).toHaveValue(ItemCategory.DAIRY)
  })

  it('submits form with updated data', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const nameInput = screen.getByLabelText(/item name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Item')
    
    const quantityInput = screen.getByLabelText(/quantity/i)
    await user.clear(quantityInput)
    await user.type(quantityInput, '10')
    
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Item',
          quantity: 10,
        })
      )
    })
  })

  it('disables form fields when isSubmitting is true', () => {
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    )
    
    expect(screen.getByLabelText(/item name/i)).toBeDisabled()
    expect(screen.getByLabelText(/quantity/i)).toBeDisabled()
    expect(screen.getByLabelText(/unit/i)).toBeDisabled()
    expect(screen.getByLabelText(/category/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('updates form when item prop changes', () => {
    const { rerender } = render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByLabelText(/item name/i)).toHaveValue('Test Item')
    
    const newItem: PantryItem = {
      ...mockItem,
      id: '2',
      name: 'Different Item',
      quantity: 10,
    }
    
    rerender(
      <EditPantryItemForm
        item={newItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByLabelText(/item name/i)).toHaveValue('Different Item')
    expect(screen.getByLabelText(/quantity/i)).toHaveValue(10)
  })

  it('handles optional fields correctly', async () => {
    const itemWithoutOptionals: PantryItem = {
      id: '1',
      name: 'Basic Item',
      quantity: 1,
      category: ItemCategory.OTHER,
      addedAt: new Date(),
      updatedAt: new Date(),
    }

    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={itemWithoutOptionals}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByLabelText(/unit/i)).toHaveValue('')
    expect(screen.getByLabelText(/low stock threshold/i)).toHaveValue(null)
    
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('submits with expiration date when provided', async () => {
    const user = userEvent.setup()
    render(
      <EditPantryItemForm
        item={mockItem}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const expirationInput = screen.getByLabelText(/expiration date/i)
    await user.clear(expirationInput)
    await user.type(expirationInput, '2026-01-15')
    
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData.expirationDate).toBeDefined()
    })
  })
})

