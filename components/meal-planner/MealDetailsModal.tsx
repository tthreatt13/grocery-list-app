'use client'

import { Meal } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface MealDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  meal: Meal | null
  onEdit: (_meal: Meal) => void
  onDelete: (_mealId: string) => void
}

export default function MealDetailsModal({
  isOpen,
  onClose,
  meal,
  onEdit,
  onDelete,
}: MealDetailsModalProps) {
  if (!meal) return null

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this meal?')) {
      onDelete(meal.id)
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(meal)
    onClose()
  }

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'Breakfast':
        return 'bg-amber-100 text-amber-800'
      case 'Lunch':
        return 'bg-blue-100 text-blue-800'
      case 'Dinner':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Meal Details">
      <div className="space-y-4">
        {/* Meal Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
          <svg
            className="w-20 h-20 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Meal Info */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{meal.name}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${getMealTypeColor(
                meal.mealType
              )}`}
            >
              {meal.mealType}
            </span>
            <span className="text-sm text-gray-600">
              {formatDate(new Date(meal.date))}
            </span>
          </div>
        </div>

        {/* Notes */}
        {meal.notes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
            <p className="text-sm text-gray-600">{meal.notes}</p>
          </div>
        )}

        {/* Ingredients */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Ingredients ({meal.ingredients.length})
            </h4>
            <ul className="space-y-1">
              {meal.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Created By */}
        {meal.createdBy && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Created by {meal.createdBy}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button variant="primary" className="flex-1" onClick={handleEdit}>
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleDelete}
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
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
