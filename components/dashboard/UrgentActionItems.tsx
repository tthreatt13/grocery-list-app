'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { UrgentItem } from '@/lib/api/dashboard'
import {
  getGroceryLists,
  addGroceryItem,
  GroceryListResponse,
} from '@/lib/api/grocery'

interface UrgentActionItemsProps {
  items: UrgentItem[]
  getToken: () => Promise<string | null>
  onItemAdded?: () => void
  onItemDismissed?: (itemId: number) => void
}

interface AddToListModalProps {
  open: boolean
  onClose: () => void
  item: UrgentItem | null
  onAdd: () => void
  getToken: () => Promise<string | null>
}

function AddToListModal({
  open,
  onClose,
  item,
  onAdd,
  getToken,
}: AddToListModalProps) {
  const [lists, setLists] = useState<GroceryListResponse[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  React.useEffect(() => {
    if (open && item) {
      loadGroceryLists()
    } else {
      setLists([])
      setSelectedListId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const loadGroceryLists = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      if (!token) {
        console.error('No authentication token available')
        return
      }

      const fetchedLists = await getGroceryLists(token)
      // Filter out archived lists
      const activeLists = fetchedLists.filter((list) => !list.is_archived)
      setLists(activeLists)
    } catch (error) {
      console.error('Error loading grocery lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!item || !selectedListId) return

    try {
      setIsAdding(true)
      const token = await getToken()
      if (!token) {
        console.error('No authentication token available')
        return
      }

      await addGroceryItem(
        selectedListId,
        {
          name: item.name,
          category: item.category,
          quantity: item.quantity || item.current_quantity,
        },
        token
      )

      onAdd()
      onClose()
    } catch (error) {
      console.error('Error adding item to list:', error)
    } finally {
      setIsAdding(false)
    }
  }

  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Grocery List"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Select a grocery list to add <strong>{item.name}</strong> to:
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-[var(--text-secondary)]">Loading lists...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">
              No active grocery lists found. Create a list first.
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="select-list"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Select List
            </label>
            <Select
              id="select-list"
              value={selectedListId?.toString() || ''}
              onChange={(e) =>
                setSelectedListId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={isAdding}
              aria-label="Select list"
              options={[
                { value: '', label: 'Choose a list...' },
                ...lists.map((list) => ({
                  value: list.id.toString(),
                  label: list.name,
                })),
              ]}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!selectedListId || isAdding || isLoading}
          >
            {isAdding ? 'Adding...' : 'Add to List'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function UrgentActionItems({
  items,
  getToken,
  onItemAdded,
  onItemDismissed,
}: UrgentActionItemsProps) {
  const [selectedItem, setSelectedItem] = useState<UrgentItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddToList = (item: UrgentItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleItemAdded = () => {
    if (onItemAdded) {
      onItemAdded()
    }
  }

  const handleDismiss = (itemId: number) => {
    if (onItemDismissed) {
      onItemDismissed(itemId)
    }
  }

  const getUrgencyBadge = (item: UrgentItem) => {
    if (item.type === 'low_stock') {
      return <Badge variant="warning">Low Stock</Badge>
    } else if (item.type === 'expiring_soon') {
      const days = item.days_until_expiration ?? 0
      return (
        <Badge variant="danger">
          {days === 0
            ? 'Expires Today'
            : days === 1
              ? 'Expires Tomorrow'
              : `Expiring in ${days} days`}
        </Badge>
      )
    }
    return null
  }

  const getUrgencyIcon = (item: UrgentItem) => {
    if (item.type === 'low_stock') {
      return (
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )
    } else if (item.type === 'expiring_soon') {
      return (
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    }
    return null
  }

  if (items.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
          Urgent Action Items
        </h2>
        <Card>
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-[var(--text-secondary)] font-medium">
              No urgent items requiring attention
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              All items are well-stocked and up to date!
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Urgent Action Items
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            {/* Mobile: Stack vertically with buttons at bottom */}
            {/* Desktop: Horizontal layout with buttons on right */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Urgency Icon */}
                <div className="flex-shrink-0 mt-1">{getUrgencyIcon(item)}</div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {item.name}
                    </h3>
                    {getUrgencyBadge(item)}
                    {item.category && (
                      <Badge variant="default">{item.category}</Badge>
                    )}
                  </div>

                  {/* Item Information */}
                  <div className="space-y-1 text-sm text-gray-600">
                    {item.type === 'low_stock' && (
                      <>
                        {item.current_quantity && (
                          <p>
                            Current:{' '}
                            <span className="font-medium">
                              {item.current_quantity}
                            </span>
                          </p>
                        )}
                        {item.low_stock_threshold !== undefined && (
                          <p>
                            Threshold:{' '}
                            <span className="font-medium">
                              {item.low_stock_threshold}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                    {item.type === 'expiring_soon' && item.expiration_date && (
                      <p>
                        Expires:{' '}
                        <span className="font-medium">
                          {new Date(item.expiration_date).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {/* Mobile: Side-by-side buttons at bottom */}
              {/* Desktop: Side-by-side on the right */}
              <div className="flex flex-row items-center gap-2 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--warm-gray-200)]">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddToList(item)}
                  aria-label={`Add ${item.name} to list`}
                  className="flex-1 sm:flex-none"
                >
                  <svg
                    className="w-4 h-4 mr-1"
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
                  Add to List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(item.id)}
                  aria-label={`Dismiss ${item.name}`}
                  className="flex-1 sm:flex-none"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AddToListModal
        open={isModalOpen}
        onClose={handleModalClose}
        item={selectedItem}
        onAdd={handleItemAdded}
        getToken={getToken}
      />
    </div>
  )
}
