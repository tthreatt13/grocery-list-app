import { render, screen } from '@testing-library/react'
import PantryItemCard from '../PantryItemCard'
import { PantryItem, ItemCategory } from '@/lib/types'

const mockPantryItem: PantryItem = {
  id: '1',
  name: 'Tomatoes',
  quantity: 5,
  unit: 'pcs',
  category: ItemCategory.PRODUCE,
  expirationDate: new Date('2025-11-20'),
  lowStockThreshold: 3,
  addedAt: new Date('2024-11-01'),
  updatedAt: new Date('2024-11-10'),
}

const lowStockItem: PantryItem = {
  ...mockPantryItem,
  id: '2',
  name: 'Milk',
  quantity: 1,
  lowStockThreshold: 2,
  category: ItemCategory.DAIRY,
}

const expiringSoonItem: PantryItem = {
  ...mockPantryItem,
  id: '3',
  name: 'Yogurt',
  expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  category: ItemCategory.DAIRY,
}

const expiredItem: PantryItem = {
  ...mockPantryItem,
  id: '4',
  name: 'Old Bread',
  expirationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  category: ItemCategory.BAKERY,
}

describe('PantryItemCard', () => {
  it('renders item name', () => {
    render(<PantryItemCard item={mockPantryItem} />)
    expect(screen.getByText('Tomatoes')).toBeInTheDocument()
  })

  it('displays quantity with unit', () => {
    render(<PantryItemCard item={mockPantryItem} />)
    expect(screen.getByText('5 pcs')).toBeInTheDocument()
  })

  it('displays quantity without unit when unit is not provided', () => {
    const itemWithoutUnit = { ...mockPantryItem, unit: undefined }
    render(<PantryItemCard item={itemWithoutUnit} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('displays category badge', () => {
    render(<PantryItemCard item={mockPantryItem} />)
    expect(screen.getByText('Produce')).toBeInTheDocument()
  })

  it('displays expiration date when provided', () => {
    render(<PantryItemCard item={mockPantryItem} />)
    expect(screen.getByText(/Expires/i)).toBeInTheDocument()
  })

  it('shows low stock indicator when quantity is below threshold', () => {
    render(<PantryItemCard item={lowStockItem} />)
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('does not show low stock indicator when quantity is above threshold', () => {
    render(<PantryItemCard item={mockPantryItem} />)
    expect(screen.queryByText('Low Stock')).not.toBeInTheDocument()
  })

  it('shows expiring soon indicator when expiration is within 3 days', () => {
    render(<PantryItemCard item={expiringSoonItem} />)
    expect(screen.getByText(/Expires Soon/i)).toBeInTheDocument()
  })

  it('shows expired indicator when expiration date has passed', () => {
    render(<PantryItemCard item={expiredItem} />)
    expect(screen.getByText(/Expired/i)).toBeInTheDocument()
  })
})
