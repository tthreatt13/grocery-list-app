import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 border rounded-lg shadow-warm-sm min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-warm-blue focus:border-transparent',
            'disabled:bg-warm-gray-100 disabled:cursor-not-allowed',
            'transition-warm',
            error
              ? 'border-warm-coral focus:ring-warm-coral'
              : 'border-warm-gray-300',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-warm-coral">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
