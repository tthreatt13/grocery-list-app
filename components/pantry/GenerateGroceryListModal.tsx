'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { PantryItem } from '@/lib/types'
import { GroceryListResponse } from '@/lib/api/grocery'

interface GenerateGroceryListModalProps {
  open: boolean
  onClose: () => void
  lowStockItems: PantryItem[]
  onCreateList: (data: { listName: string; items: PantryItem[] }) => void | Promise<void>
  onAddToList?: (data: { listId: number; items: PantryItem[] }) => void | Promise<void>
  existingLists?: GroceryListResponse[]
  isCreating?: boolean
}

export default function GenerateGroceryListModal({
  open,
  onClose,
  lowStockItems,
  onCreateList,
  onAddToList,
  existingLists = [],
  isCreating = false,
}: GenerateGroceryListModalProps) {
  const [mode, setMode] = useState<'create' | 'add'>('create')
  const [listName, setListName] = useState('Weekly Shopping List')
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const hasExistingLists = existingLists.length > 0

  // Initialize all items as selected when modal opens
  useEffect(() => {
    if (open) {
      setSelectedItems(new Set(lowStockItems.map(item => item.id)))
      setListName('Weekly Shopping List')
      setMode('create')
      setSelectedListId(null)
    }
  }, [open, lowStockItems])

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSubmit = async () => {
    const items = lowStockItems.filter(item => selectedItems.has(item.id))
    
    if (mode === 'create') {
      await onCreateList({ listName, items })
    } else if (mode === 'add' && onAddToList && selectedListId !== null) {
      await onAddToList({ listId: selectedListId, items })
    }
  }

  const selectedCount = selectedItems.size
  const canSubmit = selectedCount > 0 && !isCreating && (
    mode === 'create' 
      ? listName.trim().length > 0 
      : selectedListId !== null
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Grocery List"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Mode Selection (only show if there are existing lists) */}
        {hasExistingLists && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose an Option
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="list-mode"
                  value="create"
                  checked={mode === 'create'}
                  onChange={() => setMode('create')}
                  disabled={isCreating}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-label="Create new list"
                />
                <div>
                  <div className="font-medium text-gray-900">Create New List</div>
                  <div className="text-sm text-gray-500">Start a fresh grocery list</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="list-mode"
                  value="add"
                  checked={mode === 'add'}
                  onChange={() => setMode('add')}
                  disabled={isCreating}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-label="Add to existing list"
                />
                <div>
                  <div className="font-medium text-gray-900">Add to Existing List</div>
                  <div className="text-sm text-gray-500">Add items to one of your current lists</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* List Name Input (Create Mode) */}
        {mode === 'create' && (
          <div>
            <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-2">
              List Name
            </label>
            <Input
              id="list-name"
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Enter list name"
              disabled={isCreating}
            />
          </div>
        )}

        {/* Existing List Selector (Add Mode) */}
        {mode === 'add' && hasExistingLists && (
          <div>
            <label htmlFor="select-list" className="block text-sm font-medium text-gray-700 mb-2">
              Select List
            </label>
            <Select
              id="select-list"
              value={selectedListId?.toString() || ''}
              onChange={(e) => setSelectedListId(e.target.value ? Number(e.target.value) : null)}
              disabled={isCreating}
              aria-label="Select list"
              options={[
                { value: '', label: 'Choose a list...' },
                ...existingLists.map((list) => ({
                  value: list.id.toString(),
                  label: list.name,
                })),
              ]}
            />
          </div>
        )}

        {/* Low Stock Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              Low Stock Items
            </h3>
            <span className="text-sm text-gray-500">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
              <p className="text-gray-600 font-medium">No low stock items found</p>
              <p className="text-sm text-gray-500 mt-1">
                All your pantry items are well stocked!
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {lowStockItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                    disabled={isCreating}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <Badge variant="warning" className="text-xs whitespace-nowrap">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Current: {item.quantity}
                        {item.unit ? ` ${item.unit}` : ''}
                      </span>
                      {item.lowStockThreshold !== undefined && (
                        <span className="text-orange-600">
                          Threshold: {item.lowStockThreshold}
                          {item.unit ? ` ${item.unit}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Info Message */}
        {lowStockItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  {mode === 'create' ? 'Create a grocery list from these items' : 'Add items to your grocery list'}
                </p>
                <p>
                  {mode === 'create'
                    ? 'Selected items will be added to a new grocery list for your household. You can edit quantities and add more items later.'
                    : 'Selected items will be added to the chosen grocery list. You can edit quantities later.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isCreating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {mode === 'create' ? 'Creating...' : 'Adding...'}
              </>
            ) : (
              <>
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                {mode === 'create' ? 'Create Grocery List' : 'Add to List'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

