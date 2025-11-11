import { render, screen, fireEvent } from '@testing-library/react'
import GroceryListItem from '../GroceryListItem'
import { GroceryItem, ItemCategory } from '@/lib/types'

const mockItem: GroceryItem = {
  id: '1',
  name: 'Bananas',
  quantity: 6,
  unit: 'pcs',
  category: ItemCategory.PRODUCE,
  checked: false,
  notes: 'Get ripe ones',
  addedAt: new Date('2024-11-10'),
}

const mockOnToggle = jest.fn()

describe('GroceryListItem', () => {
  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('renders item name', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    expect(screen.getByText('Bananas')).toBeInTheDocument()
  })

  it('renders quantity with unit', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    expect(screen.getByText('6 pcs')).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    expect(screen.getByText('Produce')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    expect(screen.getByText('Get ripe ones')).toBeInTheDocument()
  })

  it('does not render notes when not provided', () => {
    const itemWithoutNotes = { ...mockItem, notes: undefined }
    render(<GroceryListItem item={itemWithoutNotes} onToggle={mockOnToggle} />)
    expect(screen.queryByText('Get ripe ones')).not.toBeInTheDocument()
  })

  it('calls onToggle when checkbox is clicked', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockOnToggle).toHaveBeenCalledWith('1')
  })

  it('applies strike-through when item is checked', () => {
    const checkedItem = { ...mockItem, checked: true }
    render(<GroceryListItem item={checkedItem} onToggle={mockOnToggle} />)
    const label = screen.getByText('Bananas')
    expect(label).toHaveClass('line-through', 'text-gray-500')
  })

  it('does not apply strike-through when item is unchecked', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    const label = screen.getByText('Bananas')
    expect(label).not.toHaveClass('line-through')
  })

  it('renders delete button', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    const deleteButton = screen.getByLabelText('Delete item')
    expect(deleteButton).toBeInTheDocument()
  })

  it('handles quantity without unit', () => {
    const itemWithoutUnit = { ...mockItem, unit: undefined }
    render(<GroceryListItem item={itemWithoutUnit} onToggle={mockOnToggle} />)
    expect(screen.getByText('6')).toBeInTheDocument()
  })
})

