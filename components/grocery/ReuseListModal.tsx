'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { GroceryList, GroceryItem, MealType } from '@/lib/types'
import { formatQuantity } from '@/lib/utils'

interface ReuseListModalProps {
  currentListId: string | number
  availableLists: GroceryList[]
  onAddItems: (items: GroceryItem[]) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export default function ReuseListModal({
  currentListId,
  availableLists,
  onAddItems,
  onClose,
  isLoading = false,
}: ReuseListModalProps) {
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isAddingItems, setIsAddingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out current list from available lists
  const previousLists = useMemo(
    () =>
      availableLists.filter(
        (list) => list.id.toString() !== currentListId.toString()
      ),
    [availableLists, currentListId]
  )

  // When a list is selected, set it and pre-select all items
  useEffect(() => {
    if (!selectedListId) {
      setSelectedList(null)
      setSelectedItemIds([])
      return
    }

    const list = previousLists.find((l) => l.id.toString() === selectedListId)
    if (list) {
      setSelectedList(list)
      // Pre-select all items
      setSelectedItemIds(list.items.map((item) => item.id))
    } else {
      setSelectedList(null)
      setSelectedItemIds([])
    }
  }, [selectedListId, previousLists])

  const handleToggleItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        // Remove item from array
        return prev.filter((id) => id !== itemId)
      } else {
        // Add item to array
        return [...prev, itemId]
      }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (!selectedList) return
    setSelectedItemIds(selectedList.items.map((item) => item.id))
  }, [selectedList])

  const handleDeselectAll = useCallback(() => {
    if (!selectedList) return
    // Clear all selections
    setSelectedItemIds([])
  }, [selectedList])

  const handleAddItems = async () => {
    if (!selectedList || selectedItemIds.length === 0) return

    try {
      setIsAddingItems(true)
      setError(null)

      const itemsToAdd = selectedList.items.filter((item) =>
        selectedItemIds.includes(item.id)
      )
      await onAddItems(itemsToAdd)

      // Reset state and close modal on success
      setSelectedListId('')
      setSelectedList(null)
      setSelectedItemIds([])
      onClose()
    } catch (err) {
      console.error('Error adding items:', err)
      setError(err instanceof Error ? err.message : 'Failed to add items')
    } finally {
      setIsAddingItems(false)
    }
  }

  const getBadgeVariant = (
    category: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (category) {
      case 'Produce':
        return 'success'
      case 'Dairy':
        return 'primary'
      case 'Meat':
        return 'danger'
      case 'Bakery':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getMealBadgeVariant = (
    mealType?: MealType
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (mealType) {
      case MealType.BREAKFAST:
        return 'warning'
      case MealType.LUNCH:
        return 'primary'
      case MealType.DINNER:
        return 'danger'
      case MealType.SNACK:
        return 'success'
      default:
        return 'default'
    }
  }

  const allSelected =
    selectedList &&
    selectedList.items.length > 0 &&
    selectedItemIds.length === selectedList.items.length

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* List Selection */}
      <div>
        <Select
          label="Select Previous List"
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
          disabled={isLoading || previousLists.length === 0}
        >
          <option value="">Choose a list...</option>
          {previousLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.items.length} items)
            </option>
          ))}
        </Select>
        {previousLists.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No previous lists available
          </p>
        )}
      </div>

      {/* Items List */}
      {selectedList && (
        <div className="space-y-4">
          {/* Select All / Deselect All */}
          {selectedList.items.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                {allSelected ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="text-sm py-1 px-3"
                  >
                    Deselect All
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-sm py-1 px-3"
                  >
                    Select All
                  </Button>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {selectedItemIds.length} of {selectedList.items.length} selected
              </span>
            </div>
          )}

          {/* Items */}
          {selectedList.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>This list has no items</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {selectedList.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={(e) => {
                    // Only toggle if clicking on the row, not on checkbox or label
                    const target = e.target as HTMLElement
                    if (
                      target.tagName !== 'INPUT' &&
                      !target.closest('label')
                    ) {
                      handleToggleItem(item.id)
                    }
                  }}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItemIds.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleToggleItem(item.id)
                      }}
                      id={`reuse-item-${item.id}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor={`reuse-item-${item.id}`}
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        {item.name}
                      </label>
                      <div className="flex items-center space-x-1">
                        <Badge variant={getBadgeVariant(item.category)}>
                          {item.category}
                        </Badge>
                        {item.mealType && (
                          <Badge variant={getMealBadgeVariant(item.mealType)}>
                            {item.mealType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                      <span>{formatQuantity(item.quantity, item.unit)}</span>
                      {item.notes && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="truncate">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 justify-end pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isAddingItems || isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddItems}
          disabled={
            !selectedList ||
            selectedItemIds.length === 0 ||
            isAddingItems ||
            isLoading
          }
        >
          {isAddingItems
            ? 'Adding Items...'
            : `Add Selected Items (${selectedItemIds.length})`}
        </Button>
      </div>
    </div>
  )
}
