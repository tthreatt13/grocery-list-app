import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PantryItem } from '@/lib/types'
import Image from 'next/image'

interface PantryItemCardProps {
  item: PantryItem
}

export default function PantryItemCard({ item }: PantryItemCardProps) {
  const isLowStock = item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold
  
  // Calculate expiration status
  const getExpirationStatus = () => {
    if (!item.expirationDate) return null
    
    const now = new Date()
    const expirationDate = new Date(item.expirationDate)
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', text: 'Expired', variant: 'error' as const }
    } else if (daysUntilExpiration <= 3) {
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
      {/* Image */}
      <div className="aspect-square relative bg-gray-200">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 flex-1">{item.name}</h3>
          <Badge variant="default" className="text-xs whitespace-nowrap">
            {item.category}
          </Badge>
        </div>

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
      </div>
    </Card>
  )
}

