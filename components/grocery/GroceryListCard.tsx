import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GroceryList } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

interface GroceryListCardProps {
  list: GroceryList
}

export default function GroceryListCard({ list }: GroceryListCardProps) {
  const totalItems = list.items.length
  const completedItems = list.items.filter(item => item.checked).length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <Link href={`/grocery-lists/${list.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900 flex-1">{list.name}</h3>
            {list.sharedWith.length > 0 && (
              <Badge variant="success" className="ml-2">
                Shared
              </Badge>
            )}
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
            <span>Updated {formatRelativeTime(list.updatedAt)}</span>
            {list.sharedWith.length > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{list.sharedWith.length + 1} members</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

