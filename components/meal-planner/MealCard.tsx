import { Meal } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { getMealDisplayName } from '@/lib/utils'
import Image from 'next/image'

interface MealCardProps {
  meal: Meal
  onEdit: (_meal: Meal) => void
  onDelete: (_id: string) => void
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const getMealTypeColor = (
    mealType: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (mealType) {
      case 'Breakfast':
        return 'warning'
      case 'Lunch':
        return 'primary'
      case 'Dinner':
        return 'success'
      case 'Snack':
        return 'danger'
      default:
        return 'default'
    }
  }

  const ingredientCount = meal.ingredients?.length || 0
  const displayName = getMealDisplayName(meal)

  return (
    <div className="bg-warm-white rounded-lg border border-warm-gray-200 overflow-hidden hover:shadow-warm-md transition-warm">
      {/* Image placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-warm-peach-light to-warm-peach flex items-center justify-center relative">
        {meal.imageUrl ? (
          <Image
            src={meal.imageUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <svg
            className="w-16 h-16 text-warm-orange"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Meal placeholder"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <h3 className="font-semibold text-text-primary">{displayName}</h3>
            {meal.mealCategory === 'quick_meal' && (
              <span
                className="text-warm-orange text-lg"
                title="Quick Meal"
                aria-label="Quick Meal"
              >
                ⚡
              </span>
            )}
            {meal.mealCategory === 'eat_out' && (
              <span
                className="text-warm-blue text-lg"
                title="Eat Out"
                aria-label="Eat Out"
              >
                🍴
              </span>
            )}
          </div>
          <Badge variant={getMealTypeColor(meal.mealType)}>
            {meal.mealType}
          </Badge>
        </div>

        {meal.notes && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {meal.notes}
          </p>
        )}

        {ingredientCount > 0 && (
          <p className="text-xs text-text-tertiary mb-3">
            {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-2 pt-3 border-t border-warm-gray-100 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(meal)
            }}
            className="flex-1 px-3 py-1.5 text-sm text-warm-blue hover:bg-warm-blue-light rounded transition-warm"
            aria-label="Edit meal"
          >
            <svg
              className="w-4 h-4 inline mr-1"
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(meal.id)
            }}
            className="px-3 py-1.5 text-sm text-warm-coral hover:bg-warm-coral-light rounded transition-warm"
            aria-label="Delete meal"
          >
            <svg
              className="w-4 h-4 inline"
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
          </button>
        </div>
      </div>
    </div>
  )
}
