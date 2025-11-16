import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddPantryItemForm from '../AddPantryItemForm'
import { ItemCategory } from '@/lib/types'

describe('AddPantryItemForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/low stock threshold/i)).toBeInTheDocument()
  })

  it('renders submit and cancel buttons', () => {
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates quantity cannot be zero', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const nameInput = screen.getByLabelText(/item name/i)
    const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement
    
    await user.type(nameInput, 'Test Item')
    
    // Use fireEvent to directly change the value to 0
    fireEvent.change(quantityInput, { target: { value: 0 } })
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    // Just verify submission didn't happen with invalid quantity
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.type(screen.getByLabelText(/item name/i), 'Tomatoes')
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '5')
    await user.type(screen.getByLabelText(/unit/i), 'pcs')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, ItemCategory.PRODUCE)
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tomatoes',
          quantity: 5,
          unit: 'pcs',
          category: ItemCategory.PRODUCE,
        })
      )
    })
  })

  it('submits form with expiration date when provided', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.type(screen.getByLabelText(/item name/i), 'Milk')
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '2')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, ItemCategory.DAIRY)
    
    const expirationInput = screen.getByLabelText(/expiration date/i)
    await user.type(expirationInput, '2025-12-31')
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData.expirationDate).toBeDefined()
    })
  })

  it('submits form with low stock threshold when provided', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.type(screen.getByLabelText(/item name/i), 'Eggs')
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '12')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, ItemCategory.DAIRY)
    
    await user.type(screen.getByLabelText(/low stock threshold/i), '6')
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          lowStockThreshold: 6,
        })
      )
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    await user.type(screen.getByLabelText(/item name/i), 'Test Item')
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '3')
    
    await user.click(screen.getByRole('button', { name: /add item/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
    
    expect(screen.getByLabelText(/item name/i)).toHaveValue('')
    expect(screen.getByLabelText(/quantity/i)).toHaveValue(1)
  })

  it('displays all category options', () => {
    render(<AddPantryItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const categorySelect = screen.getByLabelText(/category/i)
    const options = Array.from(categorySelect.querySelectorAll('option'))
    
    expect(options.length).toBeGreaterThan(0)
    expect(options.map(opt => opt.textContent)).toContain('Produce')
    expect(options.map(opt => opt.textContent)).toContain('Dairy')
    expect(options.map(opt => opt.textContent)).toContain('Meat')
  })
})

