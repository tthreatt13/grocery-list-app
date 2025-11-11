'use client'

import { ItemCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selectedCategory: ItemCategory | 'All'
  onSelectCategory: (category: ItemCategory | 'All') => void
  itemCounts?: Record<string, number>
}

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  itemCounts = {},
}: CategoryFilterProps) {
  const categories: Array<ItemCategory | 'All'> = ['All', ...Object.values(ItemCategory)]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Filter by Category</h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const count = category === 'All' 
            ? Object.values(itemCounts).reduce((sum, c) => sum + c, 0)
            : itemCounts[category] || 0
          const isSelected = selectedCategory === category

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              )}
            >
              <span>{category}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    isSelected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

