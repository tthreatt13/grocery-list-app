import { Meal } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface MealCardProps {
  meal: Meal
  onEdit: (meal: Meal) => void
  onDelete: (id: string) => void
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const getMealTypeColor = (mealType: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
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
      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
        <img
          src={meal.imageUrl || '/meal-placeholder.svg'}
          alt={meal.name}
          className="w-16 h-16 text-orange-400"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none'
          }}
        />
        {!meal.imageUrl && (
          <svg
            className="w-16 h-16 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
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
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{meal.notes}</p>
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

