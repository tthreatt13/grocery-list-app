import { render, screen, fireEvent } from '@testing-library/react'
import GroceryListItem from '../GroceryListItem'
import { GroceryItem, ItemCategory, MealType } from '@/lib/types'

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
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} onDelete={jest.fn()} />)
    const deleteButton = screen.getByLabelText('Delete item')
    expect(deleteButton).toBeInTheDocument()
  })

  it('handles quantity without unit', () => {
    const itemWithoutUnit = { ...mockItem, unit: undefined }
    render(<GroceryListItem item={itemWithoutUnit} onToggle={mockOnToggle} />)
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  // NEW TESTS FOR EDIT FUNCTIONALITY
  it('renders edit button', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} onEdit={jest.fn()} />)
    const editButton = screen.getByLabelText('Edit item')
    expect(editButton).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} onEdit={mockOnEdit} />)
    const editButton = screen.getByLabelText('Edit item')
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalledWith('1')
  })

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn()
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete item')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith('1')
  })

  // MEAL TYPE TESTS
  it('renders meal type badge when provided', () => {
    const itemWithMealType = { ...mockItem, mealType: MealType.BREAKFAST }
    render(<GroceryListItem item={itemWithMealType} onToggle={mockOnToggle} />)
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
  })

  it('does not render meal type badge when not provided', () => {
    render(<GroceryListItem item={mockItem} onToggle={mockOnToggle} />)
    expect(screen.queryByText('Breakfast')).not.toBeInTheDocument()
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument()
    expect(screen.queryByText('Snack')).not.toBeInTheDocument()
  })

  it('renders both category and meal type badges when both provided', () => {
    const itemWithBoth = { ...mockItem, mealType: MealType.LUNCH }
    render(<GroceryListItem item={itemWithBoth} onToggle={mockOnToggle} />)
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
  })

  it('renders all meal type variants correctly', () => {
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK]
    
    mealTypes.forEach((mealType) => {
      const itemWithMealType = { ...mockItem, mealType }
      const { unmount } = render(<GroceryListItem item={itemWithMealType} onToggle={mockOnToggle} />)
      expect(screen.getByText(mealType)).toBeInTheDocument()
      unmount()
    })
  })
})

