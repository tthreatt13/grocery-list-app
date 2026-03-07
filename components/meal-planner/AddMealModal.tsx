'use client'

import { useState, useEffect, useRef } from 'react'
import { MealType, Meal } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  formatDate,
  normalizeIngredientsInput,
  parseRecipeInstructions,
} from '@/lib/utils'

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (_mealData: {
    name?: string
    notes?: string
    ingredients?: string
    mealCategory?: 'normal' | 'quick_meal' | 'eat_out'
  }) => Promise<void>
  onDelete?: (_mealId: string) => Promise<void> // Optional delete handler for edit mode
  mealType: MealType
  date: Date
  meal?: Meal | null // Optional meal for editing
}

export default function AddMealModal({
  isOpen,
  onClose,
  onAdd,
  onDelete,
  mealType,
  date,
  meal,
}: AddMealModalProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [mealCategory, setMealCategory] = useState<
    'normal' | 'quick_meal' | 'eat_out'
  >('normal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null)

  const isEditMode = !!meal

  // Pre-populate form when meal is provided (edit mode)
  useEffect(() => {
    if (isOpen && meal) {
      setName(meal.name || '')
      setNotes(meal.notes || '')
      setIngredients(meal.ingredients?.join(', ') || '')
      setMealCategory(meal.mealCategory || 'normal')
    }
  }, [isOpen, meal])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setNotes('')
      setIngredients('')
      setMealCategory('normal')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (notesTextareaRef.current && isOpen) {
      const textarea = notesTextareaRef.current
      textarea.style.height = 'auto'
      const newHeight = Math.max(textarea.scrollHeight, 64)
      textarea.style.height = `${newHeight}px`
    }
  }, [notes, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: either name or category must be provided
    // Category is always selected (defaults to 'normal'), so this is always valid
    // But we check that at least one meaningful value exists
    if (!name.trim() && !mealCategory) {
      setError('Please provide either a meal name or select a category')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Normalize ingredients input (handles bullets, numbers, newlines, etc.)
      const normalizedIngredients = normalizeIngredientsInput(ingredients)

      await onAdd({
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
        ingredients: normalizedIngredients || undefined,
        mealCategory: mealCategory,
      })

      // Clear form and close modal only on success
      setName('')
      setNotes('')
      setIngredients('')
      setMealCategory('normal')
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'add'} meal`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!meal || !onDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      // Note: confirm dialog is handled in handleMealDelete (page component)
      // The edit modal will be closed by the page component after successful deletion
      await onDelete(meal.id)
      // Don't close the modal here - let the page component handle it after confirmation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Edit Meal' : 'Add Meal'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {mealType} for {formatDate(date, 'EEEE, MMMM d')}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Meal Name (Optional)"
              id="meal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spaghetti Bolognese (optional)"
              disabled={isSubmitting}
            />

            <Select
              label="Meal Category"
              id="meal-category"
              value={mealCategory}
              onChange={(e) =>
                setMealCategory(
                  e.target.value as 'normal' | 'quick_meal' | 'eat_out'
                )
              }
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'quick_meal', label: 'Quick Meal' },
                { value: 'eat_out', label: 'Eat Out' },
              ]}
              disabled={isSubmitting}
            />

            {/* Formatted instructions preview for structured recipes */}
            {notes &&
              (() => {
                const parsed = parseRecipeInstructions(notes)
                if (parsed && parsed.isStructured && parsed.steps.length > 0) {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        {parsed.cookTime && (
                          <div className="text-sm font-medium text-gray-800 bg-orange-50 px-3 py-2 rounded-md border border-orange-200 mb-3">
                            Cook Time: {parsed.cookTime}
                          </div>
                        )}
                        <div>
                          {parsed.steps.map((step, index) => (
                            <div
                              key={step.number}
                              className="text-sm text-gray-600 flex items-start"
                              style={
                                index < parsed.steps.length - 1
                                  ? {
                                      paddingBottom: '1rem',
                                      marginBottom: '1rem',
                                      borderBottom: '2px solid #d1d5db',
                                    }
                                  : {}
                              }
                            >
                              <span className="mr-2 min-w-[3rem] font-bold text-gray-900">
                                Step {step.number}:
                              </span>
                              <span className="flex-1">{step.instruction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

            <div>
              <label
                htmlFor="meal-ingredients"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ingredients (Optional)
              </label>
              <textarea
                id="meal-ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Enter ingredients separated by commas (e.g., pasta, tomato sauce, ground beef)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate ingredients with commas
              </p>
            </div>

            <div>
              <label
                htmlFor="meal-notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cooking Instructions (Optional)
              </label>
              <textarea
                ref={notesTextareaRef}
                id="meal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Cook Time: 30 minutes\n\nStep 1: Whisk 2 cups flour and 3 eggs together\nStep 2: Fold in 1 cup spinach\nStep 3: Bake for 20 minutes`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[4rem] overflow-y-auto resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            {/* Delete button - only show in edit mode */}
            {isEditMode && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}

            {/* Cancel and Save buttons */}
            <div className="flex space-x-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditMode
                    ? 'Update Meal'
                    : 'Add Meal'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
