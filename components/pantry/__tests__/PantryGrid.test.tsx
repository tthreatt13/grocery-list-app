import { render, screen } from '@testing-library/react'
import PantryGrid from '../PantryGrid'
import { PantryItem, ItemCategory } from '@/lib/types'

const mockItems: PantryItem[] = [
  {
    id: '1',
    name: 'Tomatoes',
    quantity: 5,
    unit: 'pcs',
    category: ItemCategory.PRODUCE,
    expirationDate: new Date('2025-12-31'),
    addedAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: '2',
    name: 'Milk',
    quantity: 2,
    unit: 'gallons',
    category: ItemCategory.DAIRY,
    expirationDate: new Date('2025-11-15'),
    addedAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: '3',
    name: 'Rice',
    quantity: 10,
    unit: 'lbs',
    category: ItemCategory.PANTRY,
    addedAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-11-01'),
  },
]

describe('PantryGrid', () => {
  it('renders all pantry items', () => {
    render(<PantryGrid items={mockItems} />)
    
    expect(screen.getByText('Tomatoes')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
  })

  it('renders empty state when no items provided', () => {
    render(<PantryGrid items={[]} />)
    
    expect(screen.getByText(/no items in your pantry/i)).toBeInTheDocument()
  })

  it('displays items in a grid layout', () => {
    const { container } = render(<PantryGrid items={mockItems} />)
    
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })

  it('renders correct number of items', () => {
    render(<PantryGrid items={mockItems} />)
    
    const items = screen.getAllByText(/pcs|gallons|lbs/i)
    expect(items.length).toBe(3)
  })

  it('applies responsive grid classes', () => {
    const { container } = render(<PantryGrid items={mockItems} />)
    
    const grid = container.querySelector('.grid')
    expect(grid?.className).toMatch(/grid-cols/)
  })
})

