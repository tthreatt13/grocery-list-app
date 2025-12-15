'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { GroceryListResponse } from '@/lib/api/grocery'

interface IngredientWithMealType {
  ingredient: string
  mealType: string
}

interface GenerateGroceryListFromMealsModalProps {
  open: boolean
  onClose: () => void
  ingredients: IngredientWithMealType[]
  onCreateList: (_data: {
    listName: string
    ingredients: IngredientWithMealType[]
  }) => void | Promise<void>
  onAddToList?: (_data: {
    listId: number
    ingredients: IngredientWithMealType[]
  }) => void | Promise<void>
  existingLists?: GroceryListResponse[]
  isCreating?: boolean
}

export default function GenerateGroceryListFromMealsModal({
  open,
  onClose,
  ingredients,
  onCreateList,
  onAddToList,
  existingLists = [],
  isCreating = false,
}: GenerateGroceryListFromMealsModalProps) {
  const prevOpenRef = useRef(open)
  const [mode, setMode] = useState<'create' | 'add'>('create')
  const [listName, setListName] = useState('Weekly Meal Plan')
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    () => new Set(ingredients.map((item) => item.ingredient))
  )

  const hasExistingLists = existingLists.length > 0

  // Reset form state when modal opens (transition from closed to open)
  // Using ref to track previous open state avoids setState-in-effect for same state
  // Note: This effect is necessary to reset modal form state when it opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Modal just opened - reset form state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIngredients(
        new Set(ingredients.map((item) => item.ingredient))
      )

      setListName('Weekly Meal Plan')

      setMode('create')

      setSelectedListId(null)
    }
    prevOpenRef.current = open
  }, [open, ingredients])

  const handleToggleIngredient = (ingredient: string) => {
    const newSelected = new Set(selectedIngredients)
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient)
    } else {
      newSelected.add(ingredient)
    }
    setSelectedIngredients(newSelected)
  }

  const handleSubmit = async () => {
    const selectedItems = ingredients.filter((item) =>
      selectedIngredients.has(item.ingredient)
    )

    if (mode === 'create') {
      await onCreateList({ listName, ingredients: selectedItems })
    } else if (mode === 'add' && onAddToList && selectedListId !== null) {
      await onAddToList({ listId: selectedListId, ingredients: selectedItems })
    }
  }

  const selectedCount = selectedIngredients.size
  const canSubmit =
    selectedCount > 0 &&
    !isCreating &&
    (mode === 'create' ? listName.trim().length > 0 : selectedListId !== null)

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
                  <div className="font-medium text-gray-900">
                    Create New List
                  </div>
                  <div className="text-sm text-gray-500">
                    Start a fresh grocery list from meal ingredients
                  </div>
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
                  <div className="font-medium text-gray-900">
                    Add to Existing List
                  </div>
                  <div className="text-sm text-gray-500">
                    Add ingredients to one of your current lists
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* List Name Input (Create Mode) */}
        {mode === 'create' && (
          <div>
            <label
              htmlFor="list-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
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
            <label
              htmlFor="select-list"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              disabled={isCreating}
              aria-label="Select list"
            >
              <option value="">Choose a list...</option>
              {existingLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Ingredients List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              Meal Ingredients
            </h3>
            <span className="text-sm text-gray-500">
              {selectedCount}{' '}
              {selectedCount === 1 ? 'ingredient' : 'ingredients'} selected
            </span>
          </div>

          {ingredients.length === 0 ? (
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
              <p className="text-gray-600 font-medium">No ingredients found</p>
              <p className="text-sm text-gray-500 mt-1">
                Add ingredients to your meals to generate a grocery list
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {ingredients.map((item, index) => (
                <label
                  key={`${item.ingredient}-${index}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={selectedIngredients.has(item.ingredient)}
                    onChange={() => handleToggleIngredient(item.ingredient)}
                    disabled={isCreating}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {item.ingredient}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.mealType}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Info Message */}
        {ingredients.length > 0 && (
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
                  {mode === 'create'
                    ? 'Create a grocery list from meal ingredients'
                    : 'Add ingredients to your grocery list'}
                </p>
                <p>
                  {mode === 'create'
                    ? 'Selected ingredients will be added to a new grocery list for your household. You can edit quantities and add more items later.'
                    : 'Selected ingredients will be added to the chosen grocery list. You can edit quantities later.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
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
