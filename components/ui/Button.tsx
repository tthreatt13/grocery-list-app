import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', asChild = false, ...props },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    const variantStyles = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary:
        'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
      outline:
        'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
      ghost:
        'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    }

    const sizeStyles = {
      sm: 'text-sm px-3 py-2 min-h-[44px]',
      md: 'text-base px-4 py-2.5 min-h-[44px]',
      lg: 'text-lg px-6 py-3 min-h-[48px]',
    }

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement, {
        className: cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        ),
      })
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
