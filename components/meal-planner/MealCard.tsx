import { Meal } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import Image from 'next/image'

interface MealCardProps {
  meal: Meal
  onEdit: (meal: Meal) => void
  onDelete: (id: string) => void
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative">
        {meal.imageUrl ? (
          <Image
            src={meal.imageUrl}
            alt={meal.name}
            fill
            className="object-cover"
          />
        ) : (
          <svg
            className="w-16 h-16 text-orange-400"
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
          <h3 className="font-semibold text-gray-900 flex-1">{meal.name}</h3>
          <Badge variant={getMealTypeColor(meal.mealType)}>
            {meal.mealType}
          </Badge>
        </div>

        {meal.notes && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {meal.notes}
          </p>
        )}

        {ingredientCount > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(meal)}
            className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
            onClick={() => onDelete(meal.id)}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
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
