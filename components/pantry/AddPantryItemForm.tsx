'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ItemCategory, PantryItem } from '@/lib/types'

interface AddPantryItemFormProps {
  onSubmit: (item: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function AddPantryItemForm({ onSubmit, onCancel, isSubmitting }: AddPantryItemFormProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState<string>('1')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.OTHER)
  const [expirationDate, setExpirationDate] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Item name is required'
    }

    const quantityNum = parseFloat(quantity)
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (lowStockThreshold) {
      const threshold = parseFloat(lowStockThreshold)
      if (isNaN(threshold) || threshold < 0) {
        newErrors.lowStockThreshold = 'Low stock threshold must be a positive number'
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
    const thresholdNum = lowStockThreshold ? parseFloat(lowStockThreshold) : undefined

    const newItem: Omit<PantryItem, 'id' | 'addedAt' | 'updatedAt'> = {
      name: name.trim(),
      quantity: quantityNum,
      unit: unit.trim() || undefined,
      category,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      lowStockThreshold: thresholdNum && thresholdNum > 0 ? thresholdNum : undefined,
    }

    onSubmit(newItem)
    
    // Reset form
    setName('')
    setQuantity('1')
    setUnit('')
    setCategory(ItemCategory.OTHER)
    setExpirationDate('')
    setLowStockThreshold('')
    setErrors({})
  }

  const categoryOptions = Object.values(ItemCategory).map(cat => ({
    value: cat,
    label: cat,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            min="0.01"
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
        <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

