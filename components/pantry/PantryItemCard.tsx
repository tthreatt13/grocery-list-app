import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PantryItem } from '@/lib/types'

interface PantryItemCardProps {
  item: PantryItem
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function PantryItemCard({ item, onEdit, onDelete }: PantryItemCardProps) {
  const isLowStock = item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold
  
  // Get badge color variant based on category
  const getBadgeVariant = (category: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (category) {
      case 'Produce':
        return 'success'
      case 'Dairy':
        return 'primary'
      case 'Meat':
        return 'danger'
      case 'Bakery':
        return 'warning'
      case 'Grains':
        return 'warning'
      case 'Canned Goods':
        return 'primary'
      case 'Frozen':
        return 'primary'
      case 'Snacks':
        return 'warning'
      case 'Beverages':
        return 'primary'
      default:
        return 'default'
    }
  }
  
  // Calculate expiration status
  const getExpirationStatus = () => {
    if (!item.expirationDate) return null
    
    const now = new Date()
    const expirationDate = new Date(item.expirationDate)
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', text: 'Expired', variant: 'danger' as const }
    } else if (daysUntilExpiration <= 5) {
      return { status: 'expiring', text: 'Expires Soon', variant: 'warning' as const }
    }
    return null
  }

  const expirationStatus = getExpirationStatus()

  const formatExpirationDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header with name and category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 flex-1">{item.name}</h3>
          <Badge variant={getBadgeVariant(item.category)} className="text-xs whitespace-nowrap">
            {item.category}
          </Badge>
        </div>

        {/* Status badges */}
        {(isLowStock || expirationStatus) && (
          <div className="flex flex-wrap gap-1">
            {isLowStock && (
              <Badge variant="warning" className="text-xs">
                Low Stock
              </Badge>
            )}
            {expirationStatus && (
              <Badge variant={expirationStatus.variant} className="text-xs">
                {expirationStatus.text}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Quantity</span>
            <span className="font-medium text-gray-900">
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </span>
          </div>

          {item.expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expires</span>
              <span className={`text-sm ${expirationStatus ? 'font-medium' : ''}`}>
                {formatExpirationDate(item.expirationDate)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            {onEdit && (
              <button
                onClick={() => onEdit(item.id)}
                className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                aria-label="Edit item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                aria-label="Delete item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

