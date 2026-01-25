import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-warm-gray-100 text-warm-gray-800',
      primary: 'bg-warm-blue-light text-warm-blue-dark',
      success: 'bg-warm-green-light text-warm-green-dark',
      warning: 'bg-warm-peach-light text-warm-peach-dark',
      danger: 'bg-warm-coral-light text-warm-coral-dark',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
