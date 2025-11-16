'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

// Flexible type to handle both API response and full GroceryList
interface ListItem {
  id: string | number
  name: string
  items?: Array<{ [key: string]: unknown }>
  item_count?: number
  sharedWith?: string[]
  createdBy?: string
  created_by?: number
  updatedAt?: Date | string
  updated_at?: string
}

interface SharedListsViewProps {
  lists: ListItem[]
}

export default function SharedListsView({ lists }: SharedListsViewProps) {
  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No shared lists yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Create a list and share it with your household members
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lists.map((list) => {
        // Handle both API response format (item_count) and full GroceryList format (items array)
        const itemCount = list.item_count ?? list.items?.length ?? 0
        
        // Handle both camelCase and snake_case for timestamps
        const updatedAt = list.updatedAt || list.updated_at
        const lastEditTime = updatedAt ? formatRelativeTime(updatedAt) : 'Recently'
        
        // Handle creator info
        const creatorName = list.createdBy || (list.created_by ? `User ${list.created_by}` : 'Unknown')
        
        // Handle shared with count
        const sharedWithCount = list.sharedWith?.length ?? 0
        const sharedText = sharedWithCount === 1 
          ? 'Shared with 1 person' 
          : sharedWithCount > 1 
            ? `Shared with ${sharedWithCount} people`
            : 'Shared with household'

        return (
          <Link key={list.id} href={`/grocery-lists/${list.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {list.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created by {creatorName}
                    </p>
                  </div>
                  <Badge variant="default">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {sharedText}
                  </span>
                  <span className="text-gray-500">
                    Last edited: {lastEditTime}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

