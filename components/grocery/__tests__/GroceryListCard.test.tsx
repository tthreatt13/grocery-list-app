import { render, screen } from '@testing-library/react'
import GroceryListCard from '../GroceryListCard'
import { GroceryList, ItemCategory } from '@/lib/types'

const mockList: GroceryList = {
  id: '1',
  name: 'Weekly Shopping',
  items: [
    {
      id: '1',
      name: 'Bananas',
      quantity: 6,
      category: ItemCategory.PRODUCE,
      checked: false,
      addedAt: new Date('2024-11-10'),
    },
    {
      id: '2',
      name: 'Milk',
      quantity: 2,
      category: ItemCategory.DAIRY,
      checked: true,
      addedAt: new Date('2024-11-10'),
    },
  ],
  createdBy: 'John',
  createdAt: new Date('2024-11-09'),
  updatedAt: new Date('2024-11-10'),
  sharedWith: ['jane@example.com'],
  isArchived: false,
}

describe('GroceryListCard', () => {
  it('renders list name', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
  })

  it('displays item count correctly', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('shows shared badge when list is shared', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('Shared')).toBeInTheDocument()
  })

  it('does not show shared badge when list is not shared', () => {
    const unsharedList = { ...mockList, sharedWith: [] }
    render(<GroceryListCard list={unsharedList} />)
    expect(screen.queryByText('Shared')).not.toBeInTheDocument()
  })

  it('displays member count when shared', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('2 members')).toBeInTheDocument()
  })

  it('calculates completion percentage correctly', () => {
    const { container } = render(<GroceryListCard list={mockList} />)
    const progressBar = container.querySelector('.bg-green-600')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('handles empty list', () => {
    const emptyList = { ...mockList, items: [] }
    render(<GroceryListCard list={emptyList} />)
    expect(screen.getByText('0 / 0')).toBeInTheDocument()
  })

  it('links to the correct detail page', () => {
    const { container } = render(<GroceryListCard list={mockList} />)
    const link = container.querySelector('a')
    expect(link).toHaveAttribute('href', '/grocery-lists/1')
  })
})

