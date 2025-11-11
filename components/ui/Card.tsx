import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-lg shadow border border-gray-200', className)}
        {...props}
      >
        {header && (
          <div className="px-6 py-4 border-b border-gray-200">
            {typeof header === 'string' ? (
              <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
            ) : (
              header
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

Card.displayName = 'Card'

