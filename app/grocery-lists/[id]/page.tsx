'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import GroceryListItem from '@/components/grocery/GroceryListItem'
import AddItemForm from '@/components/grocery/AddItemForm'
import CategoryFilter from '@/components/grocery/CategoryFilter'
import { mockGroceryLists } from '@/lib/mockData'
import { GroceryItem, ItemCategory } from '@/lib/types'
import { generateId, formatRelativeTime } from '@/lib/utils'

export default function GroceryListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  // Find the list from mock data
  const initialList = mockGroceryLists.find(list => list.id === listId)
  
  const [list, setList] = useState(initialList)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All')

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">List not found</h2>
          <p className="text-gray-600 mb-4">The list you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/grocery-lists')}>
            Back to Lists
          </Button>
        </div>
      </div>
    )
  }

  const handleToggleItem = (itemId: string) => {
    setList({
      ...list,
      items: list.items.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
      updatedAt: new Date(),
    })
  }

  const handleAddItem = (itemData: {
    name: string
    quantity: number
    unit: string
    category: ItemCategory
    notes: string
  }) => {
    const newItem: GroceryItem = {
      id: generateId(),
      name: itemData.name,
      quantity: itemData.quantity,
      unit: itemData.unit,
      category: itemData.category,
      checked: false,
      notes: itemData.notes,
      addedBy: 'John Parent',
      addedAt: new Date(),
    }

    setList({
      ...list,
      items: [...list.items, newItem],
      updatedAt: new Date(),
    })

    setIsAddModalOpen(false)
  }

  // Filter items by category
  const filteredItems = selectedCategory === 'All'
    ? list.items
    : list.items.filter(item => item.category === selectedCategory)

  // Calculate item counts per category
  const itemCounts = list.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uncheckedItems = filteredItems.filter(item => !item.checked)
  const checkedItems = filteredItems.filter(item => item.checked)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/grocery-lists')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lists
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{list.name}</h1>
              <p className="text-gray-600">
                {list.items.length} items • Updated {formatRelativeTime(list.updatedAt)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share List
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Shopping Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {checkedItems.length} / {list.items.length} items
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{
                  width: `${list.items.length > 0 ? (checkedItems.length / list.items.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Filter - Sidebar on desktop */}
          <div className="lg:col-span-1">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              itemCounts={itemCounts}
            />
          </div>

          {/* Items List */}
          <div className="lg:col-span-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-600 mb-4">Add items to your grocery list to get started</p>
                <Button onClick={() => setIsAddModalOpen(true)}>Add First Item</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Items */}
                {uncheckedItems.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      To Buy ({uncheckedItems.length})
                    </h2>
                    <div className="space-y-2">
                      {uncheckedItems.map((item) => (
                        <GroceryListItem
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Checked Items */}
                {checkedItems.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-500 mb-3">
                      Completed ({checkedItems.length})
                    </h2>
                    <div className="space-y-2 opacity-60">
                      {checkedItems.map((item) => (
                        <GroceryListItem
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Item Modal */}
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Item"
        >
          <AddItemForm
            onAdd={handleAddItem}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  )
}

