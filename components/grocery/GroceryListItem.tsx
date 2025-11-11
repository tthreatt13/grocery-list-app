import Checkbox from '@/components/ui/Checkbox'
import Badge from '@/components/ui/Badge'
import { GroceryItem } from '@/lib/types'
import { formatQuantity } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GroceryListItemProps {
  item: GroceryItem
  onToggle: (id: string) => void
}

export default function GroceryListItem({ item, onToggle }: GroceryListItemProps) {
  const getBadgeVariant = (category: string) => {
    switch (category) {
      case 'Produce':
        return 'success'
      case 'Dairy':
        return 'info'
      case 'Meat':
        return 'error'
      default:
        return 'default'
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
          <Badge variant={getBadgeVariant(item.category)}>
            {item.category}
          </Badge>
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

      <button
        className="text-gray-400 hover:text-red-600 transition-colors p-2"
        aria-label="Delete item"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

