'use client'

import { GrocerySuggestion } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface GrocerySuggestionCardProps {
  suggestion: GrocerySuggestion
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onApply?: (suggestion: GrocerySuggestion, index: number) => void
  index: number
}

export default function GrocerySuggestionCard({
  suggestion,
  isSelected,
  onSelect,
  onApply,
  index,
}: GrocerySuggestionCardProps) {
  const actionLabel =
    suggestion.action === 'add'
      ? 'Add'
      : suggestion.action === 'remove'
        ? 'Remove'
        : 'Swap'

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${suggestion.name}`}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {suggestion.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary">{actionLabel}</Badge>
                {suggestion.quantity && (
                  <span className="text-sm text-gray-600">
                    {suggestion.quantity}
                  </span>
                )}
                {suggestion.category && (
                  <span className="text-sm text-gray-500">
                    {suggestion.category}
                  </span>
                )}
              </div>
            </div>
            {onApply && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApply(suggestion, index)}
              >
                Apply
              </Button>
            )}
          </div>
          {suggestion.reason && (
            <p className="text-sm text-gray-600">{suggestion.reason}</p>
          )}
        </div>
      </div>
    </div>
  )
}
