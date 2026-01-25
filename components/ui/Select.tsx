import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: SelectOption[]
  error?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      error,
      id,
      placeholder,
      children,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const selectId = id || generatedId

    // If value is empty string, add an empty option to support it
    const needsEmptyOption = value === ''

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 border rounded-lg shadow-warm-sm bg-warm-white',
            'focus:outline-none focus:ring-2 focus:ring-warm-blue focus:border-transparent',
            'disabled:bg-warm-gray-100 disabled:cursor-not-allowed',
            'transition-warm cursor-pointer',
            error ? 'border-warm-coral focus:ring-warm-coral' : 'border-warm-gray-300',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : undefined}
          value={value}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {needsEmptyOption && !placeholder && <option value="">--</option>}
          {options && options.length > 0
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-warm-coral">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
