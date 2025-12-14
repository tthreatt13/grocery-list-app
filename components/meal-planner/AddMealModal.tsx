'use client'

import { useState, useEffect } from 'react'
import { MealType, Meal } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatDate, normalizeIngredientsInput } from '@/lib/utils'

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (mealData: {
    name: string
    notes?: string
    ingredients?: string
  }) => Promise<void>
  onDelete?: (mealId: string) => Promise<void> // Optional delete handler for edit mode
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!meal

  // Pre-populate form when meal is provided (edit mode)
  useEffect(() => {
    if (isOpen && meal) {
      setName(meal.name)
      setNotes(meal.notes || '')
      setIngredients(meal.ingredients?.join(', ') || '')
    }
  }, [isOpen, meal])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setNotes('')
      setIngredients('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Normalize ingredients input (handles bullets, numbers, newlines, etc.)
      const normalizedIngredients = normalizeIngredientsInput(ingredients)

      await onAdd({
        name: name.trim(),
        notes: notes.trim() || undefined,
        ingredients: normalizedIngredients || undefined,
      })

      // Clear form and close modal only on success
      setName('')
      setNotes('')
      setIngredients('')
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
      await onDelete(meal.id)
      onClose()
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
              label="Meal Name"
              id="meal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spaghetti Bolognese"
              required
              disabled={isSubmitting}
            />

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
                Notes (Optional)
              </label>
              <textarea
                id="meal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!name.trim() || isSubmitting || isDeleting}
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
