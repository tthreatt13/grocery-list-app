'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import PantryGrid from '@/components/pantry/PantryGrid'
import AddPantryItemForm from '@/components/pantry/AddPantryItemForm'
import { mockPantryItems } from '@/lib/mockData'
import { PantryItem, ItemCategory } from '@/lib/types'

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>(mockPantryItems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Handle adding new item
  const handleAddItem = (newItem: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    const item: PantryItem = {
      ...newItem,
      id: `p${Date.now()}`,
      addedAt: new Date(),
      updatedAt: new Date(),
    }
    setItems([item, ...items])
    setIsModalOpen(false)
  }

  // Calculate statistics
  const totalItems = items.length
  const lowStockItems = items.filter(
    (item) => item.lowStockThreshold && item.quantity <= item.lowStockThreshold
  ).length
  const expiringSoonItems = items.filter((item) => {
    if (!item.expirationDate) return false
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 3
  }).length

  // Category options for filter
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Object.values(ItemCategory).map((cat) => ({
      value: cat,
      label: cat,
    })),
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pantry Inventory</h1>
        <p className="text-gray-600">
          Keep track of your pantry items and get alerts for low stock and expiring items
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-gray-900">{expiringSoonItems}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              id="search"
              type="text"
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
            />
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add to Pantry
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      <PantryGrid items={filteredItems} />

      {/* Add Item Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Pantry Item"
      >
        <AddPantryItemForm
          onSubmit={handleAddItem}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

