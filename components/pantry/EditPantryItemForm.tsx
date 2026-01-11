'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ItemCategory, PantryItem } from '@/lib/types'

interface EditPantryItemFormProps {
  item: PantryItem
  onSubmit: (item: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function EditPantryItemForm({
  item,
  onSubmit,
  onCancel,
  isSubmitting,
}: EditPantryItemFormProps) {
  // Initialize state from props - component remounts when item.id changes (via key prop)
  // This avoids setState in useEffect which can cause cascading renders
  const [name, setName] = useState(() => item.name)
  const [quantity, setQuantity] = useState<string>(() =>
    item.quantity.toString()
  )
  const [unit, setUnit] = useState(() => item.unit || '')
  const [category, setCategory] = useState<ItemCategory>(() => item.category)
  const [expirationDate, setExpirationDate] = useState(() =>
    item.expirationDate
      ? new Date(item.expirationDate).toISOString().split('T')[0]
      : ''
  )
  const [lowStockThreshold, setLowStockThreshold] = useState<string>(() =>
    item.lowStockThreshold ? item.lowStockThreshold.toString() : ''
  )
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Sync form state when item prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(item.name)

    setQuantity(item.quantity.toString())

    setUnit(item.unit || '')

    setCategory(item.category)

    setExpirationDate(
      item.expirationDate
        ? new Date(item.expirationDate).toISOString().split('T')[0]
        : ''
    )

    setLowStockThreshold(
      item.lowStockThreshold ? item.lowStockThreshold.toString() : ''
    )
    setErrors({})
  }, [
    item.id,
    item.name,
    item.quantity,
    item.unit,
    item.category,
    item.expirationDate,
    item.lowStockThreshold,
  ])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Item name is required'
    }

    const quantityNum = parseFloat(quantity)
    if (!quantity || isNaN(quantityNum) || quantityNum < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater'
    }

    if (lowStockThreshold) {
      const threshold = parseFloat(lowStockThreshold)
      if (isNaN(threshold) || threshold < 0) {
        newErrors.lowStockThreshold =
          'Low stock threshold must be a positive number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const quantityNum = parseFloat(quantity)
    const thresholdNum = lowStockThreshold
      ? parseFloat(lowStockThreshold)
      : undefined

    const updatedItem: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'> = {
      name: name.trim(),
      quantity: quantityNum,
      unit: unit.trim() || undefined,
      category,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      lowStockThreshold:
        thresholdNum && thresholdNum > 0 ? thresholdNum : undefined,
    }

    onSubmit(updatedItem)
  }

  const categoryOptions = Object.values(ItemCategory).map((cat) => ({
    value: cat,
    label: cat,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Input
          label="Item Name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Tomatoes"
          error={errors.name}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Quantity"
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.01"
            error={errors.quantity}
            disabled={isSubmitting}
            required
          />
        </div>
        <div>
          <Input
            label="Unit"
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g., pcs, lbs"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Select
          label="Category"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ItemCategory)}
          options={categoryOptions}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Input
          label="Expiration Date (Optional)"
          id="expirationDate"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Input
          label="Low Stock Threshold (Optional)"
          id="lowStockThreshold"
          type="number"
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(e.target.value)}
          placeholder="Alert when quantity drops below this"
          min="0"
          step="0.01"
          error={errors.lowStockThreshold}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
