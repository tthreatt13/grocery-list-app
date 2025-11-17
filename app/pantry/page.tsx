'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import AddPantryItemForm from '@/components/pantry/AddPantryItemForm'
import EditPantryItemForm from '@/components/pantry/EditPantryItemForm'
import GenerateGroceryListModal from '@/components/pantry/GenerateGroceryListModal'
import { PantryItem, ItemCategory, SortMethod } from '@/lib/types'
import {
  getPantryItems,
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
  PantryItemResponse,
} from '@/lib/api/pantry'
import { getHouseholds, HouseholdResponse } from '@/lib/api/household'
import { 
  createGroceryList, 
  addGroceryItem, 
  getGroceryLists, 
  GroceryListResponse 
} from '@/lib/api/grocery'
import { getCategoryOrder, sortItemsByCategory } from '@/lib/utils'
import PantryItemCard from '@/components/pantry/PantryItemCard'

export default function PantryPage() {
  const { getToken } = useAuth()
  const [items, setItems] = useState<PantryItem[]>([])
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [groceryLists, setGroceryLists] = useState<GroceryListResponse[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [, setIsDeleting] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.CATEGORY)

  // Fetch households and pantry items
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        // Fetch households first
        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)
        
        // Fetch grocery lists
        const groceryListsData = await getGroceryLists(token)
        setGroceryLists(groceryListsData)
        
        // Set default household if available
        if (householdsData.length > 0) {
          const defaultHousehold = selectedHouseholdId || householdsData[0].id
          setSelectedHouseholdId(defaultHousehold)

          // Fetch pantry items for the household
          const pantryData = await getPantryItems(defaultHousehold, token)
          
          // Parse quantity string back to number and unit
          const parseQuantity = (quantityStr: string | undefined) => {
            if (!quantityStr) return { quantity: 0, unit: undefined }
            const match = quantityStr.match(/^([\d.]+)\s*(.*)$/)
            if (match) {
              return {
                quantity: parseFloat(match[1]),
                unit: match[2] || undefined
              }
            }
            return { quantity: parseFloat(quantityStr) || 0, unit: undefined }
          }
          
          const mappedItems: PantryItem[] = pantryData.map((item: PantryItemResponse) => {
            const parsed = parseQuantity(item.quantity)
            return {
              id: item.id.toString(),
              name: item.name,
              quantity: parsed.quantity,
              unit: parsed.unit,
              category: (item.category as ItemCategory) || ItemCategory.OTHER,
              expirationDate: item.expiration_date ? new Date(item.expiration_date) : undefined,
              lowStockThreshold: item.low_stock_threshold,
              addedAt: new Date(item.created_at),
              updatedAt: new Date(item.updated_at),
            }
          })
          setItems(mappedItems)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [getToken, selectedHouseholdId])

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Sort items based on selected sort method
  const sortedItems = (() => {
    switch (sortMethod) {
      case SortMethod.ENTRY_ORDER:
        return [...filteredItems].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
      case SortMethod.CATEGORY:
      default:
        return sortItemsByCategory(filteredItems)
    }
  })()

  // Helper function to render items grouped by category
  const renderItemsByCategory = (items: PantryItem[]) => {
    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<ItemCategory, PantryItem[]>)

    // Get categories in the correct order
    const categories = Object.keys(itemsByCategory) as ItemCategory[]
    const sortedCategories = categories.sort((a, b) => {
      const orderA = getCategoryOrder(a)
      const orderB = getCategoryOrder(b)
      return orderA - orderB
    })

    return (
      <div className="space-y-8">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b border-gray-200 pb-2">
              {category} ({itemsByCategory[category].length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {itemsByCategory[category].map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Helper function to render items in entry order (no grouping)
  const renderItemsByEntryOrder = (items: PantryItem[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <PantryItemCard
            key={item.id}
            item={item}
            onEdit={handleEditClick}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    )
  }

  // Helper function to render items based on current sort method
  const renderItems = (items: PantryItem[]) => {
    switch (sortMethod) {
      case SortMethod.ENTRY_ORDER:
        return renderItemsByEntryOrder(items)
      case SortMethod.CATEGORY:
      default:
        return renderItemsByCategory(items)
    }
  }

  // Handle adding new item
  const handleAddItem = async (newItem: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    if (!selectedHouseholdId) return

    try {
      setIsAdding(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const createdItem = await createPantryItem(
        {
          household_id: selectedHouseholdId,
          name: newItem.name,
          quantity: newItem.unit ? `${newItem.quantity} ${newItem.unit}` : `${newItem.quantity}`,
          category: newItem.category,
          expiration_date: newItem.expirationDate?.toISOString(),
          low_stock_threshold: newItem.lowStockThreshold,
        },
        token
      )

      // Parse quantity string back to number and unit
      const parseQuantity = (quantityStr: string | undefined) => {
        if (!quantityStr) return { quantity: 0, unit: undefined }
        const match = quantityStr.match(/^([\d.]+)\s*(.*)$/)
        if (match) {
          return {
            quantity: parseFloat(match[1]),
            unit: match[2] || undefined
          }
        }
        return { quantity: parseFloat(quantityStr) || 0, unit: undefined }
      }

      const parsed = parseQuantity(createdItem.quantity)

      const mappedItem: PantryItem = {
        id: createdItem.id.toString(),
        name: createdItem.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: (createdItem.category as ItemCategory) || ItemCategory.OTHER,
        expirationDate: createdItem.expiration_date ? new Date(createdItem.expiration_date) : undefined,
        lowStockThreshold: createdItem.low_stock_threshold,
        addedAt: new Date(createdItem.created_at),
        updatedAt: new Date(createdItem.updated_at),
      }

      setItems([mappedItem, ...items])
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  // Handle editing an item
  const handleEditClick = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      setEditingItem(item)
      setIsEditModalOpen(true)
    }
  }

  // Handle updating an item
  const handleUpdateItem = async (updatedItem: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    if (!editingItem) return

    try {
      setIsEditing(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const updated = await updatePantryItem(
        parseInt(editingItem.id),
        {
          name: updatedItem.name,
          quantity: updatedItem.unit ? `${updatedItem.quantity} ${updatedItem.unit}` : `${updatedItem.quantity}`,
          category: updatedItem.category,
          expiration_date: updatedItem.expirationDate?.toISOString(),
          low_stock_threshold: updatedItem.lowStockThreshold,
        },
        token
      )

      // Parse quantity string back to number and unit
      const parseQuantity = (quantityStr: string | undefined) => {
        if (!quantityStr) return { quantity: 0, unit: undefined }
        const match = quantityStr.match(/^([\d.]+)\s*(.*)$/)
        if (match) {
          return {
            quantity: parseFloat(match[1]),
            unit: match[2] || undefined
          }
        }
        return { quantity: parseFloat(quantityStr) || 0, unit: undefined }
      }

      const parsed = parseQuantity(updated.quantity)

      const mappedItem: PantryItem = {
        id: updated.id.toString(),
        name: updated.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: (updated.category as ItemCategory) || ItemCategory.OTHER,
        expirationDate: updated.expiration_date ? new Date(updated.expiration_date) : undefined,
        lowStockThreshold: updated.low_stock_threshold,
        addedAt: new Date(updated.created_at),
        updatedAt: new Date(updated.updated_at),
      }

      setItems(items.map((item) => (item.id === editingItem.id ? mappedItem : item)))
      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setIsEditing(false)
    }
  }

  // Handle deleting an item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      setIsDeleting(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await deletePantryItem(parseInt(id), token)
      setItems(items.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Error deleting item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate statistics
  const totalItems = items.length
  const lowStockItemsList = items.filter(
    (item) => item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold
  )
  const lowStockItems = lowStockItemsList.length
  const expiringSoonItems = items.filter((item) => {
    if (!item.expirationDate) return false
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 5
  }).length

  // Handle generating grocery list from low stock items
  const handleGenerateGroceryList = async (data: { listName: string; items: PantryItem[] }) => {
    if (!selectedHouseholdId) return

    try {
      setIsCreatingList(true)
      setError(null)
      setSuccessMessage(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Create the grocery list
      const newList = await createGroceryList(
        {
          name: data.listName,
          household_id: selectedHouseholdId,
        },
        token
      )

      // Add items to the list
      for (const item of data.items) {
        await addGroceryItem(
          newList.id,
          {
            name: item.name,
            quantity: item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`,
            category: item.category,
            notes: item.lowStockThreshold
              ? `Restock - Low stock threshold: ${item.lowStockThreshold}`
              : undefined,
            checked: false,
          },
          token
        )
      }

      setSuccessMessage(`Grocery list "${data.listName}" created successfully with ${data.items.length} items!`)
      setIsGenerateModalOpen(false)
      
      // Refresh grocery lists
      const groceryListsData = await getGroceryLists(token)
      setGroceryLists(groceryListsData)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error creating grocery list:', err)
      setError(err instanceof Error ? err.message : 'Failed to create grocery list')
    } finally {
      setIsCreatingList(false)
    }
  }

  // Handle adding items to existing grocery list
  const handleAddToGroceryList = async (data: { listId: number; items: PantryItem[] }) => {
    try {
      setIsCreatingList(true)
      setError(null)
      setSuccessMessage(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Find the list name for the success message
      const listName = groceryLists.find(list => list.id === data.listId)?.name || 'list'

      // Add items to the existing list
      for (const item of data.items) {
        await addGroceryItem(
          data.listId,
          {
            name: item.name,
            quantity: item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`,
            category: item.category,
            notes: item.lowStockThreshold
              ? `Restock - Low stock threshold: ${item.lowStockThreshold}`
              : undefined,
            checked: false,
          },
          token
        )
      }

      setSuccessMessage(`Added ${data.items.length} items to "${listName}" successfully!`)
      setIsGenerateModalOpen(false)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error adding items to grocery list:', err)
      setError(err instanceof Error ? err.message : 'Failed to add items to grocery list')
    } finally {
      setIsCreatingList(false)
    }
  }

  // Category options for filter
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Object.values(ItemCategory).map((cat) => ({
      value: cat,
      label: cat,
    })),
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pantry...</p>
        </div>
      </div>
    )
  }

  // No household state
  if (households.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Household Found</h3>
            <p className="text-gray-600 mb-4">Create or join a household to start managing your pantry</p>
            <Button onClick={() => window.location.href = '/household'}>Go to Household</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pantry Inventory</h1>
        <p className="text-sm sm:text-base text-gray-600">
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

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Filters Row */}
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
            <div className="w-full md:w-48">
              <Select
                label="Sort by"
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value as SortMethod)}
              >
                <option value={SortMethod.CATEGORY}>Category</option>
                <option value={SortMethod.ENTRY_ORDER}>Entry Order</option>
              </Select>
            </div>
          </div>
          
          {/* Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsGenerateModalOpen(true)} 
              className="w-full sm:w-auto"
              disabled={lowStockItems === 0}
            >
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Generate Grocery List
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
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
      </div>

      {/* Items Display */}
      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {items.length === 0 ? "No items in your pantry" : "No matching items"}
            </h3>
            <p className="text-gray-500">
              {items.length === 0 
                ? "Start adding items to keep track of your pantry inventory"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        </div>
      ) : (
        renderItems(sortedItems)
      )}

      {/* Add Item Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => !isAdding && setIsModalOpen(false)}
        title="Add Pantry Item"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <AddPantryItemForm
          onSubmit={handleAddItem}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isAdding}
        />
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => !isEditing && setIsEditModalOpen(false)}
        title="Edit Pantry Item"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        {editingItem && (
          <EditPantryItemForm
            item={editingItem}
            onSubmit={handleUpdateItem}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingItem(null)
            }}
            isSubmitting={isEditing}
          />
        )}
      </Modal>

      {/* Generate Grocery List Modal */}
      <GenerateGroceryListModal
        open={isGenerateModalOpen}
        onClose={() => !isCreatingList && setIsGenerateModalOpen(false)}
        lowStockItems={lowStockItemsList}
        onCreateList={handleGenerateGroceryList}
        onAddToList={handleAddToGroceryList}
        existingLists={groceryLists}
        isCreating={isCreatingList}
      />
    </div>
  )
}
