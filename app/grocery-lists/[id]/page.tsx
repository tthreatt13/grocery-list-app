'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import GroceryListItem from '@/components/grocery/GroceryListItem'
import AddItemForm from '@/components/grocery/AddItemForm'
import EditItemForm from '@/components/grocery/EditItemForm'
import SortMethodSelector from '@/components/grocery/SortMethodSelector'
import ReuseListModal from '@/components/grocery/ReuseListModal'
import {
  ItemCategory,
  GroceryItem,
  MealType,
  SortMethod,
  GroceryList,
} from '@/lib/types'
import {
  formatRelativeTime,
  sortItemsByCategory,
  sortItemsByMealTime,
  sortItemsByEntryOrder,
  getCategoryOrder,
  getMealOrder,
} from '@/lib/utils'
import {
  getGroceryList,
  getGroceryListsWithItems,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  updateGroceryList,
} from '@/lib/api/grocery'
import {
  transformGroceryItem,
  transformGroceryList,
  transformGroceryLists,
} from '@/lib/adapters/groceryAdapters'

// Helper function to parse quantity string (e.g., "2 lbs" -> { quantity: 2, unit: "lbs" })
function parseQuantityString(quantityStr?: string): {
  quantity: number
  unit: string
} {
  if (!quantityStr) {
    return { quantity: 1, unit: '' }
  }

  const parts = quantityStr.trim().split(/\s+/)
  if (parts.length === 0) {
    return { quantity: 1, unit: '' }
  }

  const numStr = parts[0]
  const num = parseFloat(numStr)

  if (isNaN(num)) {
    // If first part is not a number, treat entire string as unit
    return { quantity: 1, unit: quantityStr }
  }

  // Join remaining parts as unit
  const unit = parts.slice(1).join(' ')
  return { quantity: num, unit }
}

export default function GroceryListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const listId = parseInt(params.id as string)

  const [list, setList] = useState<GroceryList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.CATEGORY)
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)
  const [isReuseModalOpen, setIsReuseModalOpen] = useState(false)
  const [availableLists, setAvailableLists] = useState<GroceryList[]>([])
  const [isLoadingAvailableLists, setIsLoadingAvailableLists] = useState(false)

  // Fetch list data
  useEffect(() => {
    async function fetchList() {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        const listDataResponse = await getGroceryList(listId, token)
        const listData = transformGroceryList(listDataResponse)
        setList(listData)
      } catch (err) {
        console.error('Error fetching list:', err)
        setError(err instanceof Error ? err.message : 'Failed to load list')
      } finally {
        setIsLoading(false)
      }
    }

    if (listId) {
      fetchList()
    }
  }, [listId, getToken])

  const handleToggleItem = async (itemId: string) => {
    if (!list) return

    const item = list.items.find((i) => i.id === itemId)
    if (!item) return

    try {
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Optimistic update
      setList({
        ...list,
        items: list.items.map((i) =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        ),
      })

      // Update on server
      await updateGroceryItem(
        listId,
        parseInt(itemId),
        { checked: !item.checked },
        token
      )
    } catch (err) {
      console.error('Error toggling item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update item')
      // Revert optimistic update on error
      setList({
        ...list,
        items: list.items.map((i) =>
          i.id === itemId ? { ...i, checked: item.checked } : i
        ),
      })
    }
  }

  const handleAddItem = async (itemData: {
    name: string
    quantity: number
    unit: string
    category: ItemCategory
    mealType?: MealType
    notes: string
  }) => {
    if (!list) return

    try {
      setIsAddingItem(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Format quantity string: combine quantity and unit
      let quantityStr: string | undefined
      if (itemData.unit.trim()) {
        quantityStr = `${itemData.quantity} ${itemData.unit.trim()}`
      } else if (itemData.quantity !== 1) {
        quantityStr = itemData.quantity.toString()
      }

      const newItemResponse = await addGroceryItem(
        listId,
        {
          name: itemData.name,
          quantity: quantityStr,
          category: itemData.category,
          meal_type: itemData.mealType?.toLowerCase(),
          notes: itemData.notes || undefined,
          checked: false,
        },
        token
      )

      // Transform the API response to match frontend types
      const newItem = transformGroceryItem(newItemResponse)

      setList({
        ...list,
        items: [...list.items, newItem],
      })

      setIsAddModalOpen(false)
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleEditItem = (itemId: string) => {
    if (!list) return

    const item = list.items.find((i) => i.id === itemId)
    if (!item) return

    const { quantity, unit } = parseQuantityString(item.quantity?.toString())

    setEditingItem({
      id: item.id,
      name: item.name,
      quantity,
      unit,
      category: (item.category as ItemCategory) || ItemCategory.OTHER,
      mealType: item.mealType || undefined,
      checked: item.checked,
      notes: item.notes,
      addedAt: item.addedAt,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveItem = async (
    itemId: string,
    itemData: {
      name: string
      quantity: number
      unit: string
      category: ItemCategory
      mealType?: MealType
      notes: string
    }
  ) => {
    if (!list) return

    try {
      setIsSavingItem(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Format quantity string: combine quantity and unit
      let quantityStr: string | undefined
      if (itemData.unit.trim()) {
        quantityStr = `${itemData.quantity} ${itemData.unit.trim()}`
      } else if (itemData.quantity !== 1) {
        quantityStr = itemData.quantity.toString()
      }

      const updatedItemResponse = await updateGroceryItem(
        listId,
        parseInt(itemId),
        {
          name: itemData.name,
          quantity: quantityStr,
          category: itemData.category,
          meal_type: itemData.mealType?.toLowerCase(),
          notes: itemData.notes || undefined,
        },
        token
      )

      // Transform the API response to match frontend types
      const updatedItem = transformGroceryItem(updatedItemResponse)

      setList({
        ...list,
        items: list.items.map((i) => (i.id === itemId ? updatedItem : i)),
      })

      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!list) return

    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Optimistic update
      setList({
        ...list,
        items: list.items.filter((i) => i.id !== itemId),
      })

      // Delete on server
      await deleteGroceryItem(listId, parseInt(itemId), token)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      // Refetch to restore item
      const token = await getToken()
      if (token) {
        const listDataResponse = await getGroceryList(listId, token)
        const listData = transformGroceryList(listDataResponse)
        setList(listData)
      }
    }
  }

  const handleEditTitleClick = () => {
    if (!list) return
    setEditedTitle(list.name)
    setIsEditTitleModalOpen(true)
  }

  const handleUpdateTitle = async () => {
    if (!list || !editedTitle.trim()) return

    try {
      setIsUpdatingTitle(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await updateGroceryList(listId, { name: editedTitle.trim() }, token)

      // Update local state
      setList({
        ...list,
        name: editedTitle.trim(),
      })

      setIsEditTitleModalOpen(false)
      setEditedTitle('')
    } catch (err) {
      console.error('Error updating title:', err)
      setError(err instanceof Error ? err.message : 'Failed to update title')
    } finally {
      setIsUpdatingTitle(false)
    }
  }

  const handleOpenReuseModal = async () => {
    setIsReuseModalOpen(true)
    setIsLoadingAvailableLists(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const listsDataResponse = await getGroceryListsWithItems(token)
      const listsData = transformGroceryLists(listsDataResponse)
      // Sort by createdAt descending (newest first)
      listsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setAvailableLists(listsData)
    } catch (err) {
      console.error('Error fetching available lists:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lists')
    } finally {
      setIsLoadingAvailableLists(false)
    }
  }

  const handleAddItemsFromPreviousList = async (items: GroceryItem[]) => {
    if (!list) return

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Add each item to the current list
      const newItems: GroceryItem[] = []
      for (const item of items) {
        // Format quantity string: combine quantity and unit
        let quantityStr: string | undefined
        if (item.unit && item.unit.trim()) {
          quantityStr = `${item.quantity} ${item.unit.trim()}`
        } else if (item.quantity !== 1) {
          quantityStr = item.quantity.toString()
        }

        const newItemResponse = await addGroceryItem(
          listId,
          {
            name: item.name,
            quantity: quantityStr,
            category: item.category,
            meal_type: item.mealType?.toLowerCase(),
            notes: item.notes || undefined,
            checked: false, // Always add as unchecked
          },
          token
        )

        const newItem = transformGroceryItem(newItemResponse)
        newItems.push(newItem)
      }

      // Update local list state
      setList({
        ...list,
        items: [...list.items, ...newItems],
      })

      // Refresh the list to get updated data
      const listDataResponse = await getGroceryList(listId, token)
      const listData = transformGroceryList(listDataResponse)
      setList(listData)
    } catch (err) {
      console.error('Error adding items from previous list:', err)
      throw err // Re-throw to let the modal handle the error
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading list...</p>
        </div>
      </div>
    )
  }

  // Error or not found state
  if (error || !list) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <svg
            className="w-16 h-16 mx-auto text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error ? 'Error Loading List' : 'List Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The list you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push('/grocery-lists')}>
            Back to Lists
          </Button>
        </div>
      </div>
    )
  }

  // Sort items based on selected sort method
  const sortedItems = (() => {
    switch (sortMethod) {
      case SortMethod.ENTRY_ORDER:
        return sortItemsByEntryOrder(list.items)
      case SortMethod.MEAL_TIME:
        return sortItemsByMealTime(list.items)
      case SortMethod.CATEGORY:
      default:
        return sortItemsByCategory(list.items)
    }
  })()

  const uncheckedItems = sortedItems.filter((item) => !item.checked)
  const checkedItems = sortedItems.filter((item) => item.checked)

  // Helper function to render items grouped by category
  const renderItemsByCategory = (items: GroceryItem[]) => {
    // Group items by category
    const itemsByCategory = items.reduce(
      (acc, item) => {
        const category = item.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(item)
        return acc
      },
      {} as Record<ItemCategory, GroceryItem[]>
    )

    // Get categories in the correct order
    const categories = Object.keys(itemsByCategory) as ItemCategory[]
    const sortedCategories = categories.sort((a, b) => {
      const orderA = getCategoryOrder(a)
      const orderB = getCategoryOrder(b)
      return orderA - orderB
    })

    return (
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1">
              {category}
            </h3>
            <div className="space-y-2">
              {itemsByCategory[category].map((item) => (
                <GroceryListItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Helper function to render items grouped by meal type
  const renderItemsByMealType = (items: GroceryItem[]) => {
    // Group items by meal type
    const itemsByMealType = items.reduce(
      (acc, item) => {
        const mealType = item.mealType || 'No meal assignment'
        if (!acc[mealType]) {
          acc[mealType] = []
        }
        acc[mealType].push(item)
        return acc
      },
      {} as Record<string, GroceryItem[]>
    )

    // Get meal types in the correct order
    const mealTypes = Object.keys(itemsByMealType)
    const sortedMealTypes = mealTypes.sort((a, b) => {
      const orderA =
        a === 'No meal assignment' ? 999 : getMealOrder(a as MealType)
      const orderB =
        b === 'No meal assignment' ? 999 : getMealOrder(b as MealType)
      return orderA - orderB
    })

    return (
      <div className="space-y-6">
        {sortedMealTypes.map((mealType) => (
          <div key={mealType} className="space-y-3">
            <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1">
              {mealType}
            </h3>
            <div className="space-y-2">
              {itemsByMealType[mealType].map((item) => (
                <GroceryListItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleItem}
                  onEdit={handleEditItem}
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
  const renderItemsByEntryOrder = (items: GroceryItem[]) => {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <GroceryListItem
            key={item.id}
            item={item}
            onToggle={handleToggleItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    )
  }

  // Helper function to render items based on current sort method
  const renderItems = (items: GroceryItem[]) => {
    switch (sortMethod) {
      case SortMethod.ENTRY_ORDER:
        return renderItemsByEntryOrder(items)
      case SortMethod.MEAL_TIME:
        return renderItemsByMealType(items)
      case SortMethod.CATEGORY:
      default:
        return renderItemsByCategory(items)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/grocery-lists')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Lists
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {list.name}
                </h1>
                <button
                  onClick={handleEditTitleClick}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                  aria-label="Edit list title"
                  title="Edit list title"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {list.items.length} items • Updated{' '}
                {formatRelativeTime(list.updatedAt)}
              </p>
            </div>
            {/* Share List button - hidden until functionality is implemented */}
            {/* <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share List
              </Button>
            </div> */}
          </div>

          {/* Shopping Progress */}
          <Card className="mt-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Shopping Progress
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {checkedItems.length} / {list.items.length} items
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${list.items.length > 0 ? (checkedItems.length / list.items.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Item
            </Button>
            <Button
              onClick={handleOpenReuseModal}
              variant="outline"
              className="w-full sm:w-auto"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reuse from Previous List
            </Button>
            <div className="w-full sm:w-48">
              <SortMethodSelector value={sortMethod} onChange={setSortMethod} />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div>
          {sortedItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No items yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add items to your grocery list to get started
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Items */}
              {uncheckedItems.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    To Buy ({uncheckedItems.length})
                  </h2>
                  {renderItems(uncheckedItems)}
                </div>
              )}

              {/* Checked Items */}
              {checkedItems.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-500 mb-3">
                    Completed ({checkedItems.length})
                  </h2>
                  <div className="opacity-60">{renderItems(checkedItems)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        <Modal
          open={isAddModalOpen}
          onClose={() => !isAddingItem && setIsAddModalOpen(false)}
          title="Add New Item"
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <AddItemForm
            onAdd={handleAddItem}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </Modal>

        {/* Edit Item Modal */}
        {editingItem && (
          <Modal
            open={isEditModalOpen}
            onClose={() => !isSavingItem && setIsEditModalOpen(false)}
            title="Edit Item"
            closeOnBackdropClick={false}
            closeOnEscape={false}
          >
            <EditItemForm
              item={editingItem}
              onSave={handleSaveItem}
              onCancel={() => {
                setIsEditModalOpen(false)
                setEditingItem(null)
              }}
              isSubmitting={isSavingItem}
            />
          </Modal>
        )}

        {/* Edit Title Modal */}
        <Modal
          open={isEditTitleModalOpen}
          onClose={() => !isUpdatingTitle && setIsEditTitleModalOpen(false)}
          title="Edit List Title"
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <div className="space-y-4">
            <Input
              label="List Name"
              placeholder="e.g., Weekly Shopping, Party Supplies"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyPress={(e) => {
                if (
                  e.key === 'Enter' &&
                  !isUpdatingTitle &&
                  editedTitle.trim()
                ) {
                  handleUpdateTitle()
                }
              }}
              autoFocus
            />
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditTitleModalOpen(false)
                  setEditedTitle('')
                }}
                disabled={isUpdatingTitle}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTitle}
                disabled={!editedTitle.trim() || isUpdatingTitle}
              >
                {isUpdatingTitle ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reuse from Previous List Modal */}
        <Modal
          open={isReuseModalOpen}
          onClose={() => !isLoadingAvailableLists && setIsReuseModalOpen(false)}
          title="Reuse Items from Previous List"
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <ReuseListModal
            currentListId={listId}
            availableLists={availableLists}
            onAddItems={handleAddItemsFromPreviousList}
            onClose={() => setIsReuseModalOpen(false)}
            isLoading={isLoadingAvailableLists}
          />
        </Modal>
      </div>
    </div>
  )
}
