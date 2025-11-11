import { render, screen, fireEvent } from '@testing-library/react'
import CategoryFilter from '../CategoryFilter'
import { ItemCategory } from '@/lib/types'

const mockOnSelectCategory = jest.fn()

describe('CategoryFilter', () => {
  beforeEach(() => {
    mockOnSelectCategory.mockClear()
  })

  it('renders all category options including "All"', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
      />
    )
    
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('Dairy')).toBeInTheDocument()
    expect(screen.getByText('Meat')).toBeInTheDocument()
    expect(screen.getByText('Bakery')).toBeInTheDocument()
    expect(screen.getByText('Pantry')).toBeInTheDocument()
    expect(screen.getByText('Frozen')).toBeInTheDocument()
    expect(screen.getByText('Beverages')).toBeInTheDocument()
    expect(screen.getByText('Snacks')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('highlights the selected category', () => {
    render(
      <CategoryFilter
        selectedCategory={ItemCategory.PRODUCE}
        onSelectCategory={mockOnSelectCategory}
      />
    )
    
    const produceButton = screen.getByText('Produce').closest('button')
    expect(produceButton).toHaveClass('bg-green-50', 'text-green-700')
  })

  it('calls onSelectCategory when a category is clicked', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
      />
    )
    
    fireEvent.click(screen.getByText('Produce'))
    expect(mockOnSelectCategory).toHaveBeenCalledWith(ItemCategory.PRODUCE)
  })

  it('displays item counts when provided', () => {
    const itemCounts = {
      [ItemCategory.PRODUCE]: 5,
      [ItemCategory.DAIRY]: 3,
      [ItemCategory.MEAT]: 2,
    }
    
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
        itemCounts={itemCounts}
      />
    )
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calculates total count for "All" category', () => {
    const itemCounts = {
      [ItemCategory.PRODUCE]: 5,
      [ItemCategory.DAIRY]: 3,
      [ItemCategory.MEAT]: 2,
    }
    
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
        itemCounts={itemCounts}
      />
    )
    
    // Total should be 5 + 3 + 2 = 10
    const allButton = screen.getByText('All').closest('button')
    expect(allButton).toHaveTextContent('10')
  })

  it('does not display count badge when count is 0', () => {
    const itemCounts = {
      [ItemCategory.PRODUCE]: 0,
    }
    
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
        itemCounts={itemCounts}
      />
    )
    
    const produceButton = screen.getByText('Produce').closest('button')
    expect(produceButton?.querySelector('.px-2.py-0\\.5')).not.toBeInTheDocument()
  })

  it('applies correct styling to selected category count badge', () => {
    const itemCounts = {
      [ItemCategory.PRODUCE]: 5,
    }
    
    render(
      <CategoryFilter
        selectedCategory={ItemCategory.PRODUCE}
        onSelectCategory={mockOnSelectCategory}
        itemCounts={itemCounts}
      />
    )
    
    const produceButton = screen.getByText('Produce').closest('button')
    const countBadge = produceButton?.querySelector('span:last-child')
    expect(countBadge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('applies hover styles to non-selected categories', () => {
    render(
      <CategoryFilter
        selectedCategory={ItemCategory.PRODUCE}
        onSelectCategory={mockOnSelectCategory}
      />
    )
    
    const dairyButton = screen.getByText('Dairy').closest('button')
    expect(dairyButton).toHaveClass('hover:bg-gray-50')
  })

  it('renders title', () => {
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={mockOnSelectCategory}
      />
    )
    
    expect(screen.getByText('Filter by Category')).toBeInTheDocument()
  })
})

