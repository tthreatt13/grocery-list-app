'use client'

import { Select } from '@/components/ui/Select'
import { SortMethod } from '@/lib/types'

interface SortMethodSelectorProps {
  value: SortMethod
  onChange: (_sortMethod: SortMethod) => void
  className?: string
}

export default function SortMethodSelector({
  value,
  onChange,
  className,
}: SortMethodSelectorProps) {
  const sortMethodOptions = [
    { value: SortMethod.ENTRY_ORDER, label: SortMethod.ENTRY_ORDER },
    { value: SortMethod.CATEGORY, label: SortMethod.CATEGORY },
    { value: SortMethod.MEAL_TIME, label: SortMethod.MEAL_TIME },
  ]

  return (
    <div className={className}>
      <Select
        label="Sort by"
        options={sortMethodOptions}
        value={value}
        onChange={(e) => onChange(e.target.value as SortMethod)}
      />
    </div>
  )
}
