import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GroceryList } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

// Flexible type to handle both frontend types and API responses
interface FlexibleGroceryList {
  id: string | number
  name: string
  items?: Array<{ checked: boolean; [key: string]: unknown }>
  sharedWith?: string[]
  updatedAt?: Date | string
  updated_at?: string
  [key: string]: unknown
}

// Import the API response type
import { GroceryListWithItems } from '@/lib/api/grocery'

interface GroceryListCardProps {
  list: GroceryList | FlexibleGroceryList | GroceryListWithItems
  onDelete?: (listId: string | number) => void
}

export default function GroceryListCard({ list, onDelete }: GroceryListCardProps) {
  // Defensive checks for items and sharedWith arrays
  const items = list.items || []
  const sharedWith = (list as FlexibleGroceryList).sharedWith || []
  
  const totalItems = items.length
  const completedItems = items.filter((item) => item.checked).length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(list.id)
  }

  return (
    <Link href={`/grocery-lists/${list.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900 flex-1">{list.name}</h3>
            <div className="flex items-center space-x-2">
              {sharedWith.length > 0 && (
                <Badge variant="success">
                  Shared
                </Badge>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                  aria-label={`Delete list ${list.name}`}
                  title="Delete list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Items</span>
              <span className="font-medium text-gray-900">
                {completedItems} / {totalItems}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Updated {formatRelativeTime((list as FlexibleGroceryList).updatedAt || (list as FlexibleGroceryList).updated_at || new Date())}</span>
            {sharedWith.length > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{sharedWith.length + 1} members</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

