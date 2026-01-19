'use client'

import { MealSuggestion } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface MealSuggestionCardProps {
  suggestion: MealSuggestion
  weekStartDate: Date
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onEdit: (suggestion: MealSuggestion) => void
  onAdd?: (suggestion: MealSuggestion, index: number) => void
  index: number
}

export default function MealSuggestionCard({
  suggestion,
  weekStartDate,
  isSelected,
  onSelect,
  onEdit,
  onAdd,
  index,
}: MealSuggestionCardProps) {
  // Calculate the actual date for this meal
  // weekStartDate should be a Monday, and day_of_week is 0=Monday, 1=Tuesday, etc.
  const mealDate = new Date(weekStartDate)
  // Normalize to start of day to avoid timezone issues
  mealDate.setHours(0, 0, 0, 0)
  mealDate.setDate(weekStartDate.getDate() + suggestion.day_of_week)

  // Get day name (using EEE format which is supported)
  const dayName = formatDate(mealDate, 'EEE')

  // Capitalize meal type
  const mealTypeDisplay =
    suggestion.meal_type.charAt(0).toUpperCase() + suggestion.meal_type.slice(1)

  // Check if ingredient is a pantry item
  const isPantryItem = (ingredient: string) => {
    return suggestion.uses_pantry_items.includes(ingredient)
  }

  const hasPantryItems = suggestion.uses_pantry_items.length > 0

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${suggestion.meal_name}`}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {suggestion.meal_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary">{mealTypeDisplay}</Badge>
                <span className="text-sm text-gray-600">{dayName}</span>
                {hasPantryItems && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
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
                    Uses Pantry Items
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          {suggestion.ingredients && suggestion.ingredients.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Ingredients:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestion.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className={`text-sm px-2 py-1 rounded ${
                      isPantryItem(ingredient)
                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {suggestion.notes && (
            <p className="text-sm text-gray-600 mb-3">{suggestion.notes}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {onAdd && (
              <button
                onClick={() => onAdd(suggestion, index)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                aria-label={`Add ${suggestion.meal_name} to meal plan`}
              >
                <svg
                  className="w-4 h-4"
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
                Add
              </button>
            )}
            <button
              onClick={() => onEdit(suggestion)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              aria-label={`Edit ${suggestion.meal_name}`}
            >
              <svg
                className="w-4 h-4"
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
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
