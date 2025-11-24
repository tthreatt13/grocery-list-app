import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { GroceryItem, MealType } from '@/lib/types'
import { formatQuantity } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GroceryListItemProps {
  item: GroceryItem
  onToggle: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function GroceryListItem({
  item,
  onToggle,
  onEdit,
  onDelete,
}: GroceryListItemProps) {
  const getBadgeVariant = (
    category: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (category) {
      case 'Produce':
        return 'success'
      case 'Dairy':
        return 'primary'
      case 'Meat':
        return 'danger'
      case 'Bakery':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getMealBadgeVariant = (
    mealType?: MealType
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (mealType) {
      case MealType.BREAKFAST:
        return 'warning' // Yellow/orange for morning
      case MealType.LUNCH:
        return 'primary' // Blue for midday
      case MealType.DINNER:
        return 'danger' // Red for evening
      case MealType.SNACK:
        return 'success' // Green for snacks
      default:
        return 'default' // Gray for no meal assignment
    }
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <Checkbox
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        id={`item-${item.id}`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <label
            htmlFor={`item-${item.id}`}
            className={cn(
              'font-medium text-gray-900 cursor-pointer',
              item.checked && 'line-through text-gray-500'
            )}
          >
            {item.name}
          </label>
          <div className="flex items-center space-x-1">
            <Badge variant={getBadgeVariant(item.category)}>
              {item.category}
            </Badge>
            {item.mealType && (
              <Badge variant={getMealBadgeVariant(item.mealType)}>
                {item.mealType}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
          <span>{formatQuantity(item.quantity, item.unit)}</span>
          {item.notes && (
            <>
              <span className="text-gray-400">•</span>
              <span className="truncate">{item.notes}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {onEdit && (
          <button
            onClick={() => onEdit(item.id)}
            className="text-gray-400 hover:text-blue-600 transition-colors p-2"
            aria-label="Edit item"
          >
            <svg
              className="w-5 h-5"
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
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="text-gray-400 hover:text-red-600 transition-colors p-2"
            aria-label="Delete item"
          >
            <svg
              className="w-5 h-5"
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
        )}
      </div>
    </div>
  )
}
