import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddItemForm from '../AddItemForm'
import { ItemCategory } from '@/lib/types'

const mockOnAdd = jest.fn()
const mockOnCancel = jest.fn()

describe('AddItemForm', () => {
  beforeEach(() => {
    mockOnAdd.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders all form fields', () => {
    render(<AddItemForm onAdd={mockOnAdd} />)

    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<AddItemForm onAdd={mockOnAdd} />)
    expect(
      screen.getByRole('button', { name: /add item/i })
    ).toBeInTheDocument()
  })

  it('renders cancel button when onCancel is provided', () => {
    render(<AddItemForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render cancel button when onCancel is not provided', () => {
    render(<AddItemForm onAdd={mockOnAdd} />)
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument()
  })

  it('calls onAdd with form data when submitted', async () => {
    const user = userEvent.setup()
    render(<AddItemForm onAdd={mockOnAdd} />)

    await user.type(screen.getByLabelText(/item name/i), 'Bananas')
    await user.clear(screen.getByLabelText(/quantity/i))
    await user.type(screen.getByLabelText(/quantity/i), '6')
    await user.type(screen.getByLabelText(/unit/i), 'pcs')

    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, ItemCategory.PRODUCE)

    await user.type(screen.getByLabelText(/notes/i), 'Get ripe ones')

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Bananas',
        quantity: 6,
        unit: 'pcs',
        category: ItemCategory.PRODUCE,
        notes: 'Get ripe ones',
      })
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    render(<AddItemForm onAdd={mockOnAdd} />)

    const nameInput = screen.getByLabelText(/item name/i) as HTMLInputElement
    await user.type(nameInput, 'Bananas')

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(nameInput.value).toBe('')
    })
  })

  it('does not submit when name is empty', async () => {
    render(<AddItemForm onAdd={mockOnAdd} />)

    // Clear the name field to ensure it's empty
    const nameInput = screen.getByLabelText(/item name/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(mockOnAdd).not.toHaveBeenCalled()
    })
  })

  it('disables submit button when name is empty', () => {
    render(<AddItemForm onAdd={mockOnAdd} />)

    const nameInput = screen.getByLabelText(/item name/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /add item/i })

    // Initially empty
    fireEvent.change(nameInput, { target: { value: '' } })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when name has value', async () => {
    const user = userEvent.setup()
    render(<AddItemForm onAdd={mockOnAdd} />)

    const submitButton = screen.getByRole('button', { name: /add item/i })
    await user.type(screen.getByLabelText(/item name/i), 'Bananas')

    expect(submitButton).not.toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<AddItemForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('has default quantity of 1', () => {
    render(<AddItemForm onAdd={mockOnAdd} />)
    const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement
    expect(quantityInput.value).toBe('1')
  })

  it('allows decimal quantities', async () => {
    const user = userEvent.setup()
    render(<AddItemForm onAdd={mockOnAdd} />)

    const quantityInput = screen.getByLabelText(/quantity/i)
    await user.clear(quantityInput)
    await user.type(quantityInput, '2.5')

    await user.type(screen.getByLabelText(/item name/i), 'Chicken')
    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 2.5 })
      )
    })
  })

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup()
    render(<AddItemForm onAdd={mockOnAdd} />)

    await user.type(screen.getByLabelText(/item name/i), '  Bananas  ')
    await user.type(screen.getByLabelText(/unit/i), '  pcs  ')
    await user.type(screen.getByLabelText(/notes/i), '  Get ripe ones  ')

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Bananas',
        quantity: 1,
        unit: 'pcs',
        category: ItemCategory.OTHER,
        notes: 'Get ripe ones',
      })
    })
  })
})
